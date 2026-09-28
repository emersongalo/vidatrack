// Etapa 215 — tamanho do texto e alto contraste (fica neste aparelho)
export const CHAVE_FONTE = "vidatrack-fonte";
export const CHAVE_CONTRASTE = "vidatrack-contraste";
export type TamanhoFonte = "normal" | "grande" | "maior";

export function lerAparencia(): { fonte: TamanhoFonte; contrasteAlto: boolean } {
  try {
    const f = localStorage.getItem(CHAVE_FONTE);
    return {
      fonte: f === "grande" || f === "maior" ? f : "normal",
      contrasteAlto: localStorage.getItem(CHAVE_CONTRASTE) === "alto",
    };
  } catch {
    return { fonte: "normal", contrasteAlto: false };
  }
}

export function salvarAparencia(fonte: TamanhoFonte, contrasteAlto: boolean) {
  try {
    localStorage.setItem(CHAVE_FONTE, fonte);
    if (contrasteAlto) localStorage.setItem(CHAVE_CONTRASTE, "alto");
    else localStorage.removeItem(CHAVE_CONTRASTE);
  } catch {}
  const html = document.documentElement;
  if (fonte === "normal") html.removeAttribute("data-fonte");
  else html.setAttribute("data-fonte", fonte);
  if (contrasteAlto) html.setAttribute("data-contraste", "alto");
  else html.removeAttribute("data-contraste");
}

// roda antes da 1ª pintura (no layout), junto com o tema
export const SCRIPT_APARENCIA = `try{var f=localStorage.getItem('${CHAVE_FONTE}');if(f==='grande'||f==='maior')document.documentElement.setAttribute('data-fonte',f);if(localStorage.getItem('${CHAVE_CONTRASTE}')==='alto')document.documentElement.setAttribute('data-contraste','alto')}catch(e){}`;
