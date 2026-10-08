// Etapa 276 — paletas de cor extras (tema escuro), liberadas como
// recompensa de convite. Ficam salvas neste aparelho.
export const CHAVE_PALETA = "vidatrack-paleta";
export const CHAVE_PALETAS_LIBERADAS = "vidatrack-paletas-liberadas";

export type Paleta = "padrao" | "oceano" | "floresta" | "ameixa";

export const PALETAS: { valor: Paleta; nome: string; emoji: string; amostra: string[]; recompensa: boolean }[] = [
  { valor: "padrao", nome: "Grafite", emoji: "🌑", amostra: ["#0F1013", "#16171C", "#1F2127"], recompensa: false },
  { valor: "oceano", nome: "Oceano", emoji: "🌊", amostra: ["#0B121C", "#101A28", "#172436"], recompensa: true },
  { valor: "floresta", nome: "Floresta", emoji: "🌲", amostra: ["#0C1410", "#121D17", "#19271F"], recompensa: true },
  { valor: "ameixa", nome: "Ameixa", emoji: "🍇", amostra: ["#140E1A", "#1D1525", "#271D32"], recompensa: true },
];

export function lerPaleta(): Paleta {
  try {
    const p = localStorage.getItem(CHAVE_PALETA);
    return p === "oceano" || p === "floresta" || p === "ameixa" ? p : "padrao";
  } catch {
    return "padrao";
  }
}

export function aplicarPaleta(p: Paleta) {
  try {
    if (p === "padrao") localStorage.removeItem(CHAVE_PALETA);
    else localStorage.setItem(CHAVE_PALETA, p);
  } catch {
    /* sem armazenamento */
  }
  const html = document.documentElement;
  if (p === "padrao") html.removeAttribute("data-paleta");
  else html.setAttribute("data-paleta", p);
}

export function paletasLiberadasNoAparelho(): boolean {
  try {
    return localStorage.getItem(CHAVE_PALETAS_LIBERADAS) === "1";
  } catch {
    return false;
  }
}

export function marcarPaletasLiberadas() {
  try {
    localStorage.setItem(CHAVE_PALETAS_LIBERADAS, "1");
  } catch {
    /* sem armazenamento */
  }
}

// roda antes da 1ª pintura (no layout)
export const SCRIPT_PALETA = `try{var p=localStorage.getItem('${CHAVE_PALETA}');if(p==='oceano'||p==='floresta'||p==='ameixa')document.documentElement.setAttribute('data-paleta',p)}catch(e){}`;
