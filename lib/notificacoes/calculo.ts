import { diaBateComFrequencia } from "@/lib/agenda/dias";
import { hojeISO } from "@/lib/habitos/streak";
import { lerDispensadosHoje } from "@/lib/notificacoes/dispensados";
import type { SnapshotOffline } from "@/lib/offline/snapshot";

export type LembretePassado = { chave: string; titulo: string; horario: string; href: string };
export type TarefaVencida = { chave: string; id: string; titulo: string; data: string };

/**
 * Etapa 139/140 — usado tanto pela central de notificações quanto
 * pelo indicador (bolinha) no sininho do Painel, pra não duplicar a
 * mesma conta em dois lugares. Já filtra o que a pessoa dispensou
 * hoje, então o sininho não fica com bolinha vermelha de algo que
 * ela já viu e decidiu ignorar.
 */
export function calcularPendencias(snapshot: SnapshotOffline | null | undefined) {
  if (!snapshot) return { tarefasVencidas: [] as TarefaVencida[], lembretesPassados: [] as LembretePassado[] };

  const hoje = hojeISO();
  const agora = new Date().toTimeString().slice(0, 5); // "HH:MM"
  const dispensados = lerDispensadosHoje();

  const checkinsHoje = new Set(
    snapshot.habitoCheckins.filter((c) => c.data === hoje && c.quantidade > 0).map((c) => c.habito_id)
  );
  const tarefasFeitasHoje = new Set(
    snapshot.conclusoesTarefas.filter((c) => c.data === hoje).map((c) => c.tarefa_id)
  );

  const tarefasVencidas: TarefaVencida[] = (snapshot.tarefas as any[])
    .filter((t) => t.repetir === "nenhuma" && !t.concluida && t.data && t.data < hoje)
    .map((t) => ({ chave: `vencida-${t.id}`, id: t.id, titulo: t.titulo, data: t.data }))
    .filter((t) => !dispensados.has(t.chave));

  const lembretesPassados: LembretePassado[] = [];

  for (const h of snapshot.habitos as any[]) {
    if (!h.horario_lembrete) continue;
    if (!diaBateComFrequencia(h.frequencia, h.dias_semana ?? [], hoje)) continue;
    const horario = (h.horario_lembrete as string).slice(0, 5);
    if (horario > agora) continue;
    if (checkinsHoje.has(h.id)) continue;
    const chave = `habito-${h.id}`;
    if (dispensados.has(chave)) continue;
    lembretesPassados.push({ chave, titulo: h.nome, horario, href: "/habitos" });
  }

  for (const t of snapshot.tarefas as any[]) {
    if (!t.horario_lembrete) continue;
    const apareceHoje =
      t.repetir === "nenhuma" ? t.data === hoje : diaBateComFrequencia(t.repetir, t.dias_semana ?? [], hoje);
    if (!apareceHoje) continue;
    const horario = (t.horario_lembrete as string).slice(0, 5);
    if (horario > agora) continue;
    const feita = t.repetir === "nenhuma" ? t.concluida : tarefasFeitasHoje.has(t.id);
    if (feita) continue;
    const chave = `tarefa-${t.id}`;
    if (dispensados.has(chave)) continue;
    lembretesPassados.push({ chave, titulo: t.titulo, horario, href: "/habitos" });
  }

  lembretesPassados.sort((a, b) => (a.horario < b.horario ? 1 : -1));

  return { tarefasVencidas, lembretesPassados };
}
