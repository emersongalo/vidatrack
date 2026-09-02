"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { esquemaRecorrencia, primeiroErro } from "@/lib/validacao/financas";

export async function criarRecorrencia(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const resultado = esquemaRecorrencia.safeParse({
    tipo: formData.get("tipo"),
    valor: formData.get("valor"),
    contaId: formData.get("contaId"),
    categoriaId: formData.get("categoriaId"),
    descricao: formData.get("descricao"),
    diaMes: formData.get("diaMes"),
    dataFim: formData.get("dataFim"),
  });

  if (!resultado.success) {
    redirect(`/financas/recorrentes?erro=${encodeURIComponent(primeiroErro(resultado))}`);
  }

  const { error } = await supabase.from("financa_recorrencias").insert({
    dono_id: user!.id,
    conta_id: resultado.data.contaId,
    categoria_id: resultado.data.categoriaId,
    tipo: resultado.data.tipo,
    valor: resultado.data.valor,
    descricao: resultado.data.descricao,
    dia_mes: resultado.data.diaMes,
    data_fim: resultado.data.dataFim,
  });

  if (error) {
    redirect(`/financas/recorrentes?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/financas");
  revalidatePath("/financas/recorrentes");
  redirect("/financas/recorrentes");
}

export async function alternarAtivaRecorrencia(recorrenciaId: string) {
  "use server";
  const supabase = createClient();

  const { data: r } = await supabase
    .from("financa_recorrencias")
    .select("ativo")
    .eq("id", recorrenciaId)
    .maybeSingle();

  await supabase
    .from("financa_recorrencias")
    .update({ ativo: !(r?.ativo ?? true) })
    .eq("id", recorrenciaId);

  revalidatePath("/financas/recorrentes");
}

export async function removerRecorrencia(recorrenciaId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("financa_recorrencias").delete().eq("id", recorrenciaId);
  revalidatePath("/financas/recorrentes");
}

/**
 * Gera os lançamentos do mês atual pra cada recorrência ativa que ainda
 * não tem um lançamento nesse mês. Roda toda vez que a tela de Finanças
 * é aberta — não é um agendador de verdade, mas cobre o caso comum de
 * "abro o app pelo menos uma vez por mês".
 */
export async function garantirLancamentosRecorrentes() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const hoje = new Date();
  const diaAtual = hoje.getDate();

  const { data: recorrencias } = await supabase
    .from("financa_recorrencias")
    .select("id, conta_id, categoria_id, tipo, valor, descricao, dia_mes, data_fim")
    .eq("ativo", true)
    .eq("dono_id", user.id)
    .lte("dia_mes", diaAtual);

  if (!recorrencias || recorrencias.length === 0) return;

  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toLocaleDateString("sv-SE");

  const { data: jaGerados } = await supabase
    .from("financa_transacoes")
    .select("recorrencia_id")
    .not("recorrencia_id", "is", null)
    .gte("data", primeiroDiaMes);

  const idsJaGerados = new Set((jaGerados ?? []).map((t) => t.recorrencia_id));

  for (const r of recorrencias) {
    if (idsJaGerados.has(r.id)) continue;

    const data = new Date(hoje.getFullYear(), hoje.getMonth(), r.dia_mes).toLocaleDateString("sv-SE");

    // Se tem data final e esse mês já passou dela, não gera mais —
    // a recorrência "expirou" sozinha, sem precisar excluir na mão.
    if (r.data_fim && data > r.data_fim) continue;

    await supabase.from("financa_transacoes").insert({
      dono_id: user.id,
      conta_id: r.conta_id,
      categoria_id: r.categoria_id,
      tipo: r.tipo,
      valor: r.valor,
      descricao: r.descricao,
      data,
      recorrencia_id: r.id,
    });
  }
}
