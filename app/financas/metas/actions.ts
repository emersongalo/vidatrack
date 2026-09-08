"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function criarMeta(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nome = String(formData.get("nome") ?? "").trim();
  const valorAlvo = Number(String(formData.get("valorAlvo") ?? "").replace(/\./g, "").replace(",", "."));
  const dataAlvo = String(formData.get("dataAlvo") ?? "") || null;

  if (!nome || !valorAlvo || valorAlvo <= 0) {
    redirect(`/financas/metas?erro=${encodeURIComponent("Dê um nome e um valor alvo válido pra meta")}`);
  }

  const { error } = await supabase.from("metas_financeiras").insert({
    dono_id: user!.id,
    nome,
    valor_alvo: valorAlvo,
    data_alvo: dataAlvo,
  });

  if (error) {
    redirect(`/financas/metas?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/financas/metas");
  redirect("/financas/metas");
}

export async function adicionarProgressoMeta(metaId: string, formData: FormData) {
  "use server";
  const supabase = createClient();

  const valorAdicionar = Number(String(formData.get("valorAdicionar") ?? "").replace(/\./g, "").replace(",", "."));
  if (!valorAdicionar || valorAdicionar <= 0) {
    redirect(`/financas/metas?erro=${encodeURIComponent("Informe um valor válido")}`);
  }

  const { data: meta } = await supabase
    .from("metas_financeiras")
    .select("valor_atual, valor_alvo")
    .eq("id", metaId)
    .single();

  if (!meta) redirect("/financas/metas");

  const novoValor = Number(meta.valor_atual) + valorAdicionar;

  await supabase
    .from("metas_financeiras")
    .update({
      valor_atual: novoValor,
      concluida: novoValor >= Number(meta.valor_alvo),
    })
    .eq("id", metaId);

  revalidatePath("/financas/metas");
  redirect("/financas/metas");
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
