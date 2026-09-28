// Etapa 215 — quanto guardar por mês pra bater a meta no prazo
export type PlanoMeta = {
  percentual: number;
  falta: number;
  /** meses (inteiros, contando o atual) até a data alvo; null sem data */
  meses: number | null;
  porMes: number | null;
  prazoPassou: boolean;
};

export function planoDaMeta(
  meta: { valor_atual: number | string; valor_alvo: number | string; data_alvo?: string | null },
  hojeISO: string
): PlanoMeta {
  const atual = Number(meta.valor_atual) || 0;
  const alvo = Number(meta.valor_alvo) || 0;
  const falta = Math.max(0, Math.round((alvo - atual) * 100) / 100);
  const percentual = alvo > 0 ? Math.min(100, Math.round((atual / alvo) * 100)) : 0;
  if (!meta.data_alvo || falta === 0) return { percentual, falta, meses: null, porMes: null, prazoPassou: false };
  if (meta.data_alvo < hojeISO) return { percentual, falta, meses: 0, porMes: null, prazoPassou: true };
  const [a1, m1] = hojeISO.split("-").map(Number);
  const [a2, m2] = meta.data_alvo.split("-").map(Number);
  const meses = Math.max(1, (a2 - a1) * 12 + (m2 - m1) + 1);
  return { percentual, falta, meses, porMes: Math.ceil((falta / meses) * 100) / 100, prazoPassou: false };
}
