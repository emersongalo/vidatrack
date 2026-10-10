// Etapa 281 — calendário único: hábitos, tarefas e dinheiro no mesmo mês.
// Função pura sobre o retrato local.
import type { SnapshotOffline } from "@/lib/offline/snapshot";
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";
import { tarefaApareceNoDia } from "@/lib/agenda/recorrencia";

export type DiaCalendario = {
  dia: string;
  habitosDevidos: number;
  habitosFeitos: number;
  tarefas: number;
  tarefasFeitas: number;
  receitas: number;
  despesas: number;
  /** tem lançamento futuro / esperando confirmar */
  agendado: boolean;
};

export function diasDoMes(mes: string): string[] {
  const [a, m] = mes.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return Array.from({ length: ultimo }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`);
}

export function calendarioDoMes(snapshot: SnapshotOffline, mes: string, hoje: string): Map<string, DiaCalendario> {
  const dias = diasDoMes(mes);
  const inicio = dias[0];
  const fim = dias[dias.length - 1];
  const meuId = snapshot.perfil.id;
  const mapa = new Map<string, DiaCalendario>(
    dias.map((d) => [d, { dia: d, habitosDevidos: 0, habitosFeitos: 0, tarefas: 0, tarefasFeitas: 0, receitas: 0, despesas: 0, agendado: false }])
  );

  // hábitos (positivos): devidos no dia e feitos (meta batida)
  const qtd = new Map<string, number>();
  for (const c of snapshot.habitoCheckins as any[]) {
    if (c.usuario_id && c.usuario_id !== meuId) continue;
    if (c.data < inicio || c.data > fim) continue;
    const k = `${c.habito_id}|${c.data}`;
    qtd.set(k, (qtd.get(k) ?? 0) + Number(c.quantidade ?? 1));
  }
  for (const h of snapshot.habitos as any[]) {
    if (h.eh_negativo || h.arquivado) continue;
    const meta = Math.max(1, Number(h.meta_diaria) || 1);
    const criado = String(h.criado_em ?? "").slice(0, 10) || "0000-00-00";
    for (const d of dias) {
      if (d < criado || d > hoje) continue;
      const feito = (qtd.get(`${h.id}|${d}`) ?? 0) >= meta;
      const devido = h.frequencia !== "semanal" && habitoDevidoNoDia(h, d);
      const info = mapa.get(d)!;
      if (devido) info.habitosDevidos++;
      if (feito) info.habitosFeitos++;
    }
  }

  // tarefas: as que caem no dia (e quais foram feitas)
  const conclusoes = new Set(snapshot.conclusoesTarefas.map((c) => `${c.tarefa_id}|${c.data}`));
  for (const t of snapshot.tarefas as any[]) {
    if (t.arquivada) continue;
    for (const d of dias) {
      if (!tarefaApareceNoDia(t, d)) continue;
      const info = mapa.get(d)!;
      info.tarefas++;
      if (t.repetir === "nenhuma" ? !!t.concluida : conclusoes.has(`${t.id}|${d}`)) info.tarefasFeitas++;
    }
  }

  // dinheiro (sem transferências)
  for (const t of snapshot.financas.transacoes as any[]) {
    if (t.data < inicio || t.data > fim || t.transferencia_grupo) continue;
    const info = mapa.get(t.data);
    if (!info) continue;
    if (t.tipo === "receita") info.receitas += Number(t.valor);
    else info.despesas += Number(t.valor);
    if (t.data > hoje && !t.pago_em) info.agendado = true;
  }
  return mapa;
}
