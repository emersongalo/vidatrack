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

function diasEntre(dataInicioISO: string, dataFimISO: string): number {
  const inicio = new Date(dataInicioISO + "T00:00:00");
  const fim = new Date(dataFimISO + "T00:00:00");
  return Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Hábito NEGATIVO (parar de fazer algo, tipo "não fumar") funciona
 * ao contrário do positivo: cada check-in registrado é uma
 * "recaída", não um sucesso. O streak aqui é "dias desde a última
 * recaída" (ou desde que o hábito foi criado, se nunca teve nenhuma).
 */
export function calcularStreakNegativo(datasLapso: string[], dataCriacaoISO: string): number {
  const hoje = hojeISO();
  if (datasLapso.length === 0) {
    return diasEntre(dataCriacaoISO, hoje);
  }
  const ultimoLapso = [...datasLapso].sort().at(-1)!;
  return diasEntre(ultimoLapso, hoje);
}

export const MARCOS_CONQUISTA = [7, 30, 100, 365];

/**
 * Calcula o RECORDE — a maior sequência de dias consecutivos que o
 * hábito já teve, em toda a história de check-ins (diferente do
 * streak atual, que só olha pra trás a partir de hoje).
 */
export function calcularMelhorStreak(datasCheckin: string[]): number {
  if (datasCheckin.length === 0) return 0;
  const datasOrdenadas = [...new Set(datasCheckin)].sort();

  let melhor = 1;
  let atual = 1;

  for (let i = 1; i < datasOrdenadas.length; i++) {
    const anterior = new Date(datasOrdenadas[i - 1] + "T00:00:00");
    const atualData = new Date(datasOrdenadas[i] + "T00:00:00");
    const diffDias = Math.round((atualData.getTime() - anterior.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias === 1) {
      atual++;
      melhor = Math.max(melhor, atual);
    } else {
      atual = 1;
    }
  }

  return melhor;
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
