/**
 * Etapa 275 — nível de cada hábito, pela quantidade de dias feitos.
 * A plantinha cresce com você: quanto mais dias, mais alto o nível.
 * Nada é salvo à parte — é tudo calculado dos check-ins.
 */

export type Nivel = {
  numero: number;
  nome: string;
  emoji: string;
  /** dias feitos necessários pra chegar neste nível */
  minimo: number;
};

export const NIVEIS: Nivel[] = [
  { numero: 1, nome: "Semente", emoji: "🌰", minimo: 0 },
  { numero: 2, nome: "Broto", emoji: "🌱", minimo: 3 },
  { numero: 3, nome: "Mudinha", emoji: "🌿", minimo: 7 },
  { numero: 4, nome: "Planta", emoji: "🪴", minimo: 14 },
  { numero: 5, nome: "Arbusto", emoji: "🌳", minimo: 30 },
  { numero: 6, nome: "Flor", emoji: "🌸", minimo: 50 },
  { numero: 7, nome: "Árvore frutífera", emoji: "🍎", minimo: 80 },
  { numero: 8, nome: "Floresta", emoji: "🌲", minimo: 120 },
  { numero: 9, nome: "Montanha", emoji: "⛰️", minimo: 180 },
  { numero: 10, nome: "Lenda", emoji: "👑", minimo: 365 },
];

export type ProgressoNivel = {
  atual: Nivel;
  proximo: Nivel | null;
  dias: number;
  /** 0 a 1 — quanto já andou do nível atual até o próximo */
  progresso: number;
  faltam: number;
};

export function nivelPorDias(dias: number): ProgressoNivel {
  const d = Math.max(0, Math.floor(dias || 0));
  let atual = NIVEIS[0];
  for (const n of NIVEIS) if (d >= n.minimo) atual = n;
  const proximo = NIVEIS.find((n) => n.minimo > d) ?? null;
  if (!proximo) return { atual, proximo: null, dias: d, progresso: 1, faltam: 0 };
  const faixa = proximo.minimo - atual.minimo;
  return { atual, proximo, dias: d, progresso: (d - atual.minimo) / faixa, faltam: proximo.minimo - d };
}

/** Quantos dias o hábito foi cumprido (dia com quantidade >= meta). */
export function diasFeitos(
  habito: { id: string; meta_diaria?: number | null },
  checkins: { habito_id: string; data: string; quantidade?: number | null }[]
): number {
  const meta = Math.max(1, Number(habito.meta_diaria) || 1);
  const qtd = new Map<string, number>();
  for (const c of checkins) if (c.habito_id === habito.id) qtd.set(c.data, (qtd.get(c.data) ?? 0) + Number(c.quantidade ?? 1));
  let n = 0;
  for (const q of qtd.values()) if (q >= meta) n++;
  return n;
}

/** Se marcar mais um dia faz subir de nível, devolve o nível novo. */
export function subiriaDeNivel(diasAntes: number): Nivel | null {
  const antes = nivelPorDias(diasAntes).atual;
  const depois = nivelPorDias(diasAntes + 1).atual;
  return depois.numero > antes.numero ? depois : null;
}
