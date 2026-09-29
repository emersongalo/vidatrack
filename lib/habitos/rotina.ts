// Etapa 221 — rotinas (manhã/noite): um grupo de hábitos feito em
// sequência, um toque pra cada. A rotina de cada hábito fica na coluna
// habitos.rotina ("manha" | "noite" | null).
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";

export type Rotina = "manha" | "noite";
export const NOMES_ROTINA: Record<Rotina, { nome: string; emoji: string }> = {
  manha: { nome: "Rotina da manhã", emoji: "☀️" },
  noite: { nome: "Rotina da noite", emoji: "🌙" },
};

/** Antes das 15h mostra a da manhã; depois, a da noite. */
export function rotinaDoMomento(hora: number): Rotina {
  return hora < 15 ? "manha" : "noite";
}

export type ItemRotina = { id: string; nome: string; meta: number; atual: number; feito: boolean };

export function itensDaRotina(
  habitos: any[],
  checkins: { habito_id: string; data: string; quantidade?: number | null }[],
  rotina: Rotina,
  hoje: string
): ItemRotina[] {
  return habitos
    .filter((h) => h.rotina === rotina && !h.eh_negativo && habitoDevidoNoDia(h, hoje))
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((h) => {
      const meta = Math.max(1, Number(h.meta_diaria) || 1);
      const atual = checkins
        .filter((c) => c.habito_id === h.id && c.data === hoje)
        .reduce((s, c) => s + Number(c.quantidade ?? 1), 0);
      return { id: h.id, nome: h.nome, meta, atual, feito: atual >= meta };
    });
}
