"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/habitos/streak";

export async function criarTarefa(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count } = await supabase
    .from("tarefas")
    .select("id", { count: "exact", head: true })
    .eq("dono_id", user!.id);

  const titulo = String(formData.get("titulo") ?? "").trim();
  const icone = String(formData.get("icone") ?? "📝");
  const categoriaIdRaw = String(formData.get("categoriaId") ?? "");
  const repetir = String(formData.get("repetir") ?? "nenhuma");
  const diasSemana = formData.getAll("diasSemana").map(Number);
  const dataRaw = String(formData.get("data") ?? "");
  const horarioLembreteRaw = String(formData.get("horarioLembrete") ?? "");
  const subtarefasTexto = formData.getAll("subtarefaTexto").map((t) => String(t).trim()).filter(Boolean);

  if (!titulo) {
    redirect(`/habitos/tarefas/nova?erro=${encodeURIComponent("Dê um título para a tarefa")}`);
  }

  const subtarefas = subtarefasTexto.map((texto) => ({
    id: randomUUID(),
    texto,
    feita: false,
  }));

  const { error } = await supabase.from("tarefas").insert({
    dono_id: user!.id,
    titulo,
    icone,
    categoria_id: categoriaIdRaw || null,
    repetir,
    dias_semana: repetir === "dias_semana" ? diasSemana : [],
    data: repetir === "nenhuma" ? dataRaw || hojeISO() : null,
    horario_lembrete: horarioLembreteRaw || null,
    subtarefas,
    ordem: count ?? 0,
  });

  if (error) {
    redirect(`/habitos/tarefas/nova?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/habitos");
  revalidatePath("/habitos/tarefas");
  redirect("/habitos/tarefas");
}

export async function atualizarTarefa(tarefaId: string, formData: FormData) {
  const supabase = createClient();

  const titulo = String(formData.get("titulo") ?? "").trim();
  const icone = String(formData.get("icone") ?? "📝");
  const categoriaIdRaw = String(formData.get("categoriaId") ?? "");
  const repetir = String(formData.get("repetir") ?? "nenhuma");
  const diasSemana = formData.getAll("diasSemana").map(Number);
  const dataRaw = String(formData.get("data") ?? "");
  const horarioLembreteRaw = String(formData.get("horarioLembrete") ?? "");

  if (!titulo) {
    redirect(`/habitos/tarefas/${tarefaId}/editar?erro=${encodeURIComponent("Dê um título para a tarefa")}`);
  }

  const { error } = await supabase
    .from("tarefas")
    .update({
      titulo,
      icone,
      categoria_id: categoriaIdRaw || null,
      repetir,
      dias_semana: repetir === "dias_semana" ? diasSemana : [],
      data: repetir === "nenhuma" ? dataRaw || hojeISO() : null,
      horario_lembrete: horarioLembreteRaw || null,
    })
    .eq("id", tarefaId);

  if (error) {
    redirect(`/habitos/tarefas/${tarefaId}/editar?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/habitos");
  revalidatePath("/habitos/tarefas");
  revalidatePath(`/habitos/tarefas/${tarefaId}`);
  redirect(`/habitos/tarefas/${tarefaId}`);
}

export async function alternarConclusaoTarefaUnica(tarefaId: string) {
  "use server";
  const supabase = createClient();

  const { data: tarefa } = await supabase
    .from("tarefas")
    .select("concluida")
    .eq("id", tarefaId)
    .maybeSingle();

  await supabase
    .from("tarefas")
    .update({ concluida: !(tarefa?.concluida ?? false) })
    .eq("id", tarefaId);

  revalidatePath("/habitos");
  revalidatePath("/habitos/tarefas");
}

/**
 * Para tarefas que repetem (mesma lógica dos check-ins de hábito):
 * marca/desmarca a conclusão do dia informado.
 */
export async function alternarConclusaoTarefa(tarefaId: string, dataISO?: string) {
  "use server";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tarefa } = await supabase
    .from("tarefas")
    .select("repetir")
    .eq("id", tarefaId)
    .maybeSingle();

  if (!tarefa || tarefa.repetir === "nenhuma") {
    return alternarConclusaoTarefaUnica(tarefaId);
  }

  const data = dataISO ?? hojeISO();

  const { data: existente } = await supabase
    .from("tarefa_conclusoes")
    .select("id")
    .eq("tarefa_id", tarefaId)
    .eq("usuario_id", user!.id)
    .eq("data", data)
    .maybeSingle();

  if (existente) {
    await supabase.from("tarefa_conclusoes").delete().eq("id", existente.id);
  } else {
    await supabase.from("tarefa_conclusoes").insert({
      tarefa_id: tarefaId,
      usuario_id: user!.id,
      data,
    });
  }

  revalidatePath("/habitos");
}

export async function alternarSubtarefa(tarefaId: string, subtarefaId: string) {
  "use server";
  const supabase = createClient();

  const { data: tarefa } = await supabase
    .from("tarefas")
    .select("subtarefas")
    .eq("id", tarefaId)
    .maybeSingle();

  if (!tarefa) return;

  const subtarefas = (tarefa.subtarefas as any[]).map((s) =>
    s.id === subtarefaId ? { ...s, feita: !s.feita } : s
  );

  await supabase.from("tarefas").update({ subtarefas }).eq("id", tarefaId);

  revalidatePath(`/habitos/tarefas/${tarefaId}`);
  revalidatePath("/habitos");
  revalidatePath("/habitos/tarefas");
}

export async function arquivarTarefa(tarefaId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("tarefas").update({ arquivada: true }).eq("id", tarefaId);
  revalidatePath("/habitos");
  revalidatePath("/habitos/tarefas");
  redirect("/habitos/tarefas");
}

export async function reordenarTarefas(idsEmOrdem: string[]) {
  "use server";
  const supabase = createClient();
  await Promise.all(
    idsEmOrdem.map((id, indice) => supabase.from("tarefas").update({ ordem: indice }).eq("id", id))
  );
  revalidatePath("/habitos/tarefas");
  revalidatePath("/habitos");
}

export async function restaurarTarefa(tarefaId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("tarefas").update({ arquivada: false }).eq("id", tarefaId);
  revalidatePath("/habitos/tarefas");
  revalidatePath("/habitos");
  revalidatePath("/habitos/tarefas/lixeira");
}

export async function excluirTarefaDefinitivamente(tarefaId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("compartilhamentos").delete().eq("tipo_item", "tarefa").eq("item_id", tarefaId);
  await supabase.from("tarefas").delete().eq("id", tarefaId);
  revalidatePath("/habitos/tarefas/lixeira");
}
