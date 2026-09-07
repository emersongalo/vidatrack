import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { diaBateComFrequencia } from "@/lib/agenda/dias";
import { enviarPush } from "@/lib/push/servidor";
import { segredosIguais } from "@/lib/seguranca";
import { horaAtualNoFuso, dataAtualNoFuso, horaMinutosAtrasNoFuso } from "@/lib/tempo/fuso";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { enviarNotificacaoFCM } from "@/lib/fcm/servidor";

// Sem cookie nem sessão, o Next.js não tem como saber sozinho que essa
// rota precisa rodar de novo a cada chamada — sem isso aqui, o Vercel
// pode devolver a mesma resposta guardada em cache pras próximas
// chamadas, mesmo que o horário real já tenha mudado.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Chamada por um agendador externo (cron-job.org, GitHub Actions, etc.)
 * a cada poucos minutos. Envia notificação nativa (celular) e Web Push
 * (navegador) — sem depender de nenhum app terceiro — pra:
 * 1. Hábitos, tarefas e notas cujo horário de lembrete bateu
 * 2. Contas a pagar (recorrências financeiras) que vencem hoje ou
 *    amanhã
 *
 * Usa o cliente administrativo (Service Role) porque roda sem sessão
 * de usuário — precisa ler dados de todo mundo pra saber quem avisar.
 */
export async function GET(request: Request) {
  const segredoEsperado = process.env.CRON_SECRET;
  // Aceita o segredo tanto no cabeçalho Authorization (é assim que o
  // agendador externo de verdade chama) quanto num parâmetro de URL
  // (?secret=...) — isso deixa testar manualmente sem precisar do
  // Console do navegador, só colando um link.
  const segredoDoCabecalho = request.headers.get("authorization")?.replace("Bearer ", "");
  const segredoDaUrl = new URL(request.url).searchParams.get("secret");
  const segredoRecebido = segredoDoCabecalho ?? segredoDaUrl;

  if (!segredoEsperado || !segredoRecebido || !segredosIguais(segredoRecebido, segredoEsperado)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const supabase = criarClienteAdmin(
    "cron_lembretes",
    "Verificação periódica de lembretes de hábitos/tarefas e de contas a pagar (hoje/amanhã)"
  );
  const horaAtual = horaAtualNoFuso();
  const cincoMinAntes = horaMinutosAtrasNoFuso(5);
  const hoje = dataAtualNoFuso();

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

  // --- Contas a pagar (recorrências financeiras) vencendo hoje/amanhã ---
  // Roda só uma vez por dia (perto das 8h da manhã) — não faz sentido
  // mandar lembrete de conta a cada poucos minutos o dia inteiro.
  if (horaAtual >= "08:00" && horaAtual <= "08:05") {
    enviados += await notificarContasAPagar(supabase, hoje);
  }

  // Modo de depuração (?debug=1) — mostra exatamente o que o servidor
  // está calculando, pra comparar com o que você espera. Ajuda a achar
  // qualquer diferença de horário/fuso sem precisar adivinhar.
  if (new URL(request.url).searchParams.get("debug") === "1") {
    return NextResponse.json(
      {
        ok: true,
        enviados,
        depuracao: {
          horaAtualNoServidor: horaAtual,
          janelaDeVerificacao: `${cincoMinAntes} até ${horaAtual}`,
          dataAtualNoServidor: hoje,
          habitosComLembrete: (habitos ?? []).map((h) => ({
            nome: h.nome,
            horario: h.horario_lembrete,
            frequencia: h.frequencia,
          })),
        },
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  return NextResponse.json(
    { ok: true, enviados },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

async function notificarUsuariosDoItem(
  supabase: ReturnType<typeof criarClienteAdmin>,
  tipoItem: string,
  itemId: string,
  donoId: string,
  texto: string,
  url: string,
  hoje: string
): Promise<number> {
  // Dono + convidados com acesso (só se aplica a hábito/tarefa/nota —
  // contas a pagar notificam só o dono, ver notificarContasAPagar)
  const { data: compartilhados } = ["habito", "tarefa"].includes(tipoItem)
    ? await supabase
        .from("compartilhamentos")
        .select("usuario_convidado_id")
        .eq("tipo_item", tipoItem)
        .eq("item_id", itemId)
        .not("usuario_convidado_id", "is", null)
    : { data: [] as { usuario_convidado_id: string }[] };

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
        await supabase.from("log_notificacoes").insert({
          usuario_id: usuarioId,
          canal: "webpush",
          sucesso: true,
        });
      } catch (erro: any) {
        // Guarda o motivo real do erro — antes isso era silenciado
        // por completo, e nunca dava pra saber por que uma
        // notificação não chegava. O pacote web-push costuma incluir
        // o código de status HTTP da tentativa, que ajuda mais que
        // só a mensagem genérica.
        const detalhe = erro?.statusCode
          ? `HTTP ${erro.statusCode}: ${erro?.body ?? erro?.message ?? ""}`
          : erro instanceof Error
            ? erro.message
            : String(erro);
        await supabase.from("log_notificacoes").insert({
          usuario_id: usuarioId,
          canal: "webpush",
          sucesso: false,
          erro: detalhe,
        });
      }
    }

    const { data: tokensFcm } = await supabase
      .from("fcm_tokens")
      .select("id, token")
      .eq("usuario_id", usuarioId);

    for (const registroFcm of tokensFcm ?? []) {
      const resultado = await enviarNotificacaoFCM(registroFcm.token, "VidaTrack", texto, url);
      if (resultado.sucesso) {
        enviados++;
        await supabase.from("log_notificacoes").insert({
          usuario_id: usuarioId,
          canal: "fcm",
          sucesso: true,
        });
      } else {
        await supabase.from("log_notificacoes").insert({
          usuario_id: usuarioId,
          canal: "fcm",
          sucesso: false,
          erro: resultado.erro ?? "Falha desconhecida",
        });
        if (resultado.tokenInvalido) {
          // App foi desinstalado ou o token expirou — limpa, pra não
          // ficar tentando pra sempre num token morto.
          await supabase.from("fcm_tokens").delete().eq("id", registroFcm.id);
        }
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
 * Avisa quem tem uma conta recorrente (financa_recorrencias) vencendo
 * HOJE ou AMANHÃ. Usa a mesma tabela `lembretes_enviados` das outras
 * notificações — como o "hoje" e o "amanhã" são enviados em datas
 * diferentes, os dois avisos da mesma conta não colidem entre si.
 */
async function notificarContasAPagar(
  supabase: ReturnType<typeof criarClienteAdmin>,
  hoje: string
): Promise<number> {
  const dataHoje = new Date(hoje + "T00:00:00");
  const diaHoje = dataHoje.getDate();
  const dataAmanha = new Date(dataHoje);
  dataAmanha.setDate(dataAmanha.getDate() + 1);
  const diaAmanha = dataAmanha.getDate();
  const amanhaISO = dataAmanha.toLocaleDateString("sv-SE");

  const { data: recorrencias } = await supabase
    .from("financa_recorrencias")
    .select("id, descricao, valor, dia_mes, data_fim, dono_id, financa_contas(nome)")
    .eq("ativo", true)
    .eq("tipo", "despesa")
    .in("dia_mes", Array.from(new Set([diaHoje, diaAmanha])));

  let enviados = 0;

  for (const r of recorrencias ?? []) {
    const venceHoje = r.dia_mes === diaHoje;
    const venceAmanha = r.dia_mes === diaAmanha;
    if (!venceHoje && !venceAmanha) continue;

    const dataDoVencimento = venceHoje ? hoje : amanhaISO;
    if (r.data_fim && dataDoVencimento > r.data_fim) continue; // já expirou

    const descricao = r.descricao || (r as any).financa_contas?.nome || "Conta";
    const texto = venceHoje
      ? `💳 Você tem uma conta vencendo HOJE: ${descricao} — ${formatarMoeda(r.valor)}`
      : `💳 Você tem uma conta vencendo AMANHÃ: ${descricao} — ${formatarMoeda(r.valor)}`;

    enviados += await notificarUsuariosDoItem(
      supabase,
      "conta_a_pagar",
      r.id,
      r.dono_id,
      texto,
      "/financas",
      hoje
    );
  }

  return enviados;
}
