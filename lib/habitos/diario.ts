// Etapa 215 — diário do dia (humor 1..5) e o que ele mostra junto com os hábitos
import { diaBateComFrequencia } from "@/lib/agenda/dias";

export const HUMORES = [
  { valor: 1, emoji: "😞", nome: "Péssimo" },
  { valor: 2, emoji: "🙁", nome: "Ruim" },
  { valor: 3, emoji: "😐", nome: "Normal" },
  { valor: 4, emoji: "🙂", nome: "Bom" },
  { valor: 5, emoji: "😄", nome: "Ótimo" },
] as const;

export type DiaDiario = { data: string; humor: number; texto?: string | null };

export type RelacaoHabitoHumor = {
  habitoId: string;
  nome: string;
  mediaFeito: number;
  mediaNaoFeito: number;
  diferenca: number;
  diasFeito: number;
  diasNaoFeito: number;
};

/**
 * Pra cada hábito: humor médio nos dias em que foi feito x nos dias em
 * que era pra fazer e não fez. Só entra com pelo menos `minimo` dias de
 * cada lado (senão é coincidência) e diferença de 0,4 ponto ou mais.
 */
export function relacaoHabitosHumor(
  diario: DiaDiario[],
  habitos: { id: string; nome: string; frequencia: string; dias_semana?: number[] | null; eh_negativo?: boolean; meta_diaria?: number | null }[],
  checkins: { habito_id: string; data: string; quantidade?: number | null }[],
  minimo = 4
): RelacaoHabitoHumor[] {
  const qtd = new Map<string, number>();
  for (const c of checkins) qtd.set(`${c.habito_id}|${c.data}`, (qtd.get(`${c.habito_id}|${c.data}`) ?? 0) + Number(c.quantidade ?? 1));

  const saida: RelacaoHabitoHumor[] = [];
  for (const h of habitos) {
    const feito: number[] = [];
    const naoFeito: number[] = [];
    for (const d of diario) {
      const q = qtd.get(`${h.id}|${d.data}`) ?? 0;
      if (h.eh_negativo) {
        // hábito a evitar: "feito" = dia sem recaída
        (q > 0 ? naoFeito : feito).push(d.humor);
        continue;
      }
      if (!diaBateComFrequencia(h.frequencia, h.dias_semana ?? [], d.data)) continue;
      (q >= (h.meta_diaria ?? 1) ? feito : naoFeito).push(d.humor);
    }
    if (feito.length < minimo || naoFeito.length < minimo) continue;
    const media = (l: number[]) => l.reduce((s, v) => s + v, 0) / l.length;
    const mediaFeito = Math.round(media(feito) * 10) / 10;
    const mediaNaoFeito = Math.round(media(naoFeito) * 10) / 10;
    const diferenca = Math.round((mediaFeito - mediaNaoFeito) * 10) / 10;
    if (Math.abs(diferenca) < 0.4) continue;
    saida.push({ habitoId: h.id, nome: h.nome, mediaFeito, mediaNaoFeito, diferenca, diasFeito: feito.length, diasNaoFeito: naoFeito.length });
  }
  return saida.sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca));
}

export function emojiDoHumor(humor: number): string {
  return HUMORES.find((h) => h.valor === Math.round(humor))?.emoji ?? "😐";
}
