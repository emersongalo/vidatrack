// Etapa 316 — pescaria no píer da ilha. Cada hábito feito hoje vale uma
// isca (até 5 por dia). Lançou, esperou o peixe beliscar e puxou na hora
// certa? Vai pra coleção. Os repetidos dá pra vender por moedas.
import type { DadosMascote } from "@/lib/mascote/mascote";

export type Raridade = "lixo" | "comum" | "incomum" | "raro" | "lendario";
export type Achado = { id: string; nome: string; emoji: string; raridade: Raridade; preco: number; peso: number; texto: string; soltar?: boolean };

export const ACHADOS: Achado[] = [
  { id: "bota", nome: "Bota velha", emoji: "👢", raridade: "lixo", preco: 1, peso: 8, texto: "Alguém perdeu o sapato… e o pé?" },
  { id: "lata", nome: "Latinha", emoji: "🥫", raridade: "lixo", preco: 1, peso: 6, texto: "Pelo menos você limpou o mar ♻️" },
  { id: "lambari", nome: "Lambari", emoji: "🐟", raridade: "comum", preco: 6, peso: 22, texto: "Pequeno mas valente." },
  { id: "sardinha", nome: "Sardinha", emoji: "🐟", raridade: "comum", preco: 8, peso: 18, texto: "Vive em cardume, nunca sozinha." },
  { id: "tilapia", nome: "Tilápia", emoji: "🐟", raridade: "comum", preco: 10, peso: 16, texto: "Clássico de beira de rio." },
  { id: "baiacu", nome: "Baiacu", emoji: "🐡", raridade: "incomum", preco: 22, peso: 9, texto: "Estufou de susto!" },
  { id: "palhaco", nome: "Peixe-palhaço", emoji: "🐠", raridade: "incomum", preco: 26, peso: 8, texto: "Achei!" },
  { id: "polvo", nome: "Polvo", emoji: "🐙", raridade: "incomum", preco: 30, peso: 6, texto: "Oito braços pra abraçar você." },
  { id: "garrafa", nome: "Garrafa com mensagem", emoji: "🍾", raridade: "incomum", preco: 15, peso: 5, texto: "“Um hábito por dia muda um ano inteiro.”" },
  { id: "lagosta", nome: "Lagosta", emoji: "🦞", raridade: "raro", preco: 60, peso: 3, texto: "Chique demais pra essa ilha." },
  { id: "tubarao", nome: "Tubarãozinho", emoji: "🦈", raridade: "raro", preco: 80, peso: 2.4, texto: "Filhote, ainda bem." },
  { id: "tartaruga", nome: "Tartaruga-marinha", emoji: "🐢", raridade: "raro", preco: 0, peso: 2.2, texto: "Fica na coleção e volta pro mar 💙", soltar: true },
  { id: "dourado", nome: "Peixe dourado", emoji: "✨", raridade: "lendario", preco: 300, peso: 0.6, texto: "Dizem que realiza um desejo…" },
  { id: "tesouro", nome: "Baú afundado", emoji: "🧰", raridade: "lendario", preco: 220, peso: 0.7, texto: "Moedas antigas lá dentro!" },
];

export const NOMES_RARIDADE: Record<Raridade, string> = { lixo: "Lixo", comum: "Comum", incomum: "Incomum", raro: "Raro", lendario: "Lendário" };
export const COR_RARIDADE: Record<Raridade, string> = { lixo: "#9CA3AF", comum: "#86EFAC", incomum: "#7DD3FC", raro: "#C4B5FD", lendario: "#FCD34D" };
export const MAX_ISCAS_DIA = 5;

export type Pesca = { dia?: string; vezes?: number; colecao?: Record<string, number>; balde?: Record<string, number> };

export function achado(id: string) {
  return ACHADOS.find((a) => a.id === id) ?? null;
}

/** Iscas que ainda dá pra usar hoje: 1 por hábito feito (até 5) menos o que já lançou. */
export function iscasHoje(m: DadosMascote | null, feitosHoje: number, hoje: string) {
  const usadas = m?.pesca?.dia === hoje ? (m.pesca.vezes ?? 0) : 0;
  return Math.max(0, Math.min(MAX_ISCAS_DIA, feitosHoje) - usadas);
}

function semente(texto: string) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** O que vem na linha (sorteio por peso, fixo pro mesmo lance do dia). */
export function sortearAchado(hoje: string, lance: number, quem: string): Achado {
  const total = ACHADOS.reduce((s, a) => s + a.peso, 0);
  let x = ((semente(`pesca|${hoje}|${lance}|${quem}`) % 100000) / 100000) * total;
  for (const a of ACHADOS) {
    x -= a.peso;
    if (x < 0) return a;
  }
  return ACHADOS[0];
}

/**
 * Gasta uma isca. `pegou` = puxou na hora certa (senão o peixe escapa,
 * mas a isca foi embora do mesmo jeito).
 */
export function pescar(
  m: DadosMascote,
  feitosHoje: number,
  hoje: string,
  pegou: boolean,
  quem = ""
): { mascote: DadosMascote; achado: Achado | null } | null {
  if (iscasHoje(m, feitosHoje, hoje) <= 0) return null;
  const antes = m.pesca ?? {};
  const vezes = (antes.dia === hoje ? (antes.vezes ?? 0) : 0) + 1;
  const pesca: Pesca = { ...antes, dia: hoje, vezes };
  if (!pegou) return { mascote: { ...m, pesca }, achado: null };
  const a = sortearAchado(hoje, vezes, quem || m.nome);
  pesca.colecao = { ...(antes.colecao ?? {}), [a.id]: (antes.colecao?.[a.id] ?? 0) + 1 };
  if (!a.soltar) pesca.balde = { ...(antes.balde ?? {}), [a.id]: Math.min(99, (antes.balde?.[a.id] ?? 0) + 1) };
  return { mascote: { ...m, pesca }, achado: a };
}

/** Vende tudo de um tipo que está no balde. */
export function venderDoBalde(m: DadosMascote, id: string): { mascote: DadosMascote; moedas: number } | null {
  const a = achado(id);
  const qtd = m.pesca?.balde?.[id] ?? 0;
  if (!a || qtd <= 0 || a.soltar) return null;
  const balde = { ...(m.pesca?.balde ?? {}) };
  delete balde[id];
  const moedas = a.preco * qtd;
  return { mascote: { ...m, pesca: { ...m.pesca, balde }, bonus: (m.bonus ?? 0) + moedas }, moedas };
}

export function progressoColecao(m: DadosMascote | null) {
  const c = m?.pesca?.colecao ?? {};
  return { achados: ACHADOS.filter((a) => (c[a.id] ?? 0) > 0).length, total: ACHADOS.length };
}

export function lerPesca(b: unknown): Pesca | undefined {
  if (!b || typeof b !== "object") return undefined;
  const x = b as any;
  const r: Pesca = {};
  if (typeof x.dia === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.dia)) {
    r.dia = x.dia;
    r.vezes = Math.max(0, Math.min(MAX_ISCAS_DIA, Math.floor(Number(x.vezes) || 0)));
  }
  for (const campo of ["colecao", "balde"] as const) {
    const o: Record<string, number> = {};
    for (const [k, v] of Object.entries(x[campo] ?? {})) {
      const n = Math.floor(Number(v));
      if (achado(k) && n > 0) o[k] = Math.min(9999, n);
    }
    if (Object.keys(o).length) r[campo] = o;
  }
  return Object.keys(r).length ? r : undefined;
}
