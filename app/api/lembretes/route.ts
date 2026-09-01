import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { diaBateComFrequencia } from "@/lib/agenda/dias";
import { enviarPush } from "@/lib/push/servidor";
import { enviarMensagemTelegram, buscarAtualizacoesTelegram } from "@/lib/telegram/servidor";
import { buscarHabitosDoDiaAdmin } from "@/lib/agenda/consultaAdmin";
import { segredosIguais } from "@/lib/seguranca";
import { horaAtualNoFuso, dataAtualNoFuso, horaMinutosAtrasNoFuso } from "@/lib/tempo/fuso";

/**
 * Chamada por um agendador externo (cron-job.org, GitHub Actions, etc.)
 * a cada poucos minutos. Faz 4 coisas, nessa ordem:
 * 1. Sincroniza códigos de vinculação do Telegram (pessoas que
 *    acabaram de enviar o código pro bot)
 * 2. Envia lembretes de hábitos/tarefas/notas cujo horário bateu
 * 3. Envia o resumo diário de hábitos pra quem tem Telegram vinculado
 *    e o horário escolhido bateu
 *
 * Usa o cliente administrativo (Service Role) porque roda sem sessão
 * de usuário — precisa ler dados de todo mundo pra saber quem avisar.
 */
export async function GET(request: Request) {
  const segredoEsperado = process.env.CRON_SECRET;
  const segredoRecebido = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!segredoEsperado || !segredoRecebido || !segredosIguais(segredoRecebido, segredoEsperado)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const supabase = criarClienteAdmin("cron_lembretes", "Verificação periódica de lembretes/resumo diário");
  const horaAtual = horaAtualNoFuso();
  const cincoMinAntes = horaMinutosAtrasNoFuso(5);
  const hoje = dataAtualNoFuso();

  const vinculosTelegramCriados = await sincronizarTelegram(supabase);

  let enviados = 0;

  // --- Hábitos com lembrete ---
  const { data: habitos } = await supabase
    .from("habitos")
    .select("id, nome, dono_id, frequencia, dias_semana, horario_lembrete")
    .eq("arquivado", false)
    .not("horario_lembrete", "is", null);

  for (const h of habitos ?? []) {
    const horario = (h.horario_lembrete as string).slice(0, 5);
    if (!(horario >= cincoMinAntes && horario <= horaAtual)) continue;
    if (!diaBateComFrequencia(h.frequencia, h.dias_semana ?? [], hoje)) continue;

    enviados += await notificarUsuariosDoItem(
      supabase,
      "habito",
      h.id,
      h.dono_id,
      `🔁 ${h.nome}`,
      "/habitos",
      hoje
    );
  }

  // --- Tarefas com lembrete ---
  const { data: tarefas } = await supabase
    .from("tarefas")
    .select("id, titulo, dono_id, repetir, dias_semana, data, horario_lembrete")
    .eq("arquivada", false)
    .not("horario_lembrete", "is", null);

  for (const t of tarefas ?? []) {
    const horario = (t.horario_lembrete as string).slice(0, 5);
    if (!(horario >= cincoMinAntes && horario <= horaAtual)) continue;

    const apareceHoje =
      t.repetir === "nenhuma" ? t.data === hoje : diaBateComFrequencia(t.repetir, t.dias_semana ?? [], hoje);
    if (!apareceHoje) continue;

    enviados += await notificarUsuariosDoItem(
      supabase,
      "tarefa",
      t.id,
      t.dono_id,
      `✓ ${t.titulo}`,
      `/habitos/tarefas/${t.id}`,
      hoje
    );
  }

  // --- Notas com lembrete ---
  const { data: notas } = await supabase
    .from("notas")
    .select("id, titulo, dono_id, horario_lembrete")
    .eq("arquivado", false)
    .not("horario_lembrete", "is", null);

  for (const n of notas ?? []) {
    const horario = (n.horario_lembrete as string).slice(0, 5);
    if (!(horario >= cincoMinAntes && horario <= horaAtual)) continue;

    enviados += await notificarUsuariosDoItem(
      supabase,
      "nota",
      n.id,
      n.dono_id,
      `📝 ${n.titulo}`,
      `/notas/${n.id}`,
      hoje
    );
  }

  // --- Resumo diário via Telegram ---
  const resumosEnviados = await enviarResumosDiarios(supabase, horaAtual, cincoMinAntes, hoje);

  return NextResponse.json({ ok: true, enviados, resumosEnviados, vinculosTelegramCriados });
}

async function notificarUsuariosDoItem(
  supabase: ReturnType<typeof criarClienteAdmin>,
  tipoItem: "habito" | "tarefa" | "nota",
  itemId: string,
  donoId: string,
  texto: string,
  url: string,
  hoje: string
): Promise<number> {
  // Dono + convidados com acesso
  const { data: compartilhados } = await supabase
    .from("compartilhamentos")
    .select("usuario_convidado_id")
    .eq("tipo_item", tipoItem)
    .eq("item_id", itemId)
    .not("usuario_convidado_id", "is", null);

  const idsUsuarios = [donoId, ...(compartilhados ?? []).map((c) => c.usuario_convidado_id as string)];

  let enviados = 0;

  for (const usuarioId of idsUsuarios) {
    const { data: jaEnviado } = await supabase
      .from("lembretes_enviados")
      .select("id")
      .eq("tipo_item", tipoItem)
      .eq("item_id", itemId)
      .eq("usuario_id", usuarioId)
      .eq("data", hoje)
      .maybeSingle();
    if (jaEnviado) continue;

    const { data: inscricoes } = await supabase
      .from("push_inscricoes")
      .select("endpoint, chaves")
      .eq("usuario_id", usuarioId);

    for (const inscricao of inscricoes ?? []) {
      try {
        await enviarPush(
          { endpoint: inscricao.endpoint, chaves: inscricao.chaves as any },
          { titulo: "VidaTrack", corpo: texto, url }
        );
        enviados++;
      } catch {
        // Inscrição expirada ou inválida — poderia limpar aqui, mantido
        // simples por enquanto.
      }
    }

    const { data: telegram } = await supabase
      .from("telegram_vinculos")
      .select("chat_id")
      .eq("usuario_id", usuarioId)
      .maybeSingle();

    if (telegram) {
      try {
        await enviarMensagemTelegram(telegram.chat_id, `🔔 <b>Lembrete VidaTrack</b>\n${texto}`);
        enviados++;
      } catch {
        // Chat pode ter bloqueado o bot — ignora silenciosamente.
      }
    }

    await supabase.from("lembretes_enviados").insert({
      tipo_item: tipoItem,
      item_id: itemId,
      usuario_id: usuarioId,
      data: hoje,
    });
  }

  return enviados;
}

/**
 * Processa mensagens novas recebidas pelo bot do Telegram. Se o texto
 * bater com um código de vinculação válido, conecta aquele chat à
 * conta do usuário dono do código.
 */
async function sincronizarTelegram(supabase: ReturnType<typeof criarClienteAdmin>): Promise<number> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return 0;

  const { data: estado } = await supabase
    .from("telegram_estado")
    .select("ultimo_update_id")
    .eq("id", 1)
    .single();

  const ultimoUpdateId = estado?.ultimo_update_id ?? 0;
  const atualizacoes = await buscarAtualizacoesTelegram(ultimoUpdateId + 1);

  let vinculosCriados = 0;
  let maiorUpdateId = ultimoUpdateId;

  for (const att of atualizacoes) {
    maiorUpdateId = Math.max(maiorUpdateId, att.update_id);

    const texto = att.message?.text?.trim().toUpperCase();
    const chatId = att.message?.chat?.id;
    if (!texto || !chatId) continue;

    const { data: codigo } = await supabase
      .from("telegram_codigos_vinculo")
      .select("usuario_id, expira_em")
      .eq("codigo", texto)
      .maybeSingle();

    if (!codigo) {
      await enviarMensagemTelegram(
        String(chatId),
        "Não reconheci esse código. Gere um novo no app, em Notificações > Conectar ao Telegram."
      ).catch(() => {});
      continue;
    }

    if (new Date(codigo.expira_em) < new Date()) {
      await enviarMensagemTelegram(String(chatId), "Esse código expirou. Gere um novo no app.").catch(
        () => {}
      );
      await supabase.from("telegram_codigos_vinculo").delete().eq("codigo", texto);
      continue;
    }

    await supabase.from("telegram_vinculos").upsert({
      usuario_id: codigo.usuario_id,
      chat_id: String(chatId),
    });
    await supabase.from("telegram_codigos_vinculo").delete().eq("codigo", texto);

    await enviarMensagemTelegram(
      String(chatId),
      "✅ Conta vinculada! A partir de agora você recebe seus lembretes e o resumo diário por aqui."
    ).catch(() => {});

    vinculosCriados++;
  }

  if (maiorUpdateId > ultimoUpdateId) {
    await supabase.from("telegram_estado").update({ ultimo_update_id: maiorUpdateId }).eq("id", 1);
  }

  return vinculosCriados;
}

async function enviarResumosDiarios(
  supabase: ReturnType<typeof criarClienteAdmin>,
  horaAtual: string,
  cincoMinAntes: string,
  hoje: string
): Promise<number> {
  const { data: vinculos } = await supabase
    .from("telegram_vinculos")
    .select("usuario_id, chat_id, horario_resumo_diario");

  let enviados = 0;

  for (const v of vinculos ?? []) {
    const horario = (v.horario_resumo_diario as string).slice(0, 5);
    if (!(horario >= cincoMinAntes && horario <= horaAtual)) continue;

    const { data: jaEnviado } = await supabase
      .from("resumos_enviados")
      .select("id")
      .eq("usuario_id", v.usuario_id)
      .eq("data", hoje)
      .maybeSingle();
    if (jaEnviado) continue;

    const habitosDoDia = await buscarHabitosDoDiaAdmin(v.usuario_id, hoje);

    const dataFormatada = new Date(hoje + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

    let texto = `📋 <b>Seus hábitos de hoje (${dataFormatada})</b>\n\n`;
    texto +=
      habitosDoDia.length === 0
        ? "Nenhum hábito programado pra hoje."
        : habitosDoDia.map((h) => `${h.feito ? "✅" : "⬜"} ${h.icone} ${h.nome}`).join("\n");

    await enviarMensagemTelegram(v.chat_id, texto).catch(() => {});
    await supabase.from("resumos_enviados").insert({ usuario_id: v.usuario_id, data: hoje });
    enviados++;
  }

  return enviados;
}
