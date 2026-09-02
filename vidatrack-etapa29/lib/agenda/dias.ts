export function diaBateComFrequencia(
  frequencia: string,
  diasSemana: number[],
  dataISO: string
): boolean {
  if (frequencia === "diaria") return true;
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
