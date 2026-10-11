// Etapa 296 — "app da tela de início" (PWA) no iPhone/Android, fora do app
// nativo. No iPhone esse app NÃO compartilha o login com o Safari: quem
// cria a conta ou confirma o e-mail no Safari e depois abre pelo ícone
// chega deslogado. Aqui só detectamos isso pra mostrar o caminho certo.

export function ehAppDaTelaInicial(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if ((window as any).Capacitor?.isNativePlatform?.()) return false; // app Android nativo
    if ((navigator as any).standalone === true) return true; // iPhone
    return window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  } catch {
    return false;
  }
}

export function ehIphone(ua: string = typeof navigator !== "undefined" ? navigator.userAgent : ""): boolean {
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && typeof document !== "undefined" && "ontouchend" in document);
}
