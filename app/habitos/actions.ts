"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hojeISO, calcularStreak, MARCOS_CONQUISTA } from "@/lib/habitos/streak";
import { camposHabito } from "@/lib/habitos/camposHabito";
import { convidarAoCriar } from "@/lib/compartilhamento/actions";

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

  // Etapa 350 — mesma leitura que o app usa offline
  const campos = camposHabito(formData);
  const nome = campos.nome;
  // Etapa 350 — id criado no aparelho (sem internet): repetir o envio não duplica
  const idCliente = String(formData.get("idCliente") ?? "");
  const idValido = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idCliente) ? idCliente : null;

  if (!nome) {
    redirect(`/habitos/novo?erro=${encodeURIComponent("Dê um nome para o hábito")}`);
  }

  const { data: criado, error } = await supabase.from("habitos").insert({
    ...(idValido ? { id: idValido } : {}),
    dono_id: user!.id,
    ...campos,
    ordem: count ?? 0,
  }).select("id").single();

  if (error?.code === "23505" && idValido) {
    // já tinha chegado (reenvio da fila)
    revalidatePath("/habitos");
    redirect("/habitos");
  }
  if (error) {
    redirect(`/habitos/novo?erro=${encodeURIComponent(error.message)}`);
  }

  // Etapa 303 — "Compartilhar com…" escolhido no formulário
  if (criado?.id) {
    const erroConvite = await convidarAoCriar("habito", criado.id as string, formData);
    if (erroConvite) {
      revalidatePath("/habitos");
      redirect(`/habitos/${criado.id}/compartilhar?erro=${encodeURIComponent(`Hábito criado, mas o convite não saiu: ${erroConvite}`)}`);
    }
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

  const campos = camposHabito(formData, habitoId);
  const nome = campos.nome;

  if (!nome) {
    redirect(`/habitos/${habitoId}/editar?erro=${encodeURIComponent("Dê um nome para o hábito")}`);
  }

  const { error } = await supabase
    .from("habitos")
    .update(campos)
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
    const { error: erroApagar } = await supabase.from("habito_checkins").delete().eq("id", existente.id);
    revalidatePath("/habitos");
    return { marcoAtingido: null, erro: erroApagar?.message ?? null };
  }

  // Etapa 237 — antes o erro era ignorado e a tela parecia ter salvo
  const { error: erroMarcar } = await supabase.from("habito_checkins").insert({
    habito_id: habitoId,
    usuario_id: user!.id,
    data,
  });
  if (erroMarcar) return { marcoAtingido: null, erro: erroMarcar.message };

  revalidatePath("/habitos");

  // Só vale a pena checar conquista quando a pessoa está marcando o
  // dia de HOJE — marcar um dia passado (raro, mas possível) não deve
  // disparar uma comemoração de "streak atual" que não reflete hoje.
  if (data !== hojeISO()) return { marcoAtingido: null, erro: null };

  const { data: checkins } = await supabase
    .from("habito_checkins")
    .select("data")
    .eq("habito_id", habitoId)
    .eq("usuario_id", user!.id);

  const novoStreak = calcularStreak((checkins ?? []).map((c) => c.data));
  const marcoAtingido = MARCOS_CONQUISTA.includes(novoStreak) ? novoStreak : null;

  return { marcoAtingido, erro: null };
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
  let erro: string | null = null;

  if (!existente && novaQuantidade > 0) {
    const { error } = await supabase.from("habito_checkins").insert({
      habito_id: habitoId,
      usuario_id: user!.id,
      data: dataISO,
      quantidade: novaQuantidade,
    });
    erro = error?.message ?? null;
  } else if (existente && novaQuantidade === 0) {
    const { error } = await supabase.from("habito_checkins").delete().eq("id", existente.id);
    erro = error?.message ?? null;
  } else if (existente) {
    // Etapa 237 — .select() pra saber se gravou mesmo (sem permissão, o banco não acusa erro, só não muda nada)
    const { data: mudou, error } = await supabase
      .from("habito_checkins")
      .update({ quantidade: novaQuantidade })
      .eq("id", existente.id)
      .select("id");
    erro = error?.message ?? (!mudou?.length ? "Não deu pra atualizar a quantidade" : null);
  }

  revalidatePath("/habitos");
  return { erro };
}

const SUGESTOES_HABITO: Record<string, { icone: string; cor: string }> = {
  "Beber água": { icone: "Droplet", cor: "habito" },
  "Exercitar-se": { icone: "Footprints", cor: "financa" },
  Ler: { icone: "BookOpen", cor: "nota" },
  Meditar: { icone: "Flower2", cor: "habito" },
  "Dormir cedo": { icone: "Moon", cor: "neutro" },
};

export async function criarHabitoRapido(nome: string) {
  "use server";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sugestao = SUGESTOES_HABITO[nome] ?? { icone: "Sparkles", cor: "habito" };

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

export async function salvarObservacaoCheckin(habitoId: string, dataISO: string, observacao: string) {
  "use server";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("habito_checkins")
    .update({ observacao: observacao.trim() || null })
    .eq("habito_id", habitoId)
    .eq("usuario_id", user.id)
    .eq("data", dataISO);

  revalidatePath("/habitos");
}
