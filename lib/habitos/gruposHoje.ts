// Etapa 227 — a lista do "Hoje" agrupada como o Extrato:
// Manhã / Tarde / Noite (pelo horário do lembrete), Qualquer hora e Tarefas.
export type GrupoHojeId = "manha" | "tarde" | "noite" | "qualquer" | "tarefas";

export const TITULOS_GRUPO: Record<GrupoHojeId, string> = {
  manha: "☀️ Manhã",
  tarde: "🌤️ Tarde",
  noite: "🌙 Noite",
  qualquer: "Qualquer hora",
  tarefas: "📋 Tarefas",
};

const ORDEM: GrupoHojeId[] = ["manha", "tarde", "noite", "qualquer", "tarefas"];

type ItemBase = { tipo: "habito" | "tarefa"; horarioLembrete: string | null; feito: boolean };

export function grupoDoItem(item: ItemBase): GrupoHojeId {
  if (item.tipo === "tarefa") return "tarefas";
  const h = item.horarioLembrete ? Number(item.horarioLembrete.slice(0, 2)) : NaN;
  if (Number.isNaN(h)) return "qualquer";
  if (h < 12) return "manha";
  if (h < 18) return "tarde";
  return "noite";
}

/** Mantém a ordem dos itens dentro de cada grupo (quem chama já ordenou). */
export function agruparItensHoje<T extends ItemBase>(itens: T[]): { id: GrupoHojeId; titulo: string; feitos: number; itens: T[] }[] {
  const mapa = new Map<GrupoHojeId, T[]>();
  for (const it of itens) {
    const g = grupoDoItem(it);
    if (!mapa.has(g)) mapa.set(g, []);
    mapa.get(g)!.push(it);
  }
  // só hábitos sem horário e nada mais? mostra sem título de grupo (fica "Hábitos")
  return ORDEM.filter((g) => mapa.has(g)).map((g) => ({
    id: g,
    titulo: g === "qualquer" && mapa.size === 1 ? "Hábitos" : TITULOS_GRUPO[g],
    feitos: mapa.get(g)!.filter((i) => i.feito).length,
    itens: mapa.get(g)!,
  }));
}
