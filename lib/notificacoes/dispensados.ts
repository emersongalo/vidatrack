import { hojeISO } from "@/lib/habitos/streak";

const CHAVE = "vidatrack-notificacoes-dispensadas";

function lerBruto(): { data: string; chaves: string[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

/**
 * Etapa 140 — "dispensar" uma pendência só esconde ela por hoje (a
 * lista inteira é recalculada do zero a cada dia, então guardar isso
 * pra sempre não faria sentido — amanhã pode ser uma pendência
 * diferente pro mesmo hábito).
 */
export function lerDispensadosHoje(): Set<string> {
  const dados = lerBruto();
  if (!dados || dados.data !== hojeISO()) return new Set();
  return new Set(dados.chaves);
}

export function dispensar(chave: string) {
  if (typeof window === "undefined") return;
  const atuais = lerDispensadosHoje();
  atuais.add(chave);
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ data: hojeISO(), chaves: Array.from(atuais) }));
  } catch {
    // sem espaço/indisponível — sem problema, só não fica lembrado a próxima vez
  }
}
