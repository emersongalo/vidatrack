// Etapa 249 — hábito de "parar" (não fumar, sem refrigerante…):
// dias limpos, quanto já economizou e o próximo marco.

export const MARCOS_PARAR = [1, 3, 7, 14, 30, 60, 90, 180, 365, 730];

function diasEntre(a: string, b: string) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

export type ResumoParar = {
  diasLimpo: number;
  /** desde quando está limpo (último escorregão ou o início) */
  desde: string;
  recorde: number;
  /** quanto economizou desde o último escorregão */
  economizado: number | null;
  /** quanto economizou desde que criou o hábito (tirando os dias de escorregão) */
  economizadoTotal: number | null;
  proximoMarco: number | null;
  faltaProMarco: number;
  /** 0–100, progresso do marco anterior até o próximo */
  pctMarco: number;
  escorregoes30: number;
};

export function resumoParar(
  habito: { id: string; criado_em?: string | null; economia_dia?: number | string | null },
  checkins: { habito_id: string; data: string }[],
  hoje: string
): ResumoParar {
  const criado = String(habito.criado_em ?? hoje).slice(0, 10);
  const lapsos = [...new Set(checkins.filter((c) => c.habito_id === habito.id && c.data <= hoje).map((c) => c.data))].sort();
  const ultimo = lapsos.at(-1) ?? null;
  const desde = ultimo ?? criado;
  const diasLimpo = Math.max(0, diasEntre(desde, hoje));

  // recorde: maior intervalo entre escorregões (inclui do início até o 1º e do último até hoje)
  const doHabito = lapsos.filter((d) => d >= criado);
  let recorde = diasLimpo;
  let anteriorLapso: string | null = null;
  for (const l of doHabito) {
    // do início até o 1º escorregão, ou entre dois escorregões (sem contar os dias deles)
    const limpo = anteriorLapso ? diasEntre(anteriorLapso, l) - 1 : diasEntre(criado, l);
    recorde = Math.max(recorde, limpo);
    anteriorLapso = l;
  }

  const porDia = Number(habito.economia_dia ?? 0);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const diasTotais = Math.max(0, diasEntre(criado, hoje));
  const economizado = porDia > 0 ? r2(diasLimpo * porDia) : null;
  const economizadoTotal = porDia > 0 ? r2(Math.max(0, diasTotais - lapsos.filter((d) => d >= criado).length) * porDia) : null;

  const proximoMarco = MARCOS_PARAR.find((m) => m > diasLimpo) ?? null;
  const anterior = [...MARCOS_PARAR].reverse().find((m) => m <= diasLimpo) ?? 0;
  const pctMarco = proximoMarco ? Math.round(((diasLimpo - anterior) / (proximoMarco - anterior)) * 100) : 100;

  const limite30 = new Date(Date.parse(hoje + "T00:00:00Z") - 29 * 86400000).toISOString().slice(0, 10);
  return {
    diasLimpo,
    desde,
    recorde,
    economizado,
    economizadoTotal,
    proximoMarco,
    faltaProMarco: proximoMarco ? proximoMarco - diasLimpo : 0,
    pctMarco,
    escorregoes30: lapsos.filter((d) => d >= limite30).length,
  };
}

/** "3 dias", "2 semanas", "1 mês"… */
export function nomeDoMarco(dias: number): string {
  if (dias === 1) return "1 dia";
  if (dias < 14) return `${dias} dias`;
  if (dias === 14) return "2 semanas";
  if (dias === 30) return "1 mês";
  if (dias === 60) return "2 meses";
  if (dias === 90) return "3 meses";
  if (dias === 180) return "6 meses";
  if (dias === 365) return "1 ano";
  if (dias === 730) return "2 anos";
  return `${dias} dias`;
}
