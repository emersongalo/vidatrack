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

/**
 * Etapa 278 — ritmo em partes menores (fica mais fácil de imaginar
 * "R$ 15 por dia" do que "R$ 450 por mês") e, sem prazo, quando chega
 * guardando um valor por semana.
 */
export type RitmoMeta = { porSemana: number | null; porDia: number | null; dias: number | null };

export function ritmoDaMeta(meta: { valor_atual: number | string; valor_alvo: number | string; data_alvo?: string | null }, hojeISO: string): RitmoMeta {
  const falta = Math.max(0, (Number(meta.valor_alvo) || 0) - (Number(meta.valor_atual) || 0));
  if (!meta.data_alvo || falta === 0 || meta.data_alvo < hojeISO) return { porSemana: null, porDia: null, dias: null };
  const [a1, m1, d1] = hojeISO.split("-").map(Number);
  const [a2, m2, d2] = meta.data_alvo.split("-").map(Number);
  const dias = Math.max(1, Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000) + 1);
  const arred = (v: number) => Math.ceil(v * 100) / 100;
  return { porDia: arred(falta / dias), porSemana: arred(falta / Math.max(1, dias / 7)), dias };
}

/** Sem prazo: guardando `porSemana`, em que data a meta fica completa. */
export function quandoChega(meta: { valor_atual: number | string; valor_alvo: number | string }, porSemana: number, hojeISO: string): string | null {
  const falta = Math.max(0, (Number(meta.valor_alvo) || 0) - (Number(meta.valor_atual) || 0));
  if (falta === 0 || porSemana <= 0) return null;
  const semanas = Math.ceil(falta / porSemana);
  const [a, m, d] = hojeISO.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + semanas * 7)).toISOString().slice(0, 10);
}

/** Valor "redondo" sugerido por semana: ~1/26 do que falta (meio ano), múltiplo de 5. */
export function sugestaoSemanal(falta: number): number {
  return Math.max(5, Math.ceil(falta / 26 / 5) * 5);
}
