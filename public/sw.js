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

  // Navegação de página (abrir/recarregar uma tela): tenta a rede
  // primeiro (dado mais atual), e se não conseguir, cai pro que foi
  // guardado da última vez que essa mesma página carregou.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE_PAGINAS).then((cache) => cache.put(request, copia));
          return resposta;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_PAGINAS);
          const cacheada = await cache.match(request);
          return cacheada || cache.match(PAGINA_OFFLINE);
        })
    );
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
