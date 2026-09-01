import type { CapacitorConfig } from "@capacitor/cli";

// IMPORTANTE: como o VidaTrack usa Server Actions e renderização no
// servidor (não dá pra virar um site 100% estático), o Capacitor aqui
// funciona como uma "casca nativa": o WebView carrega o site já
// publicado no Vercel, em vez de arquivos empacotados dentro do app.
//
// Notificações push (Web Push) NÃO têm garantia de funcionar com o
// app fechado dentro dessa WebView — dependeria do plugin nativo
// @capacitor/push-notifications + Firebase Cloud Messaging, que não
// está configurado aqui. O canal que já funciona sem depender disso
// é o Telegram (Etapa 13), porque é outro app cuidando da notificação.
//
// O modo offline (Etapa 10/11) usa Service Worker e deve funcionar
// normalmente, já que a WebView moderna do Android suporta isso —
// mas ainda não foi testado dentro de um .apk gerado de verdade.
const config: CapacitorConfig = {
  appId: "com.vidatrack.app",
  appName: "VidaTrack",
  webDir: "public", // exigido pelo Capacitor, mas não é o que carrega de fato
  server: {
    // Troque pela URL final do seu projeto no Vercel antes de gerar o app
    url: "https://SEU-PROJETO.vercel.app",
    cleartext: false,
  },
};

export default config;
