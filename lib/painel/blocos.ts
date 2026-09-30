// Etapa 235 — Início personalizável: a pessoa escolhe se quer ver
// hábitos, finanças ou os dois, e pode ligar/desligar e reordenar cada
// bloco. Fica salvo na conta (perfis.ordem_blocos_inicio) e vale em
// qualquer aparelho; neste aparelho também fica uma cópia pra abrir na hora.

export type AreaBloco = "habitos" | "financas" | "geral";

export type IdBloco =
  | "seuDia"
  | "juntos"
  | "sequencias"
  | "semanaHabitos"
  | "humor"
  | "saldo"
  | "gastosSemana"
  | "teto"
  | "categorias"
  | "faturas"
  | "metasFinanceiras"
  | "proximos"
  | "resumo"
  | "assistente";

export const BLOCOS: { id: IdBloco; nome: string; emoji: string; area: AreaBloco; texto: string }[] = [
  { id: "seuDia", nome: "Seu dia", emoji: "✅", area: "habitos", texto: "Anel dos hábitos de hoje e o que falta" },
  { id: "juntos", nome: "Juntos", emoji: "🌱", area: "habitos", texto: "A cena dos hábitos em dupla, com as plantinhas" },
  { id: "sequencias", nome: "Sequências", emoji: "🔥", area: "habitos", texto: "Seus hábitos com as maiores sequências" },
  { id: "semanaHabitos", nome: "Semana dos hábitos", emoji: "📊", area: "habitos", texto: "Quanto você fez em cada dia dos últimos 7" },
  { id: "humor", nome: "Como está seu dia?", emoji: "🙂", area: "habitos", texto: "Registrar o humor com um toque" },
  { id: "saldo", nome: "Saldo", emoji: "💰", area: "financas", texto: "Saldo em contas e o que entrou e saiu no mês" },
  { id: "gastosSemana", nome: "Gastos da semana", emoji: "📉", area: "financas", texto: "Gasto de cada dia e comparação com a semana passada" },
  { id: "teto", nome: "Teto do mês", emoji: "🎯", area: "financas", texto: "Medidor de quanto do teto de gastos já foi" },
  { id: "categorias", nome: "Onde foi o dinheiro", emoji: "🍩", area: "financas", texto: "As categorias com mais gasto no mês" },
  { id: "faturas", nome: "Cartões", emoji: "💳", area: "financas", texto: "Fatura a pagar e limite de cada cartão" },
  { id: "metasFinanceiras", nome: "Metas de economia", emoji: "🏁", area: "financas", texto: "Anel de cada meta e quanto falta" },
  { id: "proximos", nome: "Próximos dias", emoji: "🗓️", area: "geral", texto: "Contas, receitas e tarefas dos próximos 7 dias" },
  { id: "resumo", nome: "Resumo em números", emoji: "🧩", area: "geral", texto: "Cartõezinhos com números rápidos (dá pra escolher quais)" },
  { id: "assistente", nome: "Assistente", emoji: "🤖", area: "geral", texto: "Caixa pra perguntar ou lançar falando" },
];

export type ModoInicio = "habitos" | "financas" | "ambos";

export const MODELOS: Record<ModoInicio, { nome: string; emoji: string; blocos: IdBloco[] }> = {
  ambos: { nome: "Os dois", emoji: "✨", blocos: ["seuDia", "juntos", "saldo", "proximos", "gastosSemana", "sequencias", "resumo"] },
  habitos: { nome: "Só hábitos", emoji: "✅", blocos: ["seuDia", "juntos", "sequencias", "semanaHabitos", "humor", "proximos"] },
  financas: { nome: "Só finanças", emoji: "💰", blocos: ["saldo", "gastosSemana", "teto", "categorias", "faturas", "metasFinanceiras", "proximos"] },
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
  if (areas.size === 1) return areas.has("habitos") ? "habitos" : "financas";
  if (areas.size === 2) return "ambos";
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
