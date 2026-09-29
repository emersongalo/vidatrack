// Etapa 223 — cor da barra de status do celular (a de cima, com a hora).
// No app Android usa o plugin nativo "BarraStatus" (app 1.1.0+); no
// navegador/PWA troca a <meta name="theme-color">. App antigo sem o
// plugin: não faz nada (sem erro).
import { registerPlugin } from "@capacitor/core";

type BarraStatusAPI = {
  definirCor: (o: { cor: string }) => Promise<void>;
  restaurar: () => Promise<void>;
};

let plugin: BarraStatusAPI | null = null;
function obterPlugin(): BarraStatusAPI | null {
  if (typeof window === "undefined") return null;
  if (!(window as any).Capacitor?.isNativePlatform?.()) return null;
  if (!plugin) plugin = registerPlugin<BarraStatusAPI>("BarraStatus");
  return plugin;
}

let temaOriginal: string | null = null;

export function definirCorBarraStatus(cor: string | null) {
  if (typeof document === "undefined") return;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    if (temaOriginal === null) temaOriginal = meta.getAttribute("content");
    meta.setAttribute("content", cor ?? temaOriginal ?? "#0F1013");
    if (cor === null) temaOriginal = null;
  }
  const p = obterPlugin();
  if (!p) return;
  (cor ? p.definirCor({ cor }) : p.restaurar()).catch(() => {
    /* app antigo, sem o plugin */
  });
}
