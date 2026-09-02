// Service worker — PWA, notificações push e cache básico para a
// agenda "Hoje" funcionar offline (ver README, seção "Modo offline").

const CACHE_PAGINAS = "vidatrack-paginas-v1";
const PAGINA_OFFLINE = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_PAGINAS).then((cache) => cache.add(PAGINA_OFFLINE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Só cuidamos de navegação de página (abrir/recarregar uma tela).
  // Chamadas de API, imagens etc. seguem o comportamento padrão do navegador.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resposta) => {
          // Deu certo: guarda uma cópia pra usar se cair a conexão depois.
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
      badge: "/icons/icon-192.png",
      data: { url: dados.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/habitos";
  event.waitUntil(self.clients.openWindow(url));
});
