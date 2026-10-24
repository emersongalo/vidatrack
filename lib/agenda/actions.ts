"use server";

// Etapa 341 — avisos da Agenda: convite pra um compromisso e resposta
// (vou / talvez / não vou). O evento em si é salvo direto pelo app (as
// regras do banco garantem quem pode o quê); aqui só sai a notificação.
import { createClient } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { avisarUsuario } from "@/lib/push/avisarUsuario";
import { hhmm, rotuloDia } from "@/lib/agenda/eventos";
import { dataAtualNoFuso } from "@/lib/tempo/fuso";

async function meuNome(supabase: ReturnType<typeof createClient>, user: { id: string; email?: string | null }) {
  const { data } = await supabase.from("perfis").select("nome").eq("id", user.id).maybeSingle();
  const nome = String(data?.nome ?? "").trim();
  return nome ? nome.split(" ")[0] : String(user.email ?? "Alguém").split("@")[0];
}

function quando(e: { data: string; hora_inicio?: string | null }) {
  const h = hhmm(e.hora_inicio);
  return `${rotuloDia(e.data, dataAtualNoFuso())}${h ? ` às ${h}` : ""}`;
}

/** O dono convidou pessoas (ou mudou o evento) — avisa quem foi chamado. */
export async function avisarConvidadosEvento(eventoId: string, usuarioIds: string[], mudou = false): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !usuarioIds.length) return { ok: false };
  const { data: e } = await supabase.from("eventos").select("id, titulo, data, hora_inicio, dono_id").eq("id", eventoId).eq("dono_id", user.id).maybeSingle();
  if (!e) return { ok: false };
  // só quem está mesmo na lista do evento
  const { data: lista } = await supabase.from("evento_participantes").select("usuario_id").eq("evento_id", eventoId);
  const validos = new Set((lista ?? []).map((p) => p.usuario_id as string));
  try {
    const admin = criarClienteAdmin("agenda_convite", "Aviso de convite/mudança de compromisso na Agenda");
    const nome = await meuNome(supabase, user);
    for (const id of usuarioIds.filter((x) => validos.has(x) && x !== user.id)) {
      await avisarUsuario(
        admin,
        id,
        mudou ? "📅 Compromisso alterado" : "📅 Convite pra agenda",
        mudou ? `${nome} mudou "${e.titulo}" — agora ${quando(e)}.` : `${nome} te chamou pra "${e.titulo}" — ${quando(e)}. Toque pra responder.`,
        `/tarefas/agenda?evento=${e.id}`
      );
    }
  } catch {
    /* o aviso é um extra */
  }
  return { ok: true };
}

/** Quem foi convidado respondeu — avisa o dono do evento. */
export async function avisarRespostaEvento(eventoId: string, resposta: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { data: e } = await supabase.from("eventos").select("id, titulo, data, hora_inicio, dono_id").eq("id", eventoId).maybeSingle();
  if (!e || e.dono_id === user.id) return { ok: false };
  const texto = resposta === "vou" ? "vai" : resposta === "talvez" ? "talvez vá" : resposta === "nao_vou" ? "não vai" : null;
  if (!texto) return { ok: false };
  try {
    const admin = criarClienteAdmin("agenda_resposta", "Aviso de resposta a convite da Agenda");
    const emoji = resposta === "vou" ? "✅" : resposta === "talvez" ? "🤔" : "❌";
    await avisarUsuario(admin, e.dono_id as string, `${emoji} Resposta na agenda`, `${await meuNome(supabase, user)} ${texto} em "${e.titulo}" (${quando(e)}).`, `/tarefas/agenda?evento=${e.id}`);
  } catch {
    /* extra */
  }
  return { ok: true };
}

const CAMPOS_EVENTO = ["titulo", "descricao", "local", "cor", "tipo", "data", "hora_inicio", "hora_fim", "repetir", "repetir_ate", "lembretes", "excecoes"];

type Resultado = { sucesso: boolean; erro?: string; definitivo?: boolean };
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function filtrarCampos(dados: Record<string, unknown>) {
  const campos: Record<string, unknown> = {};
  for (const k of CAMPOS_EVENTO) if (k in (dados ?? {})) campos[k] = (dados as any)[k];
  return campos;
}

/** entra quem é novo, sai quem foi tirado; avisa os novos (e os que ficaram, se mudou o horário) */
async function acertarConvidados(
  supabase: ReturnType<typeof createClient>,
  eventoId: string,
  donoId: string,
  convidados: string[],
  mudouQuando = false
) {
  const lista = (Array.isArray(convidados) ? convidados : []).filter((c) => typeof c === "string" && c !== donoId);
  const { data: atuaisRaw } = await supabase.from("evento_participantes").select("usuario_id").eq("evento_id", eventoId);
  const atuais = (atuaisRaw ?? []).map((p) => p.usuario_id as string);
  const novos = lista.filter((c) => !atuais.includes(c));
  const saiu = atuais.filter((c) => !lista.includes(c));
  if (novos.length) await supabase.from("evento_participantes").insert(novos.map((u) => ({ evento_id: eventoId, usuario_id: u })));
  if (saiu.length) await supabase.from("evento_participantes").delete().eq("evento_id", eventoId).in("usuario_id", saiu);
  if (novos.length) await avisarConvidadosEvento(eventoId, novos);
  const ficaram = lista.filter((c) => atuais.includes(c));
  if (mudouQuando && ficaram.length) await avisarConvidadosEvento(eventoId, ficaram, true);
}

/**
 * Etapa 343/347 — compromisso criado no aparelho chega aqui (na hora, ou
 * quando a internet volta). O id vem do celular, então mandar duas vezes
 * não duplica: se já existe, só atualiza.
 */
export async function criarEventoSilencioso(dados: Record<string, unknown>, convidados: string[], id?: string): Promise<Resultado> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Sessão expirada" };
  const campos = filtrarCampos(dados);
  const idValido = id && RE_UUID.test(id) ? id : undefined;
  const { data: e, error } = await supabase
    .from("eventos")
    .insert(idValido ? { ...campos, id: idValido } : campos)
    .select("id")
    .single();
  let eventoId = e?.id as string | undefined;
  if (error) {
    if (error.code === "23505" && idValido) {
      // já tinha chegado antes (reenvio): garante os dados mais novos
      const { data: up } = await supabase
        .from("eventos")
        .update({ ...campos, atualizado_em: new Date().toISOString() })
        .eq("id", idValido)
        .eq("dono_id", user.id)
        .select("id");
      if (!up?.length) return { sucesso: false, erro: "Esse compromisso não é seu.", definitivo: true };
      eventoId = idValido;
    } else if (error.code === "42501" || /row-level security/i.test(error.message)) {
      return { sucesso: false, erro: "Sem permissão pra criar esse compromisso.", definitivo: true };
    } else if (error.code === "22P02" || error.code === "23514" || error.code === "23502") {
      return { sucesso: false, erro: `Compromisso inválido: ${error.message}`, definitivo: true };
    } else {
      return { sucesso: false, erro: error.message };
    }
  }
  if (eventoId) await acertarConvidados(supabase, eventoId, user.id, convidados);
  return { sucesso: true };
}

/** Etapa 347 — edição feita no aparelho (só o dono altera o compromisso). */
export async function atualizarEventoSilencioso(id: string, dados: Record<string, unknown>, convidados: string[]): Promise<Resultado> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Sessão expirada" };
  if (!RE_UUID.test(String(id))) return { sucesso: false, erro: "Compromisso inválido", definitivo: true };
  const { data: antes } = await supabase.from("eventos").select("id, data, hora_inicio, dono_id").eq("id", id).maybeSingle();
  if (!antes) return { sucesso: true }; // já foi apagado: nada a fazer
  if (antes.dono_id !== user.id) return { sucesso: false, erro: "Só quem criou o compromisso pode alterá-lo.", definitivo: true };
  const campos = filtrarCampos(dados);
  const { data: up, error } = await supabase
    .from("eventos")
    .update({ ...campos, atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) return { sucesso: false, erro: error.message, definitivo: /row-level|violates|invalid/i.test(error.message) };
  if (!up?.length) return { sucesso: false, erro: "Não deu pra alterar esse compromisso.", definitivo: true };
  const mudouQuando =
    ("data" in campos && campos.data !== antes.data) ||
    ("hora_inicio" in campos && String(campos.hora_inicio ?? "").slice(0, 5) !== String(antes.hora_inicio ?? "").slice(0, 5));
  await acertarConvidados(supabase, id, user.id, convidados, mudouQuando);
  return { sucesso: true };
}

/** Etapa 347 — apagar (o compromisso todo, ou só um dia de um que se repete). */
export async function apagarEventoSilencioso(id: string, soODia: string | null): Promise<Resultado> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sucesso: false, erro: "Sessão expirada" };
  if (!RE_UUID.test(String(id))) return { sucesso: false, erro: "Compromisso inválido", definitivo: true };
  const { data: e } = await supabase.from("eventos").select("id, dono_id, excecoes").eq("id", id).maybeSingle();
  if (!e) return { sucesso: true }; // já não existe
  if (e.dono_id !== user.id) return { sucesso: false, erro: "Só quem criou o compromisso pode apagá-lo.", definitivo: true };
  if (soODia) {
    const lista = Array.isArray(e.excecoes) ? (e.excecoes as string[]) : [];
    if (lista.includes(soODia)) return { sucesso: true };
    const { error } = await supabase.from("eventos").update({ excecoes: [...lista, soODia] }).eq("id", id);
    return error ? { sucesso: false, erro: error.message } : { sucesso: true };
  }
  const { error } = await supabase.from("eventos").delete().eq("id", id);
  return error ? { sucesso: false, erro: error.message } : { sucesso: true };
}
