"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export type TipoItem = "habito" | "financa" | "tarefa";

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

/**
 * Etapa 234 — compartilhar com alguém que já está "ligado" a você (você
 * já compartilhou algo com ela, ou ela com você), sem digitar o e-mail.
 * Só funciona se essa ligação existir — não dá pra usar pra descobrir o
 * e-mail de uma pessoa qualquer.
 */
export async function convidarPessoaConhecida(
  tipoItem: TipoItem,
  itemId: string,
  caminhoRetorno: string,
  pessoa: { usuarioId?: string | null; email?: string | null },
  permissao: string
): Promise<{ ok: boolean; erro?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Entre de novo na sua conta" };

  let email = String(pessoa.email ?? "").trim().toLowerCase();
  let idConvidado: string | null = pessoa.usuarioId ?? null;

  if (idConvidado && !/^[0-9a-f-]{36}$/i.test(idConvidado)) return { ok: false, erro: "Pessoa inválida" };
  if (idConvidado) {
    // a ligação precisa existir (em qualquer direção)
    const { data: ligacao } = await supabase
      .from("compartilhamentos")
      .select("id")
      .or(
        `and(dono_id.eq.${user.id},usuario_convidado_id.eq.${idConvidado}),and(dono_id.eq.${idConvidado},usuario_convidado_id.eq.${user.id})`
      )
      .limit(1);
    if (!ligacao?.length) return { ok: false, erro: "Essa pessoa não está na sua lista" };
    if (!email) {
      const admin = criarClienteAdmin("email_pessoa_conhecida", `Compartilhar ${tipoItem} com alguém já ligado`);
      const { data } = await admin.auth.admin.getUserById(idConvidado);
      email = (data?.user?.email ?? "").toLowerCase();
    }
  } else if (email) {
    // convite antigo feito por mim com esse e-mail
    const { data: ligacao } = await supabase
      .from("compartilhamentos")
      .select("usuario_convidado_id")
      .eq("dono_id", user.id)
      .eq("email_convidado", email)
      .limit(1);
    if (!ligacao?.length) return { ok: false, erro: "Essa pessoa não está na sua lista" };
    idConvidado = (ligacao[0].usuario_convidado_id as string | null) ?? null;
  }
  if (!email) return { ok: false, erro: "Não achei o e-mail dessa pessoa" };
  if (idConvidado === user.id || email === user.email?.toLowerCase()) return { ok: false, erro: "Você não pode se convidar" };

  const { error } = await supabase.from("compartilhamentos").insert({
    tipo_item: tipoItem,
    item_id: itemId,
    dono_id: user.id,
    usuario_convidado_id: idConvidado,
    email_convidado: email,
    permissao: permissao === "edicao" ? "edicao" : "leitura",
  });
  if (error) return { ok: false, erro: error.code === "23505" ? "Essa pessoa já foi convidada" : error.message };

  revalidatePath(caminhoRetorno);
  return { ok: true };
}
