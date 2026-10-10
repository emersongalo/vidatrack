// Etapa 281 — tema: escuro, claro, automático (segue o celular) ou por
// horário (claro das 6h às 18h). Fica salvo neste aparelho.
export const CHAVE_TEMA = "vidatrack-tema";
export type PreferenciaTema = "dark" | "light" | "auto" | "horario";
export type Tema = "dark" | "light";

export const OPCOES_TEMA: { valor: PreferenciaTema; rotulo: string }[] = [
  { valor: "dark", rotulo: "🌙 Escuro" },
  { valor: "light", rotulo: "☀️ Claro" },
  { valor: "auto", rotulo: "📱 Igual ao celular" },
  { valor: "horario", rotulo: "🕕 Dia claro, noite escuro" },
];

export function lerPreferenciaTema(): PreferenciaTema {
  try {
    const t = localStorage.getItem(CHAVE_TEMA);
    return t === "light" || t === "auto" || t === "horario" ? t : "dark";
  } catch {
    return "dark";
  }
}

/** Qual tema vale agora, dada a preferência. */
export function temaEfetivo(pref: PreferenciaTema, hora: number, sistemaEscuro: boolean): Tema {
  if (pref === "light" || pref === "dark") return pref;
  if (pref === "auto") return sistemaEscuro ? "dark" : "light";
  return hora >= 6 && hora < 18 ? "light" : "dark";
}

export function sistemaEstaEscuro(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return true;
  }
}

export function aplicarTema(pref: PreferenciaTema) {
  try {
    localStorage.setItem(CHAVE_TEMA, pref);
  } catch {
    /* sem armazenamento */
  }
  document.documentElement.setAttribute("data-theme", temaEfetivo(pref, new Date().getHours(), sistemaEstaEscuro()));
}

// roda antes da 1ª pintura (no layout) — mesma regra de temaEfetivo
export const SCRIPT_TEMA = `try{var p=localStorage.getItem('${CHAVE_TEMA}')||'dark',t=p;if(p==='auto'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}else if(p==='horario'){var h=new Date().getHours();t=h>=6&&h<18?'light':'dark'}else if(p!=='light'){t='dark'}document.documentElement.setAttribute('data-theme',t)}catch(e){}`;
