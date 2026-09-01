// Todas as datas são strings "YYYY-MM-DD" (formato da coluna `data` no banco),
// sempre comparadas como texto para evitar problemas de fuso horário.

export function hojeISO(): string {
  return new Date().toLocaleDateString("sv-SE"); // formato YYYY-MM-DD
}

function subtrairDias(dataISO: string, dias: number): string {
  const d = new Date(dataISO + "T00:00:00");
  d.setDate(d.getDate() - dias);
  return d.toLocaleDateString("sv-SE");
}

/**
 * Calcula a sequência atual (streak) de dias consecutivos com check-in,
 * contando a partir de hoje (ou de ontem, se hoje ainda não foi marcado
 * mas ontem sim — assim o streak não "quebra" antes do dia terminar).
 */
export function calcularStreak(datasCheckin: string[]): number {
  const marcadas = new Set(datasCheckin);
  const hoje = hojeISO();

  let cursor = marcadas.has(hoje) ? hoje : subtrairDias(hoje, 1);
  if (!marcadas.has(cursor)) return 0;

  let streak = 0;
  while (marcadas.has(cursor)) {
    streak++;
    cursor = subtrairDias(cursor, 1);
  }
  return streak;
}

/**
 * Retorna os últimos `dias` dias (do mais antigo ao mais recente),
 * marcando se cada um teve check-in — usado na tira de histórico visual.
 */
export function ultimosDias(datasCheckin: string[], dias: number) {
  const marcadas = new Set(datasCheckin);
  const hoje = hojeISO();
  const resultado: { data: string; feito: boolean }[] = [];

  for (let i = dias - 1; i >= 0; i--) {
    const data = subtrairDias(hoje, i);
    resultado.push({ data, feito: marcadas.has(data) });
  }
  return resultado;
}
