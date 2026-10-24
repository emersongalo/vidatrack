// Service worker — PWA, notificações push e cache básico para o app
// funcionar offline (ver README, seção "Modo offline").
//
// IMPORTANTE (Etapa 120): antes, esse arquivo só guardava o HTML das
// páginas visitadas — o JavaScript que faz o React funcionar de
// verdade (os arquivos em /_next/static/...) não era guardado por
// aqui, só ficava no cache padrão do navegador, que pode ser limpo ou
// nem existir ainda num celular novo. Resultado: mesmo com a página
// "offline" preparada, sem esses arquivos o app carregava a casca
// mas não reagia a toque nenhum sem internet. Agora esse cache de
// arquivos estáticos é próprio nosso e não depende do navegador.

const VERSAO_CACHE = "v7"; // Etapa 348 — todas as telas abrem sem internet (349 não muda o cache)
const CACHE_PAGINAS = `vidatrack-paginas-${VERSAO_CACHE}`;
const CACHE_ESTATICOS = `vidatrack-estaticos-${VERSAO_CACHE}`;
const PAGINA_OFFLINE = "/offline";
// Etapa 131: agora que /habitos (Hoje) é uma tela real que já lê do
// retrato local sozinha (Etapas 126+), ela é a que abre por padrão
// quando não há internet nem para redirecionar da página inicial —
// a tela simplificada em /offline vira só o último recurso, se essa
// nem sequer tiver sido visitada uma vez ainda.
const PAGINA_PADRAO_OFFLINE = "/habitos";
// Etapa 342 — a tela offline de verdade (hábitos, tarefas, agenda e
// lançar gasto sem internet). Vem também dentro do app Android.
const APP_OFFLINE = "/offline-app.html";
// telas principais que ficam guardadas prontas pra abrir sem internet
// (a lista completa vem do app: lib/offline/rotasOffline.ts)
const TELAS_PRINCIPAIS = ["/dashboard", "/habitos", "/tarefas", "/tarefas/agenda", "/financas", "/financas/extrato"];

// Etapa 348 — telas com id no endereço (/habitos/<id>, /financas/<id>/editar…)
// ficam guardadas UMA vez como "modelo" (com este id de mentira). Como as
// telas leem os dados do aparelho, sem internet basta trocar o id de
// mentira pelo de verdade no HTML — e a tela abre com o item certo.
// (mesmo valor de lib/offline/rotasOffline.ts e do offline-app.html)
const ID_MODELO = "00000000-0000-4000-8000-000000000000";
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function caminhoModelo(caminho) {
  const partes = caminho.split("/");
  const i = partes.findIndex((p) => RE_UUID.test(p));
  if (i < 0 || partes[i].toLowerCase() === ID_MODELO) return null;
  const id = partes[i];
  partes[i] = ID_MODELO;
  return { modelo: partes.join("/"), id };
}
async function respostaDoModelo(cache, caminho) {
  const m = caminhoModelo(caminho);
  if (!m) return null;
  const guardada = await cache.match(m.modelo, { ignoreSearch: true });
  if (!guardada) return null;
  const html = (await guardada.text()).split(ID_MODELO).join(m.id);
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
/** guarda a tela visitada; se tiver id, guarda como modelo (não enche o cache com 1 cópia por item) */
async function guardarTela(request, resposta) {
  try {
    const cache = await caches.open(CACHE_PAGINAS);
    const url = new URL(request.url);
    const rsc = request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
    const html = (resposta.headers.get("content-type") || "").includes("text/html");
    const m = !rsc && html ? caminhoModelo(url.pathname) : null;
    if (m) {
      const texto = (await resposta.text()).split(m.id).join(ID_MODELO);
      await cache.put(m.modelo, new Response(texto, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }));
      return;
    }
    if (caminhoModelo(url.pathname)) return; // RSC de item: não guarda
    await cache.put(request, resposta);
  } catch {}
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_PAGINAS).then((cache) =>
      Promise.all([cache.add(PAGINA_OFFLINE).catch(() => {}), cache.add(APP_OFFLINE).catch(() => {})])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Cache de uma versão anterior do app não serve pra nada — os
      // arquivos estáticos têm nome novo a cada build (hash no nome),
      // então o antigo só ocupa espaço à toa.
      caches.keys().then((chaves) =>
        Promise.all(
          chaves
            .filter((chave) => chave.startsWith("vidatrack-") && chave !== CACHE_PAGINAS && chave !== CACHE_ESTATICOS)
            .map((chave) => caches.delete(chave))
        )
      ),
      self.clients.claim(),
    ])
  );
});

// Arquivos estáticos do Next (JS, CSS) e ícones: o nome do arquivo já
// muda sozinho quando o conteúdo muda (hash no nome), então uma vez
// baixado, aquele arquivo específico NUNCA vai mudar — pode ficar
// guardado pra sempre, sem precisar checar a rede de novo.
function ehArquivoEstaticoImutavel(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json"
  );
}

// Navegação de página (abrir/recarregar uma tela): tenta a rede
// primeiro (dado mais atual), e se não conseguir, cai pro que foi
// guardado da última vez que essa mesma página carregou.
async function responderComRedeOuCache(request) {
  try {
    const resposta = await fetch(request);
    // Etapa 348 — só guarda tela de verdade (não erro nem redirecionamento pro login)
    if (resposta.ok && !resposta.redirected) guardarTela(request, resposta.clone());
    return resposta;
  } catch {
    const cache = await caches.open(CACHE_PAGINAS);
    const url = new URL(request.url);
    // Etapa 342 — ordem: a mesma tela (mesmo sem os ?parâmetros) →
    // a entrada "/" vira o Início → Início/Hoje guardados → a tela
    // offline completa → o aviso simples. Nunca devolve "nada" (era
    // isso que fazia o Android mostrar "Página da Web não disponível").
    const caminho = url.pathname === "/" ? "/dashboard" : url.pathname;
    const navegacao = request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html");
    const rsc = request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
    // Etapa 343 — guarda qual tela a pessoa tentou abrir: a tela offline
    // usa isso pra abrir a tela certa (se ela estiver guardada)
    if ((navegacao || rsc) && !caminho.startsWith("/offline")) {
      try {
        await cache.put("/__vt-rota", new Response(caminho + url.search.replace(/[?&]_rsc=[^&]*/, ""), { headers: { "Content-Type": "text/plain" } }));
      } catch {}
    }
    // pedido "por dentro" do app (RSC) sem cópia: falha de propósito, aí
    // o próprio app abre a tela inteira (que cai no caminho abaixo)
    if (rsc && !navegacao) return (await cache.match(request)) || Response.error();
    const achado =
      (await cache.match(request)) ||
      (await cache.match(caminho, { ignoreSearch: true })) ||
      (navegacao ? await respostaDoModelo(cache, caminho) : null) ||
      (navegacao ? (await cache.match(APP_OFFLINE)) || (await cache.match(PAGINA_OFFLINE)) : null);
    return achado || Response.error();
  }
}

// Etapa 342 — o app pede (com internet) pra deixar as telas principais
// guardadas, assim elas abrem mesmo se a primeira coisa do dia for
// abrir o app sem sinal.
async function aquecerUmaTela(rota, cache, estaticos) {
  try {
    const resp = await fetch(rota, { credentials: "include", headers: { Accept: "text/html" } });
    // só guarda a tela de verdade (não a de login, se a sessão caiu)
    if (!resp.ok || resp.redirected) return;
    const html = await resp.clone().text();
    await cache.put(rota, resp.clone());
    // Etapa 343 — e os arquivos (JS/CSS) que essa tela precisa pra ligar sem internet
    const arquivos = [
      ...[...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]),
      // pedaços que a tela carrega depois (vêm citados dentro do HTML)
      ...[...html.matchAll(/(static\/(?:chunks|css)\/[A-Za-z0-9_\-\/.\[\]%]+?\.(?:js|css))/g)].map((m) => "/_next/" + m[1]),
    ];
    for (const arq of new Set(arquivos)) {
      if (await estaticos.match(arq)) continue;
      try {
        const r = await fetch(arq);
        if (r.ok) await estaticos.put(arq, r);
      } catch {}
    }
  } catch {
    /* sem internet agora — tenta na próxima */
  }
}

// Etapa 348 — várias telas: baixa de 3 em 3 pra terminar logo sem
// sobrecarregar a internet do celular
async function aquecerTelas(rotas) {
  const cache = await caches.open(CACHE_PAGINAS);
  const estaticos = await caches.open(CACHE_ESTATICOS);
  const lista = [...new Set(rotas)];
  let proxima = 0;
  const trabalhador = async () => {
    while (proxima < lista.length) {
      const rota = lista[proxima++];
      await aquecerUmaTela(rota, cache, estaticos);
    }
  };
  await Promise.all([trabalhador(), trabalhador(), trabalhador()]);
  try {
    const app = await fetch(APP_OFFLINE, { cache: "no-store" });
    if (app.ok) await cache.put(APP_OFFLINE, app);
  } catch {}
}

// Etapa 349 — dados em dia sem abrir o app (iPhone/navegador): a cada
// notificação que chega (e, no Chrome com o app instalado, de tempos em
// tempos) o Service Worker baixa o retrato e grava no MESMO lugar que o
// app lê (IndexedDB "vidatrack" → "retrato"). O que ainda está na fila
// do aparelho é reaplicado pelo app quando ele abre.
const VERSAO_SNAPSHOT = 2; // igual a lib/offline/snapshot.ts
function bancoRetrato() {
  return new Promise((ok, erro) => {
    const pedido = indexedDB.open("vidatrack", 1);
    pedido.onupgradeneeded = () => {
      if (!pedido.result.objectStoreNames.contains("retrato")) pedido.result.createObjectStore("retrato");
    };
    pedido.onsuccess = () => ok(pedido.result);
    pedido.onerror = () => erro(pedido.error);
  });
}
async function lerRetrato() {
  const banco = await bancoRetrato();
  return new Promise((ok) => {
    const req = banco.transaction("retrato", "readonly").objectStore("retrato").get("vidatrack-snapshot-offline");
    req.onsuccess = () => ok(req.result || null);
    req.onerror = () => ok(null);
  });
}
async function gravarRetrato(valor) {
  const banco = await bancoRetrato();
  await new Promise((ok, erro) => {
    const tx = banco.transaction("retrato", "readwrite");
    tx.objectStore("retrato").put(valor, "vidatrack-snapshot-offline");
    tx.oncomplete = () => ok();
    tx.onerror = () => erro(tx.error);
    tx.onabort = () => erro(tx.error);
  });
}
async function atualizarRetratoNoFundo(intervaloMinimoMs) {
  try {
    const cache = await caches.open(CACHE_PAGINAS);
    const ultima = await cache.match("/__vt-retrato-em");
    if (ultima && Date.now() - Number(await ultima.text()) < intervaloMinimoMs) return;
    const resp = await fetch("/api/offline/baixar-tudo", { credentials: "include", cache: "no-store" });
    if (!resp.ok || resp.redirected) return; // deslogado: nada a fazer
    const dados = await resp.json();
    if (!dados || typeof dados !== "object" || !dados.baixadoEm) return;
    const atual = await lerRetrato();
    if (atual && atual.baixadoEm && String(atual.baixadoEm) >= String(dados.baixadoEm)) return;
    await gravarRetrato({ ...dados, versao: VERSAO_SNAPSHOT });
    await cache.put("/__vt-retrato-em", new Response(String(Date.now()), { headers: { "Content-Type": "text/plain" } }));
    // telas abertas: relê o retrato novo
    const telas = await self.clients.matchAll({ includeUncontrolled: true });
    for (const t of telas) t.postMessage({ tipo: "retrato-atualizado" });
  } catch {
    /* sem internet ou servidor fora: fica pra próxima */
  }
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "vt-retrato") event.waitUntil(atualizarRetratoNoFundo(30 * 60 * 1000));
});

self.addEventListener("message", (event) => {
  const dados = event.data || {};
  if (dados.tipo === "aquecer") {
    const rotas = Array.isArray(dados.rotas) ? dados.rotas.filter((r) => typeof r === "string" && r.startsWith("/")) : TELAS_PRINCIPAIS;
    event.waitUntil(aquecerTelas(rotas.length ? rotas : TELAS_PRINCIPAIS));
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estáticos imutáveis: cache primeiro. Se já baixou uma vez (com
  // internet), nunca mais precisa de rede pra esse arquivo específico
  // — é isso que faz o app conseguir "ligar" (JS carregar e o React
  // hidratar) mesmo sem conexão nenhuma.
  if (ehArquivoEstaticoImutavel(url)) {
    event.respondWith(
      caches.match(request).then((cacheada) => {
        if (cacheada) return cacheada;
        return fetch(request).then((resposta) => {
          if (resposta.ok) {
            const copia = resposta.clone();
            caches.open(CACHE_ESTATICOS).then((cache) => cache.put(request, copia));
          }
          return resposta;
        });
      })
    );
    return;
  }

  // Etapa 130 — clicar num link DENTRO do app (Hoje → Estatísticas,
  // por exemplo) não é uma "navegação" de verdade pro navegador: o
  // Next busca só o pedaço novo da tela por baixo dos panos, numa
  // chamada que `request.mode` não marca como "navigate". Antes,
  // isso caía fora dos dois casos abaixo e falhava direto sem
  // internet — mesmo a página de destino já tendo tudo de que
  // precisava salvo localmente. Agora qualquer busca (GET) pro nosso
  // próprio site — navegação de verdade ou clique por dentro — usa a
  // mesma estratégia: rede primeiro, cache de uma visita anterior
  // como saída de emergência. Não entra aqui nada que seja POST
  // (uma Ação de Servidor, tipo salvar algo, sempre precisa ir pra
  // rede de verdade) nem pedido pra outro site (Supabase etc.).
  // Etapa 342 — chamadas de API (inclui o "teste de conexão" da tela
  // offline) vão sempre direto pra rede, sem resposta guardada.
  if (url.pathname.startsWith("/api/")) return;

  if (request.method === "GET" && url.origin === self.location.origin) {
    event.respondWith(responderComRedeOuCache(request));
  }
});

self.addEventListener("push", (event) => {
  let dados = { titulo: "VidaTrack", corpo: "Você tem um lembrete.", url: "/habitos" };
  try {
    dados = { ...dados, ...event.data.json() };
  } catch {
    // Se não vier JSON, usa os valores padrão acima.
  }

  const opcoes = {
    body: dados.corpo,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-notificacao.png",
    vibrate: [200, 100, 200],
    silent: false,
    data: { url: dados.url, habitoId: dados.habitoId, dia: dados.data },
  };
  // Etapa 221 — lembrete de hábito: botão "✓ Feito" marca sem abrir o app
  if (dados.habitoId) {
    opcoes.actions = [{ action: "feito", title: "✓ Feito" }];
    opcoes.tag = "habito-" + dados.habitoId;
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(dados.titulo, opcoes),
      // Etapa 349 — aproveita a notificação pra deixar os dados em dia
      atualizarRetratoNoFundo(15 * 60 * 1000),
    ])
  );
});

async function marcarHabitoPelaNotificacao(dados) {
  try {
    const resposta = await fetch("/api/widget/marcar", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitoId: dados.habitoId, data: dados.dia, acao: "marcar" }),
    });
    if (resposta.ok) return;
    await self.registration.showNotification("VidaTrack", {
      body: resposta.status === 401 ? "Não consegui marcar: entre no app de novo." : "Não consegui marcar agora. Toque para abrir.",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-notificacao.png",
      data: { url: dados.url || "/habitos" },
    });
  } catch {
    await self.registration.showNotification("VidaTrack", {
      body: "Sem conexão. Toque para abrir o app e marcar.",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-notificacao.png",
      data: { url: dados.url || "/habitos" },
    });
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const dados = event.notification.data || {};
  if (event.action === "feito" && dados.habitoId) {
    event.waitUntil(marcarHabitoPelaNotificacao(dados));
    return;
  }
  const url = dados.url ?? "/habitos";
  event.waitUntil(self.clients.openWindow(url));
});
