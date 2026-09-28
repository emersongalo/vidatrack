"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function criarMeta(formData: FormData): Promise<{ erro?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Saia e entre de novo." };

  const nome = String(formData.get("nome") ?? "").trim();
  const valorAlvo = Number(String(formData.get("valorAlvo") ?? "").replace(/\./g, "").replace(",", "."));
  const dataAlvo = String(formData.get("dataAlvo") ?? "") || null;

  if (!nome || !valorAlvo || valorAlvo <= 0) return { erro: "Dê um nome e um valor alvo válido pra meta" };

  const { error } = await supabase.from("metas_financeiras").insert({
    dono_id: user.id,
    nome,
    valor_alvo: valorAlvo,
    data_alvo: dataAlvo,
  });
  if (error) return { erro: error.message };

  revalidatePath("/financas/metas");
  return {};
}

export async function adicionarProgressoMeta(metaId: string, formData: FormData): Promise<{ erro?: string }> {
  "use server";
  const supabase = createClient();

  const valorAdicionar = Number(String(formData.get("valorAdicionar") ?? "").replace(/\./g, "").replace(",", "."));
  if (!valorAdicionar || valorAdicionar <= 0) return { erro: "Informe um valor válido" };

  const { data: meta } = await supabase
    .from("metas_financeiras")
    .select("valor_atual, valor_alvo")
    .eq("id", metaId)
    .single();
  if (!meta) return { erro: "Meta não encontrada" };

  const novoValor = Number(meta.valor_atual) + valorAdicionar;
  const { error } = await supabase
    .from("metas_financeiras")
    .update({
      valor_atual: novoValor,
      concluida: novoValor >= Number(meta.valor_alvo),
    })
    .eq("id", metaId);
  if (error) return { erro: error.message };

  revalidatePath("/financas/metas");
  return {};
}

export async function arquivarMeta(metaId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("metas_financeiras").update({ arquivada: true }).eq("id", metaId);
  revalidatePath("/financas/metas");
}

export async function excluirMetaDefinitivamente(metaId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("metas_financeiras").delete().eq("id", metaId);
  revalidatePath("/financas/metas");
}

// Etapa 215 — tirar dinheiro da meta (usou parte, ou lançou errado)
export async function retirarDaMeta(metaId: string, formData: FormData): Promise<{ erro?: string }> {
  const supabase = createClient();
  const valor = Number(String(formData.get("valorRetirar") ?? "").replace(/\./g, "").replace(",", "."));
  if (!valor || valor <= 0) return { erro: "Informe um valor válido" };
  const { data: meta } = await supabase.from("metas_financeiras").select("valor_atual, valor_alvo").eq("id", metaId).single();
  if (!meta) return { erro: "Meta não encontrada" };
  const novoValor = Math.max(0, Number(meta.valor_atual) - valor);
  const { error } = await supabase
    .from("metas_financeiras")
    .update({ valor_atual: novoValor, concluida: novoValor >= Number(meta.valor_alvo) })
    .eq("id", metaId);
  if (error) return { erro: error.message };
  revalidatePath("/financas/metas");
  return {};
}

// Etapa 215 — editar nome, valor alvo e prazo
export async function editarMeta(metaId: string, formData: FormData): Promise<{ erro?: string }> {
  const supabase = createClient();
  const nome = String(formData.get("nome") ?? "").trim();
  const valorAlvo = Number(String(formData.get("valorAlvo") ?? "").replace(/\./g, "").replace(",", "."));
  const dataAlvo = String(formData.get("dataAlvo") ?? "") || null;
  if (!nome || !valorAlvo || valorAlvo <= 0) return { erro: "Dê um nome e um valor alvo válido pra meta" };
  const { data: meta } = await supabase.from("metas_financeiras").select("valor_atual").eq("id", metaId).single();
  if (!meta) return { erro: "Meta não encontrada" };
  const { error } = await supabase
    .from("metas_financeiras")
    .update({ nome, valor_alvo: valorAlvo, data_alvo: dataAlvo, concluida: Number(meta.valor_atual) >= valorAlvo })
    .eq("id", metaId);
  if (error) return { erro: error.message };
  revalidatePath("/financas/metas");
  return {};
}
