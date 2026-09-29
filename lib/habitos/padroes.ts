// Etapa 220 — em que dia da semana cada hábito costuma falhar
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";

export const NOMES_DIA = ["domingos", "segundas", "terças", "quartas", "quintas", "sextas", "sábados"];

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
function diaSemana(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

export type PadraoHabito = {
  habitoId: string;
  nome: string;
  taxaGeral: number; // %
  piorDia: number; // 0=domingo
  taxaPiorDia: number;
  melhorDia: number;
  taxaMelhorDia: number;
};

export function padroesPorDiaSemana(
  habitos: any[],
  checkins: { habito_id: string; data: string; quantidade?: number | null }[],
  hojeISO: string,
  semanas = 8
): PadraoHabito[] {
  const qtd = new Map<string, number>();
  for (const c of checkins) qtd.set(`${c.habito_id}|${c.data}`, (qtd.get(`${c.habito_id}|${c.data}`) ?? 0) + Number(c.quantidade ?? 1));
  const saida: PadraoHabito[] = [];
  for (const h of habitos) {
    if (h.eh_negativo || h.frequencia === "semanal") continue;
    const criado = String(h.criado_em ?? "").slice(0, 10) || "0000-00-00";
    const devidos = Array(7).fill(0);
    const feitos = Array(7).fill(0);
    for (let i = 1; i <= semanas * 7; i++) {
      const dia = somarDias(hojeISO, -i);
      if (dia < criado || !habitoDevidoNoDia(h, dia)) continue;
      const ds = diaSemana(dia);
      devidos[ds]++;
      if ((qtd.get(`${h.id}|${dia}`) ?? 0) >= (h.meta_diaria ?? 1)) feitos[ds]++;
    }
    const totalDevidos = devidos.reduce((s, v) => s + v, 0);
    if (totalDevidos < 14) continue;
    const taxaGeral = Math.round((feitos.reduce((s, v) => s + v, 0) / totalDevidos) * 100);
    let pior = -1;
    let melhor = -1;
    for (let d = 0; d < 7; d++) {
      if (devidos[d] < 3) continue;
      const taxa = feitos[d] / devidos[d];
      if (pior < 0 || taxa < feitos[pior] / devidos[pior]) pior = d;
      if (melhor < 0 || taxa > feitos[melhor] / devidos[melhor]) melhor = d;
    }
    if (pior < 0) continue;
    const taxaPior = Math.round((feitos[pior] / devidos[pior]) * 100);
    if (taxaGeral - taxaPior < 25 || taxaPior >= 70) continue;
    saida.push({
      habitoId: h.id,
      nome: h.nome,
      taxaGeral,
      piorDia: pior,
      taxaPiorDia: taxaPior,
      melhorDia: melhor,
      taxaMelhorDia: Math.round((feitos[melhor] / devidos[melhor]) * 100),
    });
  }
  return saida.sort((a, b) => b.taxaGeral - b.taxaPiorDia - (a.taxaGeral - a.taxaPiorDia));
}
