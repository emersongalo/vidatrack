import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { diaBateComFrequencia } from "@/lib/agenda/dias";
import { enviarPush } from "@/lib/push/servidor";
import { enviarMensagemTelegram, buscarAtualizacoesTelegram } from "@/lib/telegram/servidor";
import { interpretarMensagem } from "@/lib/telegram/parserLancamento";
import { buscarHabitosDoDiaAdmin } from "@/lib/agenda/consultaAdmin";
import { segredosIguais } from "@/lib/seguranca";
import { horaAtualNoFuso, dataAtualNoFuso, horaMinutosAtrasNoFuso } from "@/lib/tempo/fuso";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { enviarNotificacaoFCM } from "@/lib/fcm/servidor";

/**
 * Chamada por um agendador externo (cron-job.org, GitHub Actions, etc.)
 * a cada poucos minutos. Faz, nessa ordem:
 * 1. Sincroniza mensagens novas do Telegram — pode ser um código de
 *    vinculação, o comando "Resumo", ou uma tentativa de lançamento
 *    financeiro por mensagem (ex: "Comprei pão por 15,00"), que é
 *    interpretado por palavras-chave — sem IA, sem custo por mensagem
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

  const supabase = criarClienteAdmin(
    "cron_lembretes",
    "Verificação periódica de lembretes/resumo diário, e processamento de mensagens do bot do Telegram (vínculo de conta, resumo financeiro sob pedido, e lançamentos financeiros enviados por mensagem)"
  );
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

    // Notificação nativa (app publicado/instalado via .apk) — separada
    // do Web Push acima, porque o app dentro do Capacitor não recebe
    // Web Push de forma confiável (é a limitação documentada desde a
    // Etapa 17). Isso é o canal que resolve isso de vez.
    const { data: tokensFcm } = await supabase
      .from("fcm_tokens")
      .select("id, token")
      .eq("usuario_id", usuarioId);

    for (const registroFcm of tokensFcm ?? []) {
      const resultado = await enviarNotificacaoFCM(registroFcm.token, "VidaTrack", texto, url);
      if (resultado.sucesso) {
        enviados++;
      } else if (resultado.tokenInvalido) {
        // App foi desinstalado ou o token expirou — limpa, pra não
        // ficar tentando pra sempre num token morto.
        await supabase.from("fcm_tokens").delete().eq("id", registroFcm.id);
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

    const textoOriginal = att.message?.text?.trim();
    const chatId = att.message?.chat?.id;
    if (!textoOriginal || !chatId) continue;

    const textoComoCodigo = textoOriginal.toUpperCase();

    // --- Tentativa 1: é um código de vinculação? ---
    const { data: codigo } = await supabase
      .from("telegram_codigos_vinculo")
      .select("usuario_id, expira_em")
      .eq("codigo", textoComoCodigo)
      .maybeSingle();

    if (codigo) {
      if (new Date(codigo.expira_em) < new Date()) {
        await enviarMensagemTelegram(String(chatId), "Esse código expirou. Gere um novo no app.").catch(() => {});
        await supabase.from("telegram_codigos_vinculo").delete().eq("codigo", textoComoCodigo);
        continue;
      }

      await supabase.from("telegram_vinculos").upsert({
        usuario_id: codigo.usuario_id,
        chat_id: String(chatId),
      });
      await supabase.from("telegram_codigos_vinculo").delete().eq("codigo", textoComoCodigo);

      await enviarMensagemTelegram(
        String(chatId),
        "✅ Conta vinculada! A partir de agora você recebe seus lembretes e o resumo diário por aqui.\n\n" +
          "💡 Dica: manda uma mensagem tipo \"Comprei pão por 15,00\" que eu já registro o gasto pra você. Manda \"Resumo\" pra ver como estão suas finanças este mês."
      ).catch(() => {});

      vinculosCriados++;
      continue;
    }

    // --- Tentativa 2: chat já vinculado a alguém? ---
    const { data: vinculo } = await supabase
      .from("telegram_vinculos")
      .select("usuario_id")
      .eq("chat_id", String(chatId))
      .maybeSingle();

    if (!vinculo) {
      await enviarMensagemTelegram(
        String(chatId),
        "Não reconheci esse código. Gere um novo no app, em Notificações > Conectar ao Telegram."
      ).catch(() => {});
      continue;
    }

    // --- Tentativa 3: comando "Resumo" ---
    if (textoOriginal.trim().toLowerCase() === "resumo") {
      const texto = await montarResumoMensal(supabase, vinculo.usuario_id);
      await enviarMensagemTelegram(String(chatId), texto).catch(() => {});
      continue;
    }

    // --- Tentativa 4: registrar um lançamento financeiro pela mensagem ---
    await processarMensagemFinanceira(supabase, vinculo.usuario_id, String(chatId), textoOriginal);
  }

  if (maiorUpdateId > ultimoUpdateId) {
    await supabase.from("telegram_estado").update({ ultimo_update_id: maiorUpdateId }).eq("id", 1);
  }

  return vinculosCriados;
}

/**
 * Tenta interpretar a mensagem como um lançamento financeiro (sem IA
 * — por palavras-chave). Se conseguir achar um valor, cria o
 * lançamento e confirma; se não, manda uma dica de como escrever.
 */
async function processarMensagemFinanceira(
  supabase: ReturnType<typeof criarClienteAdmin>,
  usuarioId: string,
  chatId: string,
  textoOriginal: string
) {
  const [{ data: contas }, { data: categorias }] = await Promise.all([
    supabase.from("financa_contas").select("id, nome").eq("dono_id", usuarioId).eq("arquivado", false),
    supabase.from("financa_categorias").select("id, nome, tipo").eq("dono_id", usuarioId),
  ]);

  if (!contas || contas.length === 0) {
    await enviarMensagemTelegram(
      chatId,
      "Você ainda não tem nenhuma conta cadastrada no VidaTrack — cria uma em Finanças > Contas antes de lançar por aqui."
    ).catch(() => {});
    return;
  }

  const interpretado = interpretarMensagem(textoOriginal, contas, categorias ?? []);

  if (!interpretado) {
    await enviarMensagemTelegram(
      chatId,
      'Não entendi isso como um lançamento. Tenta algo tipo "Comprei pão por 15,00" ou "Recebi salário 3800,00". Manda "Resumo" pra ver suas finanças do mês.'
    ).catch(() => {});
    return;
  }

  const { error } = await supabase.from("financa_transacoes").insert({
    dono_id: usuarioId,
    conta_id: interpretado.contaId,
    categoria_id: interpretado.categoriaId,
    tipo: interpretado.tipo,
    valor: interpretado.valor,
    descricao: interpretado.descricao,
    data: dataAtualNoFuso(),
  });

  if (error) {
    await enviarMensagemTelegram(chatId, "Não consegui salvar esse lançamento agora. Tenta de novo em instantes.").catch(() => {});
    return;
  }

  const linhas = [
    "✅ Registrado com sucesso:",
    `${interpretado.tipo === "receita" ? "📈 Tipo" : "📉 Tipo"}: ${interpretado.tipo === "receita" ? "Receita" : "Despesa"}`,
    `📝 Descrição: ${interpretado.descricao}`,
    `💰 Valor: ${formatarMoeda(interpretado.valor)}`,
    `🏷️ Categoria: ${interpretado.categoriaNome ?? "Sem categoria"}`,
    `🏦 Conta: ${interpretado.contaNome ?? "—"}`,
  ];
  await enviarMensagemTelegram(chatId, linhas.join("\n")).catch(() => {});
}

async function montarResumoMensal(
  supabase: ReturnType<typeof criarClienteAdmin>,
  usuarioId: string
): Promise<string> {
  const { data: contas } = await supabase
    .from("financa_contas")
    .select("id, saldo_inicial")
    .eq("dono_id", usuarioId)
    .eq("arquivado", false);

  const idsContas = (contas ?? []).map((c) => c.id);
  if (idsContas.length === 0) {
    return "Você ainda não tem nenhuma conta cadastrada no VidaTrack.";
  }

  const inicioMes = new Date();
  const primeiroDiaMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth(), 1).toLocaleDateString("sv-SE");

  const [{ data: transacoesMes }, { data: todasTransacoes }] = await Promise.all([
    supabase.from("financa_transacoes").select("tipo, valor").in("conta_id", idsContas).gte("data", primeiroDiaMes),
    supabase.from("financa_transacoes").select("tipo, valor").in("conta_id", idsContas),
  ]);

  const ganhos = (transacoesMes ?? []).filter((t) => t.tipo === "receita").reduce((a, t) => a + Number(t.valor), 0);
  const gastos = (transacoesMes ?? []).filter((t) => t.tipo === "despesa").reduce((a, t) => a + Number(t.valor), 0);

  const saldoTotal = (contas ?? []).reduce((total, c) => total + Number(c.saldo_inicial), 0)
    + (todasTransacoes ?? []).reduce((a, t) => a + (t.tipo === "receita" ? Number(t.valor) : -Number(t.valor)), 0);

  const nomeMes = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return [
    "💰 Resumo financeiro!",
    `🗓️ Período: ${nomeMes}`,
    `📈 Ganhos: ${formatarMoeda(ganhos)}`,
    `📉 Gastos: ${formatarMoeda(gastos)}`,
    `💵 Saldo atual: ${formatarMoeda(saldoTotal)}`,
  ].join("\n");
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
