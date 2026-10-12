// Etapa 312 — temas da ilha do Mundo: mudam as cores do chão, das
// árvores e da água, e alguns trazem neve, folhas ou pétalas caindo.
import type { DadosMascote } from "@/lib/mascote/mascote";

export type TemaIlha = {
  id: string;
  nome: string;
  emoji: string;
  preco: number;
  grama: [string, string];
  linha: string;
  caminho: [string, string];
  areia: string;
  agua: string;
  aguaNoite: string;
  copa: [string, string];
  tronco: string;
  particula?: "neve" | "folhas" | "petalas" | "brasas";
};

export const TEMAS_ILHA: TemaIlha[] = [
  {
    id: "tropical",
    nome: "Tropical",
    emoji: "🏝️",
    preco: 0,
    grama: ["#86C77A", "#7BBE6F"],
    linha: "#6FAE63",
    caminho: ["#D6CFC0", "#CFC7B6"],
    areia: "#F3D9A4",
    agua: "#60A5FA",
    aguaNoite: "#1E3A8A",
    copa: ["#3F9D5A", "#5CC27A"],
    tronco: "#8B5A2B",
  },
  {
    id: "outono",
    nome: "Outono",
    emoji: "🍂",
    preco: 600,
    grama: ["#C8B65A", "#BBA84E"],
    linha: "#A8943F",
    caminho: ["#D8C7A8", "#CDBB9B"],
    areia: "#E9CF9A",
    agua: "#5B8FD6",
    aguaNoite: "#1E3A8A",
    copa: ["#E07A2E", "#F2A541"],
    tronco: "#7A4E2E",
    particula: "folhas",
  },
  {
    id: "deserto",
    nome: "Deserto",
    emoji: "🌵",
    preco: 700,
    grama: ["#E8C887", "#DDBB75"],
    linha: "#C9A562",
    caminho: ["#C9A46B", "#BE9960"],
    areia: "#F1D9A0",
    agua: "#2DD4BF",
    aguaNoite: "#115E59",
    copa: ["#5E9E4E", "#7DBA62"],
    tronco: "#A16207",
  },
  {
    id: "inverno",
    nome: "Inverno",
    emoji: "❄️",
    preco: 800,
    grama: ["#F1F5F9", "#E2E8F0"],
    linha: "#CBD5E1",
    caminho: ["#B9C3CF", "#AEB9C6"],
    areia: "#E2E8F0",
    agua: "#7DD3FC",
    aguaNoite: "#1E3A8A",
    copa: ["#1F6F4A", "#2E8B57"],
    tronco: "#6B4A30",
    particula: "neve",
  },
  {
    id: "cerejeira",
    nome: "Cerejeira",
    emoji: "🌸",
    preco: 1000,
    grama: ["#A5D99A", "#98CF8C"],
    linha: "#86BE7B",
    caminho: ["#E7D9D3", "#DDCDC6"],
    areia: "#F6DCC0",
    agua: "#93C5FD",
    aguaNoite: "#312E81",
    copa: ["#F9A8D4", "#F472B6"],
    tronco: "#7A4E2E",
    particula: "petalas",
  },
  {
    id: "vulcanica",
    nome: "Vulcânica",
    emoji: "🌋",
    preco: 1500,
    grama: ["#57534E", "#4B4642"],
    linha: "#3F3A36",
    caminho: ["#78716C", "#6B6560"],
    areia: "#44403C",
    agua: "#F97316",
    aguaNoite: "#C2410C",
    copa: ["#365314", "#4D7C0F"],
    tronco: "#292524",
    particula: "brasas",
  },
];

export const temaIlha = (id?: string | null) => TEMAS_ILHA.find((t) => t.id === id) ?? TEMAS_ILHA[0];

export function temTema(m: DadosMascote | null, id: string) {
  return id === "tropical" || !!m?.temasIlha?.includes(id);
}

export function comprarTema(m: DadosMascote, id: string, saldo: number): { mascote: DadosMascote } | { erro: string } {
  const t = TEMAS_ILHA.find((x) => x.id === id);
  if (!t) return { erro: "Não existe" };
  if (temTema(m, id)) return { erro: "Já é seu" };
  if (saldo < t.preco) return { erro: `Faltam ${t.preco - saldo} 🪙` };
  return { mascote: { ...m, temasIlha: [...(m.temasIlha ?? []), id], temaIlha: id, gastos: (m.gastos ?? 0) + t.preco } };
}

export function usarTema(m: DadosMascote, id: string): DadosMascote | null {
  if (!temTema(m, id)) return null;
  const r = { ...m };
  if (id === "tropical") delete r.temaIlha;
  else r.temaIlha = id;
  return r;
}
