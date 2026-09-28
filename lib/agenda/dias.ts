export function diaBateComFrequencia(
  frequencia: string,
  diasSemana: number[],
  dataISO: string
): boolean {
  if (frequencia === "diaria") return true;
  // Etapa 213 — "X vezes por semana": aparece todo dia até bater a meta
  // da semana (quem esconde depois de bater é quem chama, com
  // metaSemanalBatida abaixo).
  if (frequencia === "semanal") return true;
  if (frequencia === "dias_semana") {
    const diaDaSemana = new Date(dataISO + "T00:00:00").getDay(); // 0=domingo
    return diasSemana.includes(diaDaSemana);
  }
  return false;
}

const ABREVIACOES_DIA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function tiraDeDias(dataCentralISO: string, quantidadeAntes = 3, quantidadeDepois = 3) {
  const dias: { iso: string; numero: number; abreviacao: string }[] = [];
  const base = new Date(dataCentralISO + "T00:00:00");

  for (let i = -quantidadeAntes; i <= quantidadeDepois; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const iso = d.toLocaleDateString("sv-SE");
    dias.push({
      iso,
      numero: d.getDate(),
      abreviacao: ABREVIACOES_DIA[d.getDay()],
    });
  }
  return dias;
}

/** Etapa 213 — segunda-feira da semana de uma data (YYYY-MM-DD). */
export function inicioDaSemana(dataISO: string): string {
  const d = new Date(dataISO + "T00:00:00");
  const deslocamento = (d.getDay() + 6) % 7; // segunda = 0
  d.setDate(d.getDate() - deslocamento);
  return d.toLocaleDateString("sv-SE");
}

/**
 * Etapa 213 — quantos dias da semana (seg–dom) de `dataISO` o hábito
 * foi feito, contando só ATÉ esse dia. `diasFeitos` = datas em que o
 * hábito bateu a meta diária.
 */
export function feitosNaSemana(diasFeitos: Iterable<string>, dataISO: string): number {
  const inicio = inicioDaSemana(dataISO);
  let n = 0;
  for (const d of diasFeitos) if (d >= inicio && d <= dataISO) n++;
  return n;
}
