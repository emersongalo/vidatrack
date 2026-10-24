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

const VERSAO_CACHE = "v6"; // Etapa 343 — app completo sem internet
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
const TELAS_PRINCIPAIS = ["/dashboard", "/habitos", "/tarefas", "/financas", "/tarefas/agenda"];

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
    const copia = resposta.clone();
    caches.open(CACHE_PAGINAS).then((cache) => cache.put(request, copia));
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
      (navegacao ? (await cache.match(APP_OFFLINE)) || (await cache.match(PAGINA_OFFLINE)) : null);
    return achado || Response.error();
  }
}

// Etapa 342 — o app pede (com internet) pra deixar as telas principais
// guardadas, assim elas abrem mesmo se a primeira coisa do dia for
// abrir o app sem sinal.
async function aquecerTelas(rotas) {
  const cache = await caches.open(CACHE_PAGINAS);
  for (const rota of rotas) {
    try {
      const resp = await fetch(rota, { credentials: "include", headers: { Accept: "text/html" } });
      // só guarda a tela de verdade (não a de login, se a sessão caiu)
      if (resp.ok && !resp.redirected) {
        const html = await resp.clone().text();
        await cache.put(rota, resp.clone());
        // Etapa 343 — e os arquivos (JS/CSS) que essa tela precisa pra ligar sem internet
        const arquivos = [
          ...[...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]),
          // pedaços que a tela carrega depois (vêm citados dentro do HTML)
          ...[...html.matchAll(/(static\/(?:chunks|css)\/[A-Za-z0-9_\-\/.\[\]%]+?\.(?:js|css))/g)].map((m) => "/_next/" + m[1]),
        ];
        const estaticos = await caches.open(CACHE_ESTATICOS);
        for (const arq of new Set(arquivos)) {
          if (await estaticos.match(arq)) continue;
          try {
            const r = await fetch(arq);
            if (r.ok) await estaticos.put(arq, r);
          } catch {}
        }
      }
    } catch {
      /* sem internet agora — tenta na próxima */
    }
  }
  try {
    const app = await fetch(APP_OFFLINE, { cache: "no-store" });
    if (app.ok) await cache.put(APP_OFFLINE, app);
  } catch {}
}

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

  event.waitUntil(self.registration.showNotification(dados.titulo, opcoes));
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
