import { diaBateComFrequencia } from "@/lib/agenda/dias";
import { hojeISO } from "@/lib/habitos/streak";
import { lerDispensadosHoje } from "@/lib/notificacoes/dispensados";
import type { SnapshotOffline } from "@/lib/offline/snapshot";

export type LembretePassado = { chave: string; titulo: string; horario: string; href: string };
export type TarefaVencida = { chave: string; id: string; titulo: string; data: string };
export type AlertaCategoria = { chave: string; nome: string; valorAtual: number; percentual: number };

/**
 * Etapa 139/140/165 — usado tanto pela central de notificações
 * quanto pelo indicador (bolinha) no sininho do Painel, pra não
 * duplicar a mesma conta em dois lugares. Já filtra o que a pessoa
 * dispensou hoje, então o sininho não fica com bolinha vermelha de
 * algo que ela já viu e decidiu ignorar.
 */
export function calcularPendencias(snapshot: SnapshotOffline | null | undefined) {
  if (!snapshot)
    return {
      tarefasVencidas: [] as TarefaVencida[],
      lembretesPassados: [] as LembretePassado[],
      alertasCategoria: [] as AlertaCategoria[],
    };

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

  // Etapa 165 — categoria que já subiu muito vs o mesmo período do
  // mês passado (compara só até o dia de hoje nos dois meses, pra
  // não comparar um mês inteiro com um mês ainda pela metade).
  const diaHojeNum = Number(hoje.slice(8, 10));
  const inicioMesAtual = hoje.slice(0, 8) + "01";
  const dataMesAnterior = new Date(hoje + "T00:00:00");
  dataMesAnterior.setMonth(dataMesAnterior.getMonth() - 1);
  const inicioMesAnterior = dataMesAnterior.toLocaleDateString("sv-SE").slice(0, 8) + "01";
  const fimMesAnteriorComparavel = dataMesAnterior.toLocaleDateString("sv-SE").slice(0, 8) + String(diaHojeNum).padStart(2, "0");

  const mapaCategorias = new Map(snapshot.financas.categorias.map((c: any) => [c.id, c.nome]));
  const gastoAtualPorCategoria = new Map<string, number>();
  const gastoAnteriorPorCategoria = new Map<string, number>();
  for (const t of snapshot.financas.transacoes as any[]) {
    if (t.tipo !== "despesa" || !t.categoria_id) continue;
    if (t.data >= inicioMesAtual && t.data <= hoje) {
      gastoAtualPorCategoria.set(t.categoria_id, (gastoAtualPorCategoria.get(t.categoria_id) ?? 0) + Number(t.valor));
    } else if (t.data >= inicioMesAnterior && t.data <= fimMesAnteriorComparavel) {
      gastoAnteriorPorCategoria.set(t.categoria_id, (gastoAnteriorPorCategoria.get(t.categoria_id) ?? 0) + Number(t.valor));
    }
  }

  const alertasCategoria: AlertaCategoria[] = [];
  for (const [categoriaId, valorAtual] of gastoAtualPorCategoria) {
    const valorAnterior = gastoAnteriorPorCategoria.get(categoriaId) ?? 0;
    if (valorAnterior < 50) continue; // ignora categoria com histórico pequeno — vira ruído
    const percentual = ((valorAtual - valorAnterior) / valorAnterior) * 100;
    if (percentual < 30) continue;
    const chave = `categoria-alta-${categoriaId}-${inicioMesAtual}`;
    if (dispensados.has(chave)) continue;
    alertasCategoria.push({ chave, nome: mapaCategorias.get(categoriaId) ?? "Categoria", valorAtual, percentual });
  }
  alertasCategoria.sort((a, b) => b.percentual - a.percentual);

  return { tarefasVencidas, lembretesPassados, alertasCategoria };
}
