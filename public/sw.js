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

const VERSAO_CACHE = "v2";
const CACHE_PAGINAS = `vidatrack-paginas-${VERSAO_CACHE}`;
const CACHE_ESTATICOS = `vidatrack-estaticos-${VERSAO_CACHE}`;
const PAGINA_OFFLINE = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_PAGINAS).then((cache) => cache.add(PAGINA_OFFLINE))
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
    const cacheada = await cache.match(request);
    return cacheada || cache.match(PAGINA_OFFLINE);
  }
}

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

  event.waitUntil(
    self.registration.showNotification(dados.titulo, {
      body: dados.corpo,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-notificacao.png",
      vibrate: [200, 100, 200],
      silent: false,
      data: { url: dados.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/habitos";
  event.waitUntil(self.clients.openWindow(url));
});
