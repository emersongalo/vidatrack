import type { CapacitorConfig } from "@capacitor/cli";

// IMPORTANTE: como o VidaTrack usa Server Actions e renderização no
// servidor (não dá pra virar um site 100% estático), o Capacitor aqui
// funciona como uma "casca nativa": o WebView carrega o site já
// publicado no Vercel, em vez de arquivos empacotados dentro do app.
//
// Notificações push (Etapa 42): Web Push sozinho NÃO tem garantia de
// funcionar com o app fechado dentro dessa WebView — por isso agora
// tem também o @capacitor/push-notifications + Firebase Cloud
// Messaging, que é o canal nativo de verdade. Siga o passo a passo no
// README ("Configurar notificação push nativa") antes de gerar o
// build — precisa do arquivo google-services.json na pasta
// android/app, que só existe depois de rodar `npx cap add android`.
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
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
