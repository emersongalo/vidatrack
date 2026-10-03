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

// Etapa 240 — voltar pra cor normal: em vez de "restaurar" (que no app
// às vezes voltava pro vermelho/verde, porque guardava a última cor como
// se fosse a original), pinta explicitamente com a cor de fundo do app
// (escuro ou claro, conforme o tema).
function paraHex(cor: string): string | null {
  const m = cor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return /^#[0-9a-f]{6}$/i.test(cor.trim()) ? cor.trim() : null;
  return "#" + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("");
}

export function corDeFundoDoApp(): string {
  try {
    const hex = paraHex(getComputedStyle(document.body).backgroundColor);
    if (hex && hex !== "#000000") return hex;
  } catch {}
  return document.documentElement.getAttribute("data-theme") === "light" ? "#FCFBF9" : "#0F1013";
}

export function definirCorBarraStatus(cor: string | null) {
  if (typeof document === "undefined") return;
  const alvo = cor ?? corDeFundoDoApp();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", alvo);
  const p = obterPlugin();
  if (!p) return;
  p.definirCor({ cor: alvo }).catch(() => {
    /* app antigo, sem o plugin */
  });
}

/** Rotas que pintam o topo com cor própria (lançamento e hábito) */
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const ROTAS_COLORIDAS = [
  /^\/financas\/nova\/?$/,
  new RegExp(`^/financas/${UUID}/editar/?$`, "i"),
  /^\/habitos\/novo\/?$/,
  new RegExp(`^/habitos/${UUID}(/editar)?/?$`, "i"),
];
export function rotaTemCorPropria(caminho: string): boolean {
  return ROTAS_COLORIDAS.some((r) => r.test(caminho));
}
