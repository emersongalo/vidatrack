const CHAVE = "vidatrack-valores-ocultos";
export const EVENTO_MUDANCA = "vidatrack:valores-ocultos-mudou";

export function lerValoresOcultos(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CHAVE) === "1";
}

export function alternarValoresOcultos() {
  const novoValor = !lerValoresOcultos();
  localStorage.setItem(CHAVE, novoValor ? "1" : "0");
  window.dispatchEvent(new CustomEvent(EVENTO_MUDANCA, { detail: novoValor }));
}
