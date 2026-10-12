// Etapa 310 — conquistas do jogo dos hábitos: metas de longo prazo
// (hábitos feitos, sequências, fases do mascote, casa, missões, dupla).
// Cada uma, quando alcançada, dá um prêmio em moedas pra resgatar.
// Tudo calculado do retrato + do JSON do mascote.
import { calcularMelhorStreak } from "@/lib/habitos/streak";
import { faseDoMascote, type DadosMascote } from "@/lib/mascote/mascote";
import { MOVEIS } from "@/lib/mascote/casa";

export type CategoriaConquista = "habitos" | "sequencia" | "mascote" | "casa" | "missoes" | "dupla";

export type Conquista = {
  id: string;
  cat: CategoriaConquista;
  emoji: string;
  titulo: string;
  texto: string;
  meta: number;
  atual: number;
  premio: number;
  alcancada: boolean;
  resgatada: boolean;
};

export const NOMES_CATEGORIA_CONQUISTA: Record<CategoriaConquista, string> = {
  habitos: "✅ Hábitos",
  sequencia: "🔥 Sequências",
  mascote: "🐣 Mascote",
  casa: "🏠 Casa",
  missoes: "🎯 Missões",
  dupla: "🤝 Juntos",
};

/** Maior sequência já feita em qualquer hábito. */
export function melhorSequencia(s: any): number {
  const checkins = (s?.habitoCheckins ?? []) as any[];
  let melhor = 0;
  for (const h of (s?.habitos ?? []) as any[]) {
    if (h.eh_negativo) continue;
    const meta = Math.max(1, Number(h.meta_diaria) || 1);
    const soma = new Map<string, number>();
    for (const c of checkins) if (c.habito_id === h.id) soma.set(c.data, (soma.get(c.data) ?? 0) + Number(c.quantidade ?? 1));
    const datas = [...soma.entries()].filter(([, q]) => q >= meta).map(([d]) => d);
    melhor = Math.max(melhor, calcularMelhorStreak(datas, (h.pausas ?? []) as any));
  }
  return melhor;
}

export function listarConquistas(s: any, m: DadosMascote | null, feitos: number): Conquista[] {
  const ja = new Set(m?.conquistas ?? []);
  const seq = melhorSequencia(s);
  const fase = faseDoMascote(feitos).nivel;
  const casa = m?.casa;
  const comodos = casa ? Object.keys(casa.comodos).length : 0;
  const moveisComprados = casa ? Object.values(casa.moveis).reduce((a, b) => a + b, 0) : 0;
  const veiculos = casa ? MOVEIS.filter((x) => x.cat === "veiculo").reduce((a, x) => a + (casa.moveis[x.id] ?? 0), 0) : 0;
  const missoes = m?.missoesTotal ?? 0;
  const baus = m?.baus?.length ?? 0;
  const temDupla = ((s?.parceiros ?? []) as any[]).length > 0;
  const frutos = Object.values(m?.colhidos ?? {}).reduce((a, b) => a + b, 0);

  const c = (id: string, cat: CategoriaConquista, emoji: string, titulo: string, texto: string, atual: number, meta: number, premio: number): Conquista => ({
    id,
    cat,
    emoji,
    titulo,
    texto,
    meta,
    atual: Math.min(atual, meta),
    premio,
    alcancada: atual >= meta,
    resgatada: ja.has(id),
  });

  return [
    c("h1", "habitos", "👣", "Primeiro passo", "Faça seu primeiro hábito", feitos, 1, 20),
    c("h50", "habitos", "🌱", "Pegando o jeito", "50 hábitos feitos", feitos, 50, 60),
    c("h200", "habitos", "🌿", "Constância", "200 hábitos feitos", feitos, 200, 150),
    c("h500", "habitos", "🌳", "Raiz forte", "500 hábitos feitos", feitos, 500, 300),
    c("h1000", "habitos", "🏔️", "Mil vezes", "1.000 hábitos feitos", feitos, 1000, 600),
    c("s7", "sequencia", "🔥", "Uma semana", "7 dias seguidos num hábito", seq, 7, 50),
    c("s30", "sequencia", "☄️", "Um mês inteiro", "30 dias seguidos num hábito", seq, 30, 150),
    c("s100", "sequencia", "🌋", "Imparável", "100 dias seguidos num hábito", seq, 100, 400),
    c("f1", "mascote", "🐣", "Chocou!", "Seu mascote virou Filhote", m ? fase : 0, 1, 30),
    c("f3", "mascote", "🐱", "Crescido", "Seu mascote chegou na fase Crescido", m ? fase : 0, 3, 100),
    c("f5", "mascote", "👑", "Lendário", "Seu mascote virou Lendário", m ? fase : 0, 5, 500),
    c("c3", "casa", "🏠", "Casa de verdade", "Libere 3 cômodos", comodos, 3, 100),
    c("c10", "casa", "🛋️", "Decorador", "Compre 10 móveis", moveisComprados, 10, 120),
    c("cv", "casa", "🚗", "Sobre rodas", "Compre seu primeiro veículo", veiculos, 1, 80),
    c("m10", "missoes", "🎯", "Missão dada…", "Resgate 10 missões", missoes, 10, 50),
    c("m50", "missoes", "🏹", "…é missão cumprida", "Resgate 50 missões", missoes, 50, 200),
    c("b1", "missoes", "🎁", "Caçador de baú", "Abra um baú da semana", baus, 1, 40),
    c("b5", "missoes", "💎", "Colecionador", "Abra 5 baús", baus, 5, 200),
    c("d1", "dupla", "🤝", "Juntos", "Tenha um hábito em dupla", temDupla ? 1 : 0, 1, 50),
    c("d2", "dupla", "🍓", "Primeira colheita", "Colha um fruto no jardim da dupla", frutos, 1, 60),
  ];
}

export function resgatarConquista(m: DadosMascote, c: Conquista): DadosMascote | null {
  if (!c.alcancada || (m.conquistas ?? []).includes(c.id)) return null;
  return { ...m, conquistas: [...(m.conquistas ?? []), c.id], bonus: (m.bonus ?? 0) + c.premio };
}

/** Quantas estão prontas pra resgatar (pro selinho de aviso). */
export function conquistasProntas(l: Conquista[]) {
  return l.filter((c) => c.alcancada && !c.resgatada).length;
}
