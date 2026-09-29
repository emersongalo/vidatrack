// Etapa 224 — "Seu dia" no topo do Painel: hábitos e tarefas de hoje.
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";
import { tarefaApareceNoDia } from "@/lib/agenda/recorrencia";

export type ResumoDia = {
  habitos: { total: number; feitos: number; pendentes: string[] };
  tarefas: { total: number; feitas: number; pendentes: string[] };
};

export function resumoDoDia(s: any, hoje: string): ResumoDia {
  const checkins: any[] = s?.habitoCheckins ?? [];
  const qtd = new Map<string, number>();
  for (const c of checkins) if (c.data === hoje) qtd.set(c.habito_id, (qtd.get(c.habito_id) ?? 0) + Number(c.quantidade ?? 1));

  const devidos = ((s?.habitos ?? []) as any[])
    .filter((h) => !h.eh_negativo && habitoDevidoNoDia(h, hoje))
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const feito = (h: any) => (qtd.get(h.id) ?? 0) >= Math.max(1, Number(h.meta_diaria) || 1);

  const feitasHoje = new Set(((s?.conclusoesTarefas ?? []) as any[]).filter((c) => c.data === hoje).map((c) => c.tarefa_id));
  const tarefas = ((s?.tarefas ?? []) as any[]).filter((t) => {
    try {
      return tarefaApareceNoDia(t, hoje);
    } catch {
      return false;
    }
  });
  const tarefaFeita = (t: any) => ((t.repetir ?? "nenhuma") === "nenhuma" ? !!t.concluida : feitasHoje.has(t.id));

  return {
    habitos: {
      total: devidos.length,
      feitos: devidos.filter(feito).length,
      pendentes: devidos.filter((h) => !feito(h)).map((h) => String(h.nome)),
    },
    tarefas: {
      total: tarefas.length,
      feitas: tarefas.filter(tarefaFeita).length,
      pendentes: tarefas.filter((t) => !tarefaFeita(t)).map((t) => String(t.titulo)),
    },
  };
}

/** Saudação pela hora do dia. */
export function saudacao(hora: number): string {
  if (hora < 5) return "Boa noite";
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}
