// Etapa 282 — modo rápido: o que dá pra resolver hoje em 1 toque.
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";
import { tarefaApareceNoDia, tarefaAtrasada } from "@/lib/agenda/recorrencia";

export type HabitoRapido = { id: string; nome: string; icone: string; cor: string; meta: number; atual: number; unidade: string | null };
export type TarefaRapida = { id: string; titulo: string; icone: string; feita: boolean; atrasada: boolean };

export function habitosDeHoje(habitos: any[], checkins: any[], hoje: string, meuId?: string): HabitoRapido[] {
  return habitos
    .filter((h) => !h.eh_negativo && !h.arquivado && habitoDevidoNoDia(h, hoje))
    .map((h) => ({
      id: h.id,
      nome: h.nome,
      icone: h.icone,
      cor: h.cor,
      unidade: h.unidade ?? null,
      meta: Math.max(1, Number(h.meta_diaria) || 1),
      atual: checkins
        .filter((c) => c.habito_id === h.id && c.data === hoje && (!c.usuario_id || !meuId || c.usuario_id === meuId))
        .reduce((s, c) => s + Number(c.quantidade ?? 1), 0),
    }))
    .sort((a, b) => Number(a.atual >= a.meta) - Number(b.atual >= b.meta) || (a.nome ?? "").localeCompare(b.nome ?? ""));
}

export function tarefasDeHoje(tarefas: any[], conclusoes: { tarefa_id: string; data: string }[], hoje: string): TarefaRapida[] {
  const feitasHoje = new Set(conclusoes.filter((c) => c.data === hoje).map((c) => c.tarefa_id));
  return tarefas
    .filter((t) => !t.arquivada && (tarefaApareceNoDia(t, hoje) || tarefaAtrasada(t, hoje)))
    .map((t) => ({
      id: t.id,
      titulo: t.titulo,
      icone: t.icone,
      feita: t.repetir === "nenhuma" ? !!t.concluida : feitasHoje.has(t.id),
      atrasada: tarefaAtrasada(t, hoje),
    }))
    .filter((t) => !(t.atrasada && t.feita))
    .sort((a, b) => Number(a.feita) - Number(b.feita) || Number(b.atrasada) - Number(a.atrasada));
}
