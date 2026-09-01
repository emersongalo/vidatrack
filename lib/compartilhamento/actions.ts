"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export type TipoItem = "habito" | "nota" | "financa" | "tarefa";

export async function convidarCompartilhamento(
  tipoItem: TipoItem,
  itemId: string,
  caminhoRetorno: string,
  formData: FormData
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const permissao = String(formData.get("permissao") ?? "leitura");

  if (!email) {
    redirect(`${caminhoRetorno}?erro=${encodeURIComponent("Digite um e-mail")}`);
  }

  if (email === user!.email?.toLowerCase()) {
    redirect(`${caminhoRetorno}?erro=${encodeURIComponent("Você não pode se convidar")}`);
  }

  // Usa o cliente administrativo aqui de propósito: a função
  // buscar_usuario_por_email não pode mais ser chamada por usuários
  // comuns (ver Etapa 11 — evita que qualquer pessoa logada descubra
  // se um e-mail arbitrário tem conta no VidaTrack).
  const admin = criarClienteAdmin("verificar_email_convite", `Convite de compartilhamento (${tipoItem})`);
  const { data: idConvidado } = await admin.rpc("buscar_usuario_por_email", {
    p_email: email,
  });

  const { error } = await supabase.from("compartilhamentos").insert({
    tipo_item: tipoItem,
    item_id: itemId,
    dono_id: user!.id,
    usuario_convidado_id: idConvidado ?? null,
    email_convidado: email,
    permissao,
  });

  if (error) {
    const mensagem = error.code === "23505" ? "Essa pessoa já foi convidada" : error.message;
    redirect(`${caminhoRetorno}?erro=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath(caminhoRetorno);
}

export async function removerCompartilhamento(compartilhamentoId: string, caminhoRetorno: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("compartilhamentos").delete().eq("id", compartilhamentoId);
  revalidatePath(caminhoRetorno);
}
