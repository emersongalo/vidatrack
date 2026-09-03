"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/habitos/streak";

export async function criarHabito(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count } = await supabase
    .from("habitos")
    .select("id", { count: "exact", head: true })
    .eq("dono_id", user!.id);

  const nome = String(formData.get("nome") ?? "").trim();
  const cor = String(formData.get("cor") ?? "habito");
  const icone = String(formData.get("icone") ?? "💧");
  const frequencia = String(formData.get("frequencia") ?? "diaria");
  const diasSemana = formData.getAll("diasSemana").map(Number);
  const categoriaIdRaw = String(formData.get("categoriaId") ?? "");
  const horarioLembreteRaw = String(formData.get("horarioLembrete") ?? "");
  const metaDiaria = Math.max(1, Number(formData.get("metaDiaria") ?? "1") || 1);
  const unidade = String(formData.get("unidade") ?? "").trim() || null;

  if (!nome) {
    redirect(`/habitos/novo?erro=${encodeURIComponent("Dê um nome para o hábito")}`);
  }

  const { error } = await supabase.from("habitos").insert({
    dono_id: user!.id,
    nome,
    cor,
    icone,
    frequencia,
    dias_semana: frequencia === "dias_semana" ? diasSemana : [],
    categoria_id: categoriaIdRaw || null,
    horario_lembrete: horarioLembreteRaw || null,
    meta_diaria: metaDiaria,
    unidade,
    ordem: count ?? 0,
  });

  if (error) {
    redirect(`/habitos/novo?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/habitos");
  redirect("/habitos");
}

/**
 * Versão silenciosa (sem `redirect`) de criar hábito, pra fila offline
 * (Etapa 44) — escopo reduzido de propósito (nome + ícone + cor +
 * frequência diária), que é o caso mais comum de "lembrei de um
 * hábito novo agora, sem internet". Ajustes mais específicos (dias da
 * semana, meta numérica, lembrete) continuam exigindo estar online,
 * editando o hábito depois.
 */
export async function criarHabitoSilencioso(dados: {
  nome: string;
  icone: string;
  cor: string;
}): Promise<{ sucesso: boolean; erro?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Sessão expirada" };

  if (!dados.nome.trim()) return { sucesso: false, erro: "Dê um nome para o hábito" };

  const { count } = await supabase
    .from("habitos")
    .select("id", { count: "exact", head: true })
    .eq("dono_id", user.id);

  const { error } = await supabase.from("habitos").insert({
    dono_id: user.id,
    nome: dados.nome.trim(),
    cor: dados.cor,
    icone: dados.icone,
    frequencia: "diaria",
    dias_semana: [],
    meta_diaria: 1,
    ordem: count ?? 0,
  });

  revalidatePath("/habitos");
  revalidatePath("/habitos/lista");
  return { sucesso: !error, erro: error?.message };
}

export async function atualizarHabito(habitoId: string, formData: FormData) {
  const supabase = createClient();

  const nome = String(formData.get("nome") ?? "").trim();
  const cor = String(formData.get("cor") ?? "habito");
  const icone = String(formData.get("icone") ?? "💧");
  const frequencia = String(formData.get("frequencia") ?? "diaria");
  const diasSemana = formData.getAll("diasSemana").map(Number);
  const categoriaIdRaw = String(formData.get("categoriaId") ?? "");
  const horarioLembreteRaw = String(formData.get("horarioLembrete") ?? "");
  const metaDiaria = Math.max(1, Number(formData.get("metaDiaria") ?? "1") || 1);
  const unidade = String(formData.get("unidade") ?? "").trim() || null;

  if (!nome) {
    redirect(`/habitos/${habitoId}/editar?erro=${encodeURIComponent("Dê um nome para o hábito")}`);
  }

  const { error } = await supabase
    .from("habitos")
    .update({
      nome,
      cor,
      icone,
      frequencia,
      dias_semana: frequencia === "dias_semana" ? diasSemana : [],
      categoria_id: categoriaIdRaw || null,
      horario_lembrete: horarioLembreteRaw || null,
      meta_diaria: metaDiaria,
      unidade,
    })
    .eq("id", habitoId);

  if (error) {
    redirect(`/habitos/${habitoId}/editar?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/habitos");
  revalidatePath("/habitos/lista");
  redirect("/habitos/lista");
}

export async function alternarCheckin(habitoId: string, dataISO?: string) {
  "use server";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = dataISO ?? hojeISO();

  const { data: existente } = await supabase
    .from("habito_checkins")
    .select("id")
    .eq("habito_id", habitoId)
    .eq("usuario_id", user!.id)
    .eq("data", data)
    .maybeSingle();

  if (existente) {
    await supabase.from("habito_checkins").delete().eq("id", existente.id);
  } else {
    await supabase.from("habito_checkins").insert({
      habito_id: habitoId,
      usuario_id: user!.id,
      data,
    });
  }

  revalidatePath("/habitos");
}

/**
 * Para hábitos com meta numérica (ex: 8 copos de água): soma ou subtrai
 * uma unidade da quantidade do dia. Zerou, remove a linha.
 */
export async function ajustarQuantidadeHabito(habitoId: string, dataISO: string, delta: number) {
  "use server";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existente } = await supabase
    .from("habito_checkins")
    .select("id, quantidade")
    .eq("habito_id", habitoId)
    .eq("usuario_id", user!.id)
    .eq("data", dataISO)
    .maybeSingle();

  const novaQuantidade = Math.max(0, (existente?.quantidade ?? 0) + delta);

  if (!existente && novaQuantidade > 0) {
    await supabase.from("habito_checkins").insert({
      habito_id: habitoId,
      usuario_id: user!.id,
      data: dataISO,
      quantidade: novaQuantidade,
    });
  } else if (existente && novaQuantidade === 0) {
    await supabase.from("habito_checkins").delete().eq("id", existente.id);
  } else if (existente) {
    await supabase.from("habito_checkins").update({ quantidade: novaQuantidade }).eq("id", existente.id);
  }

  revalidatePath("/habitos");
}

const SUGESTOES_HABITO: Record<string, { icone: string; cor: string }> = {
  "Beber água": { icone: "💧", cor: "habito" },
  "Exercitar-se": { icone: "🏃", cor: "financa" },
  Ler: { icone: "📖", cor: "nota" },
  Meditar: { icone: "🧘", cor: "habito" },
  "Dormir cedo": { icone: "😴", cor: "neutro" },
};

export async function criarHabitoRapido(nome: string) {
  "use server";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sugestao = SUGESTOES_HABITO[nome] ?? { icone: "✨", cor: "habito" };

  await supabase.from("habitos").insert({
    dono_id: user!.id,
    nome,
    icone: sugestao.icone,
    cor: sugestao.cor,
    frequencia: "diaria",
  });

  revalidatePath("/habitos");
}

export async function reordenarHabitos(idsEmOrdem: string[]) {
  "use server";
  const supabase = createClient();
  await Promise.all(
    idsEmOrdem.map((id, indice) => supabase.from("habitos").update({ ordem: indice }).eq("id", id))
  );
  revalidatePath("/habitos/lista");
  revalidatePath("/habitos");
}

export async function arquivarHabito(habitoId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("habitos").update({ arquivado: true }).eq("id", habitoId);
  revalidatePath("/habitos");
  revalidatePath("/habitos/lista");
}

export async function restaurarHabito(habitoId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("habitos").update({ arquivado: false }).eq("id", habitoId);
  revalidatePath("/habitos");
  revalidatePath("/habitos/lista");
  revalidatePath("/habitos/lixeira");
}

export async function excluirHabitoDefinitivamente(habitoId: string) {
  "use server";
  const supabase = createClient();
  // Limpa compartilhamentos órfãos (a tabela não tem FK real pra
  // habitos, já que é usada também por notas/tarefas/finanças)
  await supabase.from("compartilhamentos").delete().eq("tipo_item", "habito").eq("item_id", habitoId);
  await supabase.from("habitos").delete().eq("id", habitoId);
  revalidatePath("/habitos/lixeira");
}
