// Etapa 214 — bloqueio opcional por PIN (fica só neste aparelho)
export const CHAVE_PIN = "vidatrack-pin";
export const CHAVE_DESBLOQUEADO = "vidatrack-desbloqueado";
export const CHAVE_SAIU_EM = "vidatrack-saiu-em";
export const EVENTO_PIN = "vidatrack-pin-mudou";
export const MINUTOS_PARA_BLOQUEAR = 5;

type PinSalvo = { sal: string; hash: string };

function lerLocal(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

export function pinAtivo(): boolean {
  return !!lerLocal(CHAVE_PIN);
}

async function calcularHash(pin: string, sal: string): Promise<string> {
  const texto = `${sal}:${pin}`;
  try {
    const dados = new TextEncoder().encode(texto);
    const buf = await crypto.subtle.digest("SHA-256", dados);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // Fallback simples caso crypto.subtle não exista (contexto não seguro)
    let h = 5381;
    for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) | 0;
    return `f${(h >>> 0).toString(16)}`;
  }
}

export async function salvarPin(pin: string): Promise<void> {
  const sal = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const hash = await calcularHash(pin, sal);
  localStorage.setItem(CHAVE_PIN, JSON.stringify({ sal, hash } satisfies PinSalvo));
  marcarDesbloqueado();
  window.dispatchEvent(new Event(EVENTO_PIN));
}

export function removerPin(): void {
  try {
    localStorage.removeItem(CHAVE_PIN);
    sessionStorage.removeItem(CHAVE_DESBLOQUEADO);
  } catch {}
  document.documentElement.removeAttribute("data-bloqueado");
  window.dispatchEvent(new Event(EVENTO_PIN));
}

export async function conferirPin(pin: string): Promise<boolean> {
  const bruto = lerLocal(CHAVE_PIN);
  if (!bruto) return true;
  try {
    const salvo = JSON.parse(bruto) as PinSalvo;
    return (await calcularHash(pin, salvo.sal)) === salvo.hash;
  } catch {
    return false;
  }
}

export function marcarDesbloqueado(): void {
  try {
    sessionStorage.setItem(CHAVE_DESBLOQUEADO, "1");
    sessionStorage.removeItem(CHAVE_SAIU_EM);
  } catch {}
  document.documentElement.removeAttribute("data-bloqueado");
}

export function pinValido(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

// Script inline (roda antes da 1ª pintura) — esconde a tela se precisar de PIN
export const SCRIPT_PRE_BLOQUEIO = `try{if(localStorage.getItem('${CHAVE_PIN}')){var s=sessionStorage.getItem('${CHAVE_SAIU_EM}');var d=sessionStorage.getItem('${CHAVE_DESBLOQUEADO}');if(!d||(s&&Date.now()-Number(s)>${MINUTOS_PARA_BLOQUEAR}*60000)){document.documentElement.setAttribute('data-bloqueado','1')}}}catch(e){}`;
