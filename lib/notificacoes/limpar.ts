// Etapa 328 — quando a pessoa já fez o hábito/tarefa, o aviso que ficou
// na barra de notificações some sozinho (ao abrir o app ou ao marcar).
// Aqui: quais títulos de notificação correspondem ao que já foi feito hoje.
// (Os títulos são os mesmos que o servidor manda em /api/lembretes.)

type Snap = {
  habitos?: any[];
  habitoCheckins?: { habito_id: string; data: string; quantidade?: number }[];
  tarefas?: any[];
  conclusoesTarefas?: { tarefa_id: string; data: string }[];
} | null;

export function inicioDosTitulosFeitos(s: Snap, hoje: string): string[] {
  if (!s) return [];
  const qtd = new Map<string, number>();
  for (const c of s.habitoCheckins ?? []) if (c.data === hoje) qtd.set(c.habito_id, (qtd.get(c.habito_id) ?? 0) + Number(c.quantidade ?? 1));
  const titulos: string[] = [];
  for (const h of s.habitos ?? []) {
    if (h.eh_negativo) continue;
    const meta = Math.max(1, Number(h.meta_diaria) || 1);
    if ((qtd.get(h.id) ?? 0) < meta) continue;
    titulos.push(`🔔 Hora de: ${h.nome}`, `🔔 ${h.nome}: `);
  }
  const feitasHoje = new Set((s.conclusoesTarefas ?? []).filter((c) => c.data === hoje).map((c) => c.tarefa_id));
  for (const t of s.tarefas ?? []) {
    const feita = t.repetir === "nenhuma" || !t.repetir ? !!t.concluida : feitasHoje.has(t.id);
    if (feita) titulos.push(`📝 Lembrete: ${t.titulo}`);
  }
  return titulos;
}

export function tituloJaFeito(titulo: string | undefined | null, inicios: string[]) {
  if (!titulo) return false;
  return inicios.some((i) => (i.endsWith(": ") ? titulo.startsWith(i) : titulo === i));
}
