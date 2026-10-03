// Etapa 250 — dicas curtinhas no lugar certo (uma por dia, muda sozinha)
export type ContextoDica = "metas" | "novoHabito" | "juntos" | "desafios" | "orcamento" | "habitoParar";

export const DICAS: Record<ContextoDica, string[]> = {
  metas: [
    "Meta com data e valor certo funciona melhor: \"R$ 3.000 até março\" em vez de \"guardar pra viagem\".",
    "Guarde no dia que o dinheiro entra, não no que sobra — quem paga a si mesmo primeiro bate a meta.",
    "Uma transferência automática pequena todo mês vence um valor grande \"quando der\".",
    "Divida a meta em pedaços: ver 25% concluído dá ânimo pra continuar.",
  ],
  novoHabito: [
    "Comece ridiculamente pequeno: 2 minutos de leitura contam. O importante é não quebrar a corrente.",
    "Prenda o hábito a algo que você já faz: \"depois do café, leio 1 página\". Use o campo \"Fazer logo depois de…\".",
    "Escolha um horário fixo pro lembrete — hábito com hora marcada vira automático mais rápido.",
    "Melhor 3 hábitos que você cumpre do que 10 que você abandona na segunda semana.",
  ],
  juntos: [
    "Combinem um horário: fazer junto (mesmo à distância) dobra a chance de não pular.",
    "Reaja quando a outra pessoa concluir — um 👏 rápido motiva mais do que parece.",
    "Se um dos dois escorregar, cutuque com carinho. A plantinha é de vocês dois.",
  ],
  desafios: [
    "Desafio bom tem prazo curto: 7 ou 14 dias é o ponto certo pra começar.",
    "Vale combinar um prêmio simbólico pra quem ganhar — um café já resolve.",
  ],
  orcamento: [
    "Comece colocando limite só nas 3 categorias onde mais vai dinheiro — é ali que dá resultado.",
    "Use o mês passado como base e corte 10%: meta possível é meta cumprida.",
    "O VidaTrack avisa quando a categoria chega a 80% — ainda dá tempo de segurar.",
  ],
  habitoParar: [
    "Anote o que te levou a escorregar: o gatilho se repete, e conhecer ele é metade da vitória.",
    "Troque, não só corte: tenha algo pra fazer no lugar quando a vontade vier.",
    "Escorregou? Marque e siga. O que importa é a tendência, não um dia.",
  ],
};

function diaDoAno(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return Math.floor((Date.UTC(a, m - 1, d) - Date.UTC(a, 0, 0)) / 86400000);
}

export function dicaDoDia(contexto: ContextoDica, hojeISO: string): string {
  const lista = DICAS[contexto];
  return lista[diaDoAno(hojeISO) % lista.length];
}
