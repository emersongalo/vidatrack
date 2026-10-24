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
