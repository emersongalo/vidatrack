import { createClient } from "@/lib/supabase/server";
import { diaBateComFrequencia } from "@/lib/agenda/dias";
import type { ItemAgenda } from "@/components/ItemLinhaAgenda";

export async function buscarItensDoDia(
  dataSelecionada: string,
  categoriaFiltro: string
): Promise<{ itens: ItemAgenda[]; temAlgumItemCadastrado: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: habitos }, { data: tarefas }] = await Promise.all([
    supabase
      .from("habitos")
      .select("id, nome, cor, icone, categoria_id, frequencia, dias_semana, horario_lembrete, meta_diaria, unidade, ordem, dono_id")
      .eq("arquivado", false),
    supabase
      .from("tarefas")
      .select("id, titulo, icone, categoria_id, repetir, dias_semana, data, horario_lembrete, concluida, subtarefas, ordem")
      .eq("arquivada", false),
  ]);

  const idsHabitos = (habitos ?? []).map((h) => h.id);
  const idsTarefasRepetem = (tarefas ?? []).filter((t) => t.repetir !== "nenhuma").map((t) => t.id);

  const [{ data: checkins }, { data: conclusoesTarefa }, { data: compartilhamentosHabitos }] = await Promise.all([
    idsHabitos.length
      ? supabase
          .from("habito_checkins")
          .select("habito_id, quantidade")
          .eq("data", dataSelecionada)
          .eq("usuario_id", user?.id ?? "")
          .in("habito_id", idsHabitos)
      : Promise.resolve({ data: [] as { habito_id: string; quantidade: number }[] }),
    idsTarefasRepetem.length
      ? supabase
          .from("tarefa_conclusoes")
          .select("tarefa_id")
          .eq("data", dataSelecionada)
          .eq("usuario_id", user?.id ?? "")
          .in("tarefa_id", idsTarefasRepetem)
      : Promise.resolve({ data: [] as { tarefa_id: string }[] }),
    idsHabitos.length
      ? supabase
          .from("compartilhamentos")
          .select("item_id, usuario_convidado_id")
          .eq("tipo_item", "habito")
          .in("item_id", idsHabitos)
          .not("usuario_convidado_id", "is", null)
      : Promise.resolve({ data: [] as { item_id: string; usuario_convidado_id: string }[] }),
  ]);

  const quantidadePorHabito = new Map((checkins ?? []).map((c) => [c.habito_id, c.quantidade]));
  const tarefasFeitasHoje = new Set((conclusoesTarefa ?? []).map((c) => c.tarefa_id));

  // Hábitos com mais de uma pessoa (dono + convidados) — só esses
  // ganham o visual de "quem já fez hoje" lado a lado.
  const participantesPorHabito = new Map<string, string[]>();
  for (const h of habitos ?? []) participantesPorHabito.set(h.id, [h.dono_id]);
  for (const c of compartilhamentosHabitos ?? []) {
    const lista = participantesPorHabito.get(c.item_id) ?? [];
    lista.push(c.usuario_convidado_id);
    participantesPorHabito.set(c.item_id, lista);
  }

  const idsHabitosCompartilhados = Array.from(participantesPorHabito.entries())
    .filter(([, pessoas]) => pessoas.length > 1)
    .map(([habitoId]) => habitoId);

  const todosParticipantesUnicos = Array.from(
    new Set(Array.from(participantesPorHabito.values()).flat())
  );

  let mapaNomesParticipantes = new Map<string, string>();
  let checkinsDeTodos: { habito_id: string; usuario_id: string; quantidade: number }[] = [];

  if (idsHabitosCompartilhados.length > 0) {
    const [{ data: perfis }, { data: checkinsTodos }] = await Promise.all([
      supabase.from("perfis").select("id, nome").in("id", todosParticipantesUnicos),
      supabase
        .from("habito_checkins")
        .select("habito_id, usuario_id, quantidade")
        .eq("data", dataSelecionada)
        .in("habito_id", idsHabitosCompartilhados)
        .in("usuario_id", todosParticipantesUnicos),
    ]);
    mapaNomesParticipantes = new Map((perfis ?? []).map((p) => [p.id, p.nome ?? "Alguém"]));
    checkinsDeTodos = checkinsTodos ?? [];
  }

  let itens: ItemAgenda[] = [];

  for (const h of habitos ?? []) {
    if (!diaBateComFrequencia(h.frequencia, h.dias_semana ?? [], dataSelecionada)) continue;
    if (categoriaFiltro && h.categoria_id !== categoriaFiltro) continue;
    const quantidadeAtual = quantidadePorHabito.get(h.id) ?? 0;
    const meta = h.meta_diaria ?? 1;

    const participantesIds = participantesPorHabito.get(h.id) ?? [];
    const participantes =
      participantesIds.length > 1
        ? participantesIds.map((idPessoa) => {
            const quantidadePessoa =
              checkinsDeTodos.find((c) => c.habito_id === h.id && c.usuario_id === idPessoa)?.quantidade ?? 0;
            return {
              nome: idPessoa === user?.id ? "Você" : mapaNomesParticipantes.get(idPessoa) ?? "Alguém",
              feito: quantidadePessoa >= meta,
            };
          })
        : undefined;

    itens.push({
      id: h.id,
      tipo: "habito",
      titulo: h.nome,
      icone: h.icone,
      cor: h.cor,
      feito: quantidadeAtual >= meta,
      repete: true,
      horarioLembrete: h.horario_lembrete,
      meta: meta > 1 ? { atual: quantidadeAtual, alvo: meta, unidade: h.unidade } : null,
      ordem: h.ordem,
      participantes,
    });
  }

  for (const t of tarefas ?? []) {
    const apareceHoje =
      t.repetir === "nenhuma"
        ? t.data === dataSelecionada
        : diaBateComFrequencia(t.repetir, t.dias_semana ?? [], dataSelecionada);
    if (!apareceHoje) continue;
    if (categoriaFiltro && t.categoria_id !== categoriaFiltro) continue;

    const subtarefas = (t.subtarefas as { feita: boolean }[]) ?? [];

    itens.push({
      id: t.id,
      tipo: "tarefa",
      titulo: t.titulo,
      icone: t.icone,
      cor: "nota",
      feito: t.repetir === "nenhuma" ? t.concluida : tarefasFeitasHoje.has(t.id),
      repete: t.repetir !== "nenhuma",
      horarioLembrete: t.horario_lembrete,
      progressoSubtarefas:
        subtarefas.length > 0
          ? { feitas: subtarefas.filter((s) => s.feita).length, total: subtarefas.length }
          : null,
      ordem: t.ordem,
    });
  }

  itens = itens.sort((a, b) => {
    if (a.feito !== b.feito) return a.feito ? 1 : -1;
    return a.ordem - b.ordem;
  });

  return {
    itens,
    temAlgumItemCadastrado: (habitos ?? []).length > 0 || (tarefas ?? []).length > 0,
  };
}
