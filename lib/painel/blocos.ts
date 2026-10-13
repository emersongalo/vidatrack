// Etapa 235 — Início personalizável: a pessoa escolhe se quer ver
// hábitos, finanças ou os dois, e pode ligar/desligar e reordenar cada
// bloco. Fica salvo na conta (perfis.ordem_blocos_inicio) e vale em
// qualquer aparelho; neste aparelho também fica uma cópia pra abrir na hora.

// Etapa 317 — área "tarefas" separada
export type AreaBloco = "habitos" | "tarefas" | "financas" | "geral";

export type IdBloco =
  | "seuDia"
  | "mascote"
  | "missoes"
  | "juntos"
  | "sequencias"
  | "semanaHabitos"
  | "humor"
  | "saldo"
  | "podeGastar"
  | "lancarRapido"
  | "gastosSemana"
  | "teto"
  | "categorias"
  | "faturas"
  | "metasFinanceiras"
  | "proximos"
  | "fluxo"
  | "tarefasHoje"
  | "resumo"
  | "assistente";

export const BLOCOS: { id: IdBloco; nome: string; emoji: string; area: AreaBloco; texto: string }[] = [
  { id: "seuDia", nome: "Seu dia", emoji: "✅", area: "habitos", texto: "Anel dos hábitos de hoje e o que falta" },
  // Etapa 303 — o mascote no Início (opcional, liga em Organizar)
  { id: "mascote", nome: "Seu mascote", emoji: "🐣", area: "habitos", texto: "O bichinho que cresce com seus hábitos — dá pra girar e alimentar" },
  // Etapa 309
  { id: "missoes", nome: "Missões do dia", emoji: "🎯", area: "habitos", texto: "3 missões por dia com moedas de prêmio e o baú da semana" },
  { id: "juntos", nome: "Juntos", emoji: "🌱", area: "habitos", texto: "A cena dos hábitos em dupla, com as plantinhas" },
  { id: "sequencias", nome: "Sequências", emoji: "🔥", area: "habitos", texto: "Seus hábitos com as maiores sequências" },
  { id: "semanaHabitos", nome: "Semana dos hábitos", emoji: "📊", area: "habitos", texto: "Quanto você fez em cada dia dos últimos 7" },
  { id: "humor", nome: "Como está seu dia?", emoji: "🙂", area: "habitos", texto: "Registrar o humor com um toque" },
  // Etapa 317
  { id: "tarefasHoje", nome: "Tarefas de hoje", emoji: "📝", area: "tarefas", texto: "As de hoje e as atrasadas, com a bolinha pra concluir ali mesmo" },
  { id: "fluxo", nome: "Entradas e saídas", emoji: "💸", area: "financas", texto: "Tudo que vai entrar e sair de dinheiro, com Paguei e Recebi num toque" },
  { id: "saldo", nome: "Saldo", emoji: "💰", area: "financas", texto: "Saldo em contas e o que entrou e saiu no mês" },
  { id: "podeGastar", nome: "Quanto posso gastar hoje", emoji: "👛", area: "financas", texto: "Um número só, já descontando contas e faturas do mês" },
  { id: "lancarRapido", nome: "Lançar rápido", emoji: "⚡", area: "financas", texto: "Seus gastos mais repetidos, lançados em 2 toques" },
  { id: "gastosSemana", nome: "Gastos da semana", emoji: "📉", area: "financas", texto: "Gasto de cada dia e comparação com a semana passada" },
  { id: "teto", nome: "Teto do mês", emoji: "🎯", area: "financas", texto: "Medidor de quanto do teto de gastos já foi" },
  { id: "categorias", nome: "Onde foi o dinheiro", emoji: "🍩", area: "financas", texto: "As categorias com mais gasto no mês" },
  { id: "faturas", nome: "Cartões", emoji: "💳", area: "financas", texto: "Fatura a pagar e limite de cada cartão" },
  { id: "metasFinanceiras", nome: "Metas de economia", emoji: "🏁", area: "financas", texto: "Anel de cada meta e quanto falta" },
  { id: "proximos", nome: "Próximos dias", emoji: "🗓️", area: "geral", texto: "Contas, receitas e tarefas dos próximos 7 dias" },
  { id: "resumo", nome: "Resumo em números", emoji: "🧩", area: "geral", texto: "Cartõezinhos com números rápidos (dá pra escolher quais)" },
  { id: "assistente", nome: "Assistente", emoji: "🤖", area: "geral", texto: "Caixa pra perguntar ou lançar falando" },
];

export type ModoInicio = "habitos" | "tarefas" | "financas" | "ambos";

export const MODELOS: Record<ModoInicio, { nome: string; emoji: string; blocos: IdBloco[] }> = {
  ambos: { nome: "Tudo", emoji: "✨", blocos: ["seuDia", "juntos", "saldo", "proximos", "gastosSemana", "sequencias", "resumo"] },
  habitos: { nome: "Só hábitos", emoji: "✅", blocos: ["seuDia", "mascote", "missoes", "juntos", "sequencias", "semanaHabitos", "humor", "proximos"] },
  financas: { nome: "Só finanças", emoji: "💰", blocos: ["saldo", "fluxo", "gastosSemana", "teto", "categorias", "faturas", "metasFinanceiras"] },
  // Etapa 317
  tarefas: { nome: "Só tarefas", emoji: "📝", blocos: ["tarefasHoje", "proximos", "humor"] },
};

export const CHAVE_INICIO = "vidatrack-inicio-blocos";
const VALIDOS = new Set<string>(BLOCOS.map((b) => b.id));

/** Lê a lista salva (conta ou aparelho). Qualquer coisa estranha vira o modelo "os dois". */
export function lerBlocosInicio(bruto: unknown): IdBloco[] {
  let v: unknown = bruto;
  if (typeof bruto === "string") {
    try {
      v = JSON.parse(bruto);
    } catch {
      return [...MODELOS.ambos.blocos];
    }
  }
  if (!Array.isArray(v) || v.length === 0) return [...MODELOS.ambos.blocos];
  const vistos = new Set<string>();
  const lista: IdBloco[] = [];
  for (const id of v) {
    if (typeof id === "string" && VALIDOS.has(id) && !vistos.has(id)) {
      vistos.add(id);
      lista.push(id as IdBloco);
    }
  }
  return lista.length ? lista : [...MODELOS.ambos.blocos];
}

/** Qual modelo a lista atual parece (pra marcar o botão certo) */
export function modoDaLista(lista: IdBloco[]): ModoInicio | null {
  const areas = new Set(lista.map((id) => BLOCOS.find((b) => b.id === id)!.area).filter((a) => a !== "geral"));
  // "humor" é de hábitos, mas cabe no modelo "Só tarefas" também
  if (areas.size === 2 && areas.has("tarefas") && areas.has("habitos") && lista.every((id) => id === "humor" || BLOCOS.find((b) => b.id === id)!.area !== "habitos")) return "tarefas";
  if (areas.size === 1) return [...areas][0] as ModoInicio;
  if (areas.size >= 2) return "ambos";
  return null;
}

export function moverBloco(lista: IdBloco[], id: IdBloco, direcao: -1 | 1): IdBloco[] {
  const i = lista.indexOf(id);
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= lista.length) return lista;
  const nova = [...lista];
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}

export function alternarBloco(lista: IdBloco[], id: IdBloco): IdBloco[] {
  return lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
}
