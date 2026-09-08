import { diaBateComFrequencia } from "@/lib/agenda/dias";

export type PontoMapaContribuicoes = { data: string; percentual: number | null };

type HabitoBasico = { id: string; frequencia: string; dias_semana: number[] };

/**
 * Calcula, pra cada um dos últimos `quantidadeDias` dias, qual
 * percentual dos hábitos aplicáveis naquele dia foi cumprido.
 * `percentual: null` significa que nenhum hábito se aplicava
 * naquele dia (não é o mesmo que 0% — é "não tinha nada marcado").
 */
export function calcularMapaContribuicoes(
  habitos: HabitoBasico[],
  checkinsPorHabito: Map<string, Set<string>>,
  quantidadeDias: number,
  hojeISO: string
): PontoMapaContribuicoes[] {
  const hoje = new Date(hojeISO + "T00:00:00");
  const pontos: PontoMapaContribuicoes[] = [];

  for (let i = quantidadeDias - 1; i >= 0; i--) {
    const data = new Date(hoje);
    data.setDate(data.getDate() - i);
    const dataISO = data.toLocaleDateString("sv-SE");

    let aplicaveis = 0;
    let feitos = 0;
    for (const habito of habitos) {
      if (diaBateComFrequencia(habito.frequencia, habito.dias_semana ?? [], dataISO)) {
        aplicaveis++;
        if (checkinsPorHabito.get(habito.id)?.has(dataISO)) feitos++;
      }
    }

    pontos.push({
      data: dataISO,
      percentual: aplicaveis > 0 ? Math.round((feitos / aplicaveis) * 100) : null,
    });
  }

  return pontos;
}
