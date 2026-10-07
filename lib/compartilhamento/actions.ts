"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { avisarUsuario } from "@/lib/push/avisarUsuario";

export type TipoItem = "habito" | "financa" | "tarefa";

/**
 * Etapa 273 — compartilhar agora é um CONVITE: a pessoa recebe uma
 * notificação e aceita ou recusa. O acesso (linha em
 * `compartilhamentos`) só nasce quando ela aceita — quem faz isso é a
 * função `responder_convite` no banco. Compartilhamentos antigos
 * continuam valendo normalmente.
 */
const ROTULO_TIPO: Record<string, string> = {
  habito: "o hábito",
  tarefa: "a tarefa",
  financa: "a conta",
  nota: "a nota",
};

type Supa = ReturnType<typeof createClient>;

async function nomeDoItem(supabase: Supa, tipo: TipoItem, itemId: string): Promise<string | null> {
  try {
    if (tipo === "habito") {
      const { data } = await supabase.from("habitos").select("nome").eq("id", itemId).maybeSingle();
      return (data?.nome as string) ?? null;
    }
    if (tipo === "tarefa") {
      const { data } = await supabase.from("tarefas").select("titulo").eq("id", itemId).maybeSingle();
      return (data?.titulo as string) ?? null;
    }
    const { data } = await supabase.from("financa_contas").select("nome").eq("id", itemId).maybeSingle();
    return (data?.nome as string) ?? null;
  } catch {
    return null;
  }
}

async function meuNome(supabase: Supa, user: { id: string; email?: string | null }): Promise<string> {
  const { data } = await supabase.from("perfis").select("nome").eq("id", user.id).maybeSingle();
  const nome = String(data?.nome ?? "").trim();
  return nome ? nome.split(" ")[0] : String(user.email ?? "Alguém").split("@")[0];
}

async function avisarConvidado(idConvidado: string | null, nomeDono: string, tipo: TipoItem, nomeItem: string | null) {
  if (!idConvidado) return;
  try {
    const admin = criarClienteAdmin("aviso_convite", `Aviso de convite de compartilhamento (${tipo})`);
    await avisarUsuario(
      admin,
      idConvidado,
      "📩 Convite pra compartilhar",
      `${nomeDono} quer compartilhar ${ROTULO_TIPO[tipo]}${nomeItem ? ` "${nomeItem}"` : ""} com você. Toque pra aceitar ou recusar.`,
      "/convites"
    );
  } catch {
    /* o convite já ficou salvo; o aviso é um extra */
  }
}

/** Cria (ou reabre, se a pessoa tinha recusado) o convite e avisa a pessoa. */
async function criarConvite(
  supabase: Supa,
  user: { id: string; email?: string | null },
  dados: { tipo: TipoItem; itemId: string; email: string; idConvidado: string | null; permissao: string }
): Promise<{ ok: boolean; erro?: string }> {
  const permissao = dados.permissao === "edicao" ? "edicao" : "leitura";

  const { data: jaTem } = await supabase
    .from("compartilhamentos")
    .select("id")
    .eq("tipo_item", dados.tipo)
    .eq("item_id", dados.itemId)
    .eq("email_convidado", dados.email)
    .limit(1);
  if (jaTem?.length) return { ok: false, erro: "Essa pessoa já tem acesso" };

  const nomeItem = await nomeDoItem(supabase, dados.tipo, dados.itemId);
  const nomeDono = await meuNome(supabase, user);

  const { data: existente } = await supabase
    .from("convites_compartilhamento")
    .select("id, status")
    .eq("tipo_item", dados.tipo)
    .eq("item_id", dados.itemId)
    .eq("email_convidado", dados.email)
    .maybeSingle();

  if (existente?.status === "pendente") return { ok: false, erro: "Convite já enviado — aguardando a resposta" };

  if (existente) {
    const { error } = await supabase
      .from("convites_compartilhamento")
      .update({
        status: "pendente",
        permissao,
        respondido_em: null,
        criado_em: new Date().toISOString(),
        nome_item: nomeItem,
        nome_dono: nomeDono,
        usuario_convidado_id: dados.idConvidado,
      })
      .eq("id", existente.id);
    if (error) return { ok: false, erro: error.message };
  } else {
    const { error } = await supabase.from("convites_compartilhamento").insert({
      tipo_item: dados.tipo,
      item_id: dados.itemId,
      dono_id: user.id,
      usuario_convidado_id: dados.idConvidado,
      email_convidado: dados.email,
      permissao,
      nome_item: nomeItem,
      nome_dono: nomeDono,
    });
    if (error) return { ok: false, erro: error.code === "23505" ? "Convite já enviado" : error.message };
  }

  await avisarConvidado(dados.idConvidado, nomeDono, dados.tipo, nomeItem);
  return { ok: true };
}

/** Etapa 273 — versão que devolve o resultado (usada pelo painel). */
export async function convidarPorEmail(
  tipoItem: TipoItem,
  itemId: string,
  caminhoRetorno: string,
  emailDigitado: string,
  permissao: string
): Promise<{ ok: boolean; erro?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Entre de novo na sua conta" };

  const email = String(emailDigitado ?? "").trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, erro: "Digite um e-mail válido" };
  if (email === user.email?.toLowerCase()) return { ok: false, erro: "Você não pode se convidar" };

  const admin = criarClienteAdmin("verificar_email_convite", `Convite de compartilhamento (${tipoItem})`);
  const { data: idConvidado } = await admin.rpc("buscar_usuario_por_email", { p_email: email });

  const r = await criarConvite(supabase, user, {
    tipo: tipoItem,
    itemId,
    email,
    idConvidado: (idConvidado as string | null) ?? null,
    permissao,
  });
  if (r.ok) revalidatePath(caminhoRetorno);
  return r;
}

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

  const r = await convidarPorEmail(tipoItem, itemId, caminhoRetorno, email, permissao);
  if (!r.ok) redirect(`${caminhoRetorno}?erro=${encodeURIComponent(r.erro ?? "Não deu pra convidar")}`);
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

  const r = await criarConvite(supabase, user, { tipo: tipoItem, itemId, email, idConvidado, permissao });
  if (r.ok) revalidatePath(caminhoRetorno);
  return r;
}

/** Etapa 273 — o dono cancela um convite (pendente ou recusado). */
export async function removerConvite(conviteId: string, caminhoRetorno: string) {
  const supabase = createClient();
  await supabase.from("convites_compartilhamento").delete().eq("id", conviteId);
  revalidatePath(caminhoRetorno);
}

/** Etapa 273 — o dono manda de novo um convite que foi recusado. */
export async function reenviarConvite(conviteId: string): Promise<{ ok: boolean; erro?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Entre de novo na sua conta" };
  const { data: c } = await supabase
    .from("convites_compartilhamento")
    .select("id, tipo_item, nome_item, usuario_convidado_id")
    .eq("id", conviteId)
    .eq("dono_id", user.id)
    .maybeSingle();
  if (!c) return { ok: false, erro: "Convite não encontrado" };
  const { error } = await supabase
    .from("convites_compartilhamento")
    .update({ status: "pendente", respondido_em: null, criado_em: new Date().toISOString() })
    .eq("id", conviteId);
  if (error) return { ok: false, erro: error.message };
  await avisarConvidado(c.usuario_convidado_id as string | null, await meuNome(supabase, user), c.tipo_item as TipoItem, c.nome_item as string | null);
  return { ok: true };
}

/**
 * Etapa 273 — quem foi convidado aceita ou recusa. Avisa o dono do
 * item com uma notificação.
 */
export async function responderConvite(
  conviteId: string,
  aceitar: boolean
): Promise<{ ok: boolean; erro?: string; tipoItem?: string; itemId?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Entre de novo na sua conta" };

  const { data, error } = await supabase.rpc("responder_convite", { p_convite: conviteId, p_aceitar: aceitar });
  if (error) return { ok: false, erro: "Esse convite não está mais disponível" };
  const r = (data ?? {}) as { tipo_item?: string; item_id?: string; dono_id?: string; nome_item?: string | null };

  if (r.dono_id) {
    try {
      const nome = await meuNome(supabase, user);
      const admin = criarClienteAdmin("aviso_convite", "Resposta de convite de compartilhamento");
      const oQue = `${ROTULO_TIPO[r.tipo_item ?? ""] ?? "o item"}${r.nome_item ? ` "${r.nome_item}"` : ""}`;
      await avisarUsuario(
        admin,
        r.dono_id,
        aceitar ? "🤝 Convite aceito!" : "Convite recusado",
        aceitar ? `${nome} aceitou compartilhar ${oQue} com você.` : `${nome} recusou o convite pra ${oQue}.`,
        r.tipo_item === "financa" ? "/financas" : r.tipo_item === "tarefa" ? "/tarefas" : "/habitos"
      );
    } catch {
      /* aviso é extra */
    }
  }
  revalidatePath("/convites");
  return { ok: true, tipoItem: r.tipo_item, itemId: r.item_id };
}
