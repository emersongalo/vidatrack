// Etapa 364 — "mês de competência" de um lançamento. A conta fixa de
// outubro adiada pra novembro continua sendo a conta de OUTUBRO: o app
// não gera outra em outubro, e em novembro gera a de novembro normal.
// adiada_de guarda a data original (só na primeira vez que adia).

type ComData = { data?: string | null; adiada_de?: string | null; criado_em?: string | null };

/** a partir desta versão toda conta adiada guarda adiada_de */
export const VERSAO_ADIADA_DE = "2026-10-27";

function mesAnterior(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
}

/**
 * "2026-10". `diaMes` (dia da conta fixa) serve pras contas adiadas ANTES
 * desta versão, que não guardaram a data original: conta fixa com dia
 * ANTES do dia dela só pode ter vindo do mês anterior (adiar só empurra
 * pra frente; o lançamento normal cai sempre no dia da conta).
 */
export function mesCompetencia(t: ComData, diaMes?: number | null): string {
  if (t.adiada_de) return String(t.adiada_de).slice(0, 7);
  const data = String(t.data || "");
  const mes = data.slice(0, 7);
  const antiga = !!t.criado_em && String(t.criado_em).slice(0, 10) < VERSAO_ADIADA_DE;
  if (diaMes && antiga && data >= "2026-10-06" && data.length >= 10) {
    const dia = Number(data.slice(8, 10));
    if (dia < Math.min(28, Number(diaMes))) return mesAnterior(mes);
  }
  return mes;
}

/** o que gravar ao adiar um lançamento pra `novaData` */
export function valoresAdiar(
  t: ComData & { recorrencia_id?: string | null },
  novaData: string
): Record<string, unknown> {
  const valores: Record<string, unknown> = { data: novaData };
  if (t.recorrencia_id && !t.adiada_de && t.data) valores.adiada_de = t.data;
  return valores;
}

/** mapa id da conta fixa → dia do mês */
export function diasDasRecorrencias(recorrencias: { id: string; dia_mes?: number | null }[] | null | undefined) {
  return new Map((recorrencias ?? []).map((r) => [r.id, Number(r.dia_mes) || null]));
}
