import { NextResponse } from "next/server";
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { diaBateComFrequencia, inicioDaSemana, feitosNaSemana } from "@/lib/agenda/dias";
import { tarefaApareceNoDia } from "@/lib/agenda/recorrencia";
import { enviarPush } from "@/lib/push/servidor";
import { segredosIguais } from "@/lib/seguranca";
import { horaAtualNoFuso, dataAtualNoFuso, horaMinutosAtrasNoFuso } from "@/lib/tempo/fuso";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { enviarNotificacaoFCM, enviarLembreteHabitoFCM } from "@/lib/fcm/servidor";
import { somarDias } from "@/lib/widgets/dados";
import { calcularPeriodoFatura, periodoFaturaAdjacente } from "@/lib/financas/fatura";
import { resumoFatura } from "@/lib/financas/previsao";
import { horariosDoHabito } from "@/lib/habitos/horariosLembrete";
import { gastoDoMes } from "@/lib/financas/teto";

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
  // Etapa 216 — vários horários por hábito; não avisa quem já completou
  const { data: habitos } = await supabase
    .from("habitos")
    .select("id, nome, dono_id, frequencia, dias_semana, horario_lembrete, horarios_lembrete, meta_diaria, unidade, eh_negativo, pausas")
    .eq("arquivado", false)
    .not("horario_lembrete", "is", null);

  for (const h of habitos ?? []) {
    const horario = horariosDoHabito(h as any).find((x) => x >= cincoMinAntes && x <= horaAtual);
    if (!horario) continue;
    if (!habitoDevidoNoDia(h, hoje)) continue;

    const meta = Number(h.meta_diaria ?? 1) || 1;
    let feitoHoje = 0;
    if (!h.eh_negativo) {
      const { data: checkins } = await supabase
        .from("habito_checkins")
        .select("quantidade")
        .eq("habito_id", h.id)
        .eq("usuario_id", h.dono_id)
        .eq("data", hoje);
      feitoHoje = (checkins ?? []).reduce((s, c) => s + Number(c.quantidade ?? 1), 0);
      if (feitoHoje >= meta) continue; // já completou hoje — não incomoda
    }

    const unidade = ((h.unidade as string | null) ?? "").trim();
    const ehContador = meta > 1 && !h.eh_negativo;
    const titulo = ehContador ? `🔔 ${h.nome}: ${feitoHoje} de ${meta}${unidade ? ` ${unidade}` : ""}` : `🔔 Hora de: ${h.nome}`;
    const corpo = ehContador ? "Toque em ✓ Feito pra somar mais 1." : "Toque em ✓ Feito se já fez.";

    enviados += await notificarUsuariosDoItem(
      supabase,
      "habito",
      h.id,
      h.dono_id,
      titulo,
      "/habitos",
      hoje,
      // Etapa 195 — app novo mostra com botões "✓ Feito" / "Lembrar em 30 min"
      { habitoId: h.id, titulo, corpo, data: hoje },
      horario
    );
  }

  // --- Tarefas com lembrete ---
  const { data: tarefas } = await supabase
    .from("tarefas")
    .select("id, titulo, dono_id, repetir, dias_semana, data, horario_lembrete, dia_mes, mes, intervalo_dias")
    .eq("arquivada", false)
    .not("horario_lembrete", "is", null);

  for (const t of tarefas ?? []) {
    const horario = (t.horario_lembrete as string).slice(0, 5);
    if (!(horario >= cincoMinAntes && horario <= horaAtual)) continue;

    const apareceHoje = tarefaApareceNoDia(t, hoje);
    if (!apareceHoje) continue;

    enviados += await notificarUsuariosDoItem(
      supabase,
      "tarefa",
      t.id,
      t.dono_id,
      `📝 Lembrete: ${t.titulo}`,
      `/habitos/tarefas/${t.id}`,
      hoje
    );
  }

  // --- Contas a pagar (recorrências financeiras) vencendo hoje/amanhã ---
  // Roda só uma vez por dia (perto das 8h da manhã) — não faz sentido
  // mandar lembrete de conta a cada poucos minutos o dia inteiro.
  if (horaAtual >= "08:00" && horaAtual <= "08:05") {
    enviados += await notificarContasAPagar(supabase, hoje);
    // Etapa 252 — despesas agendadas (lançamento único com data) vencendo hoje/amanhã
    enviados += await notificarDespesasAgendadas(supabase, hoje);
  }

  // --- Orçamento estourado (categorias com meta mensal) ---
  // Também só 1x por dia — o gasto do mês não muda tão rápido a
  // ponto de precisar checar a cada poucos minutos.
  if (horaAtual >= "08:05" && horaAtual <= "08:10") {
    enviados += await notificarOrcamentosEstourados(supabase, hoje);
  }

  // --- Etapa 215: fatura do cartão (3 dias antes, véspera e no dia) ---
  if (horaAtual >= "08:10" && horaAtual <= "08:15") {
    enviados += await notificarFaturasCartao(supabase, hoje);
  }

  // --- Etapa 220: teto de gastos do mês (80% e estourou) ---
  if (horaAtual >= "08:15" && horaAtual <= "08:20") {
    enviados += await notificarTetoMensal(supabase, hoje);
  }
  // --- Etapa 220: 21:00 — "gastou algo hoje?" pra quem está há 2+ dias sem lançar ---
  if (horaAtual >= "21:00" && horaAtual <= "21:05") {
    enviados += await notificarLembreteLancar(supabase, hoje);
  }

  // --- Etapa 218: resumo da manhã (07:00) ---
  if (horaAtual >= "07:00" && horaAtual <= "07:05") {
    enviados += await notificarResumoManha(supabase, hoje);
  }

  // --- Etapa 202: avisos que trazem a pessoa de volta ---
  // 20:30 — "faltam X hábitos hoje" (só pra quem ainda tem pendente)
  if (horaAtual >= "20:30" && horaAtual <= "20:35") {
    enviados += await notificarHabitosPendentesDaNoite(supabase, hoje);
  }
  // Etapa 214 — dia 1 às 09:00: resumo do mês que acabou
  if (hoje.endsWith("-01") && horaAtual >= "09:00" && horaAtual <= "09:05") {
    enviados += await notificarResumoMensal(supabase, hoje);
  }
  // Domingo 19:00 — resumo da semana
  if (diaDaSemana(hoje) === 0 && horaAtual >= "19:00" && horaAtual <= "19:05") {
    enviados += await notificarResumoSemanal(supabase, hoje);
  }

  // Etapa 233 — recados da dupla (cutucar/reagir) com mais de 30 dias
  // não servem pra nada: apaga uma vez por dia, de madrugada.
  if (horaAtual >= "03:00" && horaAtual <= "03:05") {
    const limite = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    await supabase.from("habito_interacoes").delete().lt("criado_em", limite);
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
  hoje: string,
  lembreteHabito?: { habitoId: string; titulo: string; corpo: string; data: string },
  /** Etapa 216 — "já avisei" por horário (hábito com vários lembretes no dia) */
  hora = ""
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
      .eq("hora", hora)
      .maybeSingle();
    if (jaEnviado) continue;

    // Se a pessoa tem o app instalado (token do FCM), a notificação
    // nativa já é mais confiável — não faz sentido mandar as duas
    // (navegador + app) pro mesmo dispositivo. Prioriza o app: só usa
    // o Web Push do navegador se não tiver nenhum token de app.
    const { data: tokensFcm } = await supabase
      .from("fcm_tokens")
      .select("id, token, suporta_acoes")
      .eq("usuario_id", usuarioId);

    const temAppInstalado = (tokensFcm ?? []).length > 0;

    if (!temAppInstalado) {
      const { data: inscricoes } = await supabase
        .from("push_inscricoes")
        .select("id, endpoint, chaves")
        .eq("usuario_id", usuarioId);

      for (const inscricao of inscricoes ?? []) {
        try {
          await enviarPush(
            { endpoint: inscricao.endpoint, chaves: inscricao.chaves as any },
            {
              titulo: "VidaTrack",
              corpo: texto,
              url,
              // Etapa 221 — no navegador também dá pra marcar direto pela notificação
              ...(lembreteHabito ? { habitoId: lembreteHabito.habitoId, data: lembreteHabito.data } : {}),
            }
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

          // 404 ou 410 = a inscrição não existe mais de verdade (a
          // pessoa desinstalou, limpou os dados do navegador, etc.) —
          // limpa daqui, senão ficamos tentando mandar pra um endereço
          // morto pra sempre (é o mesmo cuidado que já tínhamos com
          // token do FCM, só que essa parte do Web Push ainda não tinha).
          if (erro?.statusCode === 404 || erro?.statusCode === 410) {
            await supabase.from("push_inscricoes").delete().eq("id", inscricao.id);
          }
        }
      }
    }

    for (const registroFcm of tokensFcm ?? []) {
      const resultado =
        lembreteHabito && (registroFcm as any).suporta_acoes
          ? await enviarLembreteHabitoFCM(registroFcm.token, lembreteHabito)
          : await enviarNotificacaoFCM(registroFcm.token, "VidaTrack", texto, url);
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
      hora,
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
    .select("id, descricao, valor, dia_mes, data_fim, data_inicio, dono_id, financa_contas(nome)")
    .eq("ativo", true)
    .eq("tipo", "despesa")
    .in("dia_mes", Array.from(new Set([diaHoje, diaAmanha])));

  // Etapa 254 — o lançamento do mês já existe desde o dia 1: se já foi
  // marcado como pago, não avisa; se o valor foi ajustado, usa o novo.
  const ids = (recorrencias ?? []).map((r) => r.id as string);
  const { data: lancamentos } = ids.length
    ? await supabase
        .from("financa_transacoes")
        .select("recorrencia_id, valor, pago_em, data")
        .in("recorrencia_id", ids)
        .gte("data", hoje.slice(0, 8) + "01")
        .lte("data", amanhaISO)
    : { data: [] as any[] };
  const lancamentoDo = new Map((lancamentos ?? []).map((t: any) => [t.recorrencia_id as string, t]));

  let enviados = 0;

  for (const r of recorrencias ?? []) {
    const lanc = lancamentoDo.get(r.id as string);
    if (lanc?.pago_em) continue;
    const venceHoje = r.dia_mes === diaHoje;
    const venceAmanha = r.dia_mes === diaAmanha;
    if (!venceHoje && !venceAmanha) continue;

    const dataDoVencimento = venceHoje ? hoje : amanhaISO;
    if (r.data_fim && dataDoVencimento > r.data_fim) continue; // já expirou
    if ((r as any).data_inicio && dataDoVencimento < (r as any).data_inicio) continue; // Etapa 205: ainda não começou

    const descricao = r.descricao || (r as any).financa_contas?.nome || "Conta";
    const texto = venceHoje
      ? `💳 Você tem uma conta vencendo HOJE: ${descricao} — ${formatarMoeda(lanc ? lanc.valor : r.valor)}`
      : `💳 Você tem uma conta vencendo AMANHÃ: ${descricao} — ${formatarMoeda(lanc ? lanc.valor : r.valor)}`;

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

/**
 * Etapa 252 — despesas AGENDADAS (lançamento único com data futura, ex:
 * um boleto marcado pro dia 15) que ainda não foram marcadas como pagas:
 * avisa na véspera e no dia, às 8h. Um aviso por pessoa (junta tudo).
 * Ficam de fora: contas fixas (já têm aviso próprio), compras no cartão
 * (entram na fatura, que tem aviso próprio), investimento e transferências.
 */
async function notificarDespesasAgendadas(supabase: ReturnType<typeof criarClienteAdmin>, hoje: string): Promise<number> {
  const amanha = somarDias(hoje, 1);
  const { data: transacoes } = await supabase
    .from("financa_transacoes")
    .select("id, dono_id, descricao, valor, data, financa_contas(nome, tipo)")
    .eq("tipo", "despesa")
    .in("data", [hoje, amanha])
    .is("pago_em", null)
    .is("recorrencia_id", null)
    .is("transferencia_grupo", null);

  type Item = { nome: string; valor: number };
  const grupos = new Map<string, { hoje: Item[]; amanha: Item[] }>();
  for (const t of transacoes ?? []) {
    const conta = (t as any).financa_contas;
    if (conta?.tipo === "cartao" || conta?.tipo === "investimento") continue;
    const dono = t.dono_id as string;
    if (!grupos.has(dono)) grupos.set(dono, { hoje: [], amanha: [] });
    const item = { nome: ((t.descricao as string) || "Despesa").trim(), valor: Number(t.valor) };
    (t.data === hoje ? grupos.get(dono)!.hoje : grupos.get(dono)!.amanha).push(item);
  }

  const texto = (itens: Item[], quando: "HOJE" | "AMANHÃ") => {
    if (itens.length === 1) return `💸 Vence ${quando}: ${itens[0].nome} — ${formatarMoeda(itens[0].valor)}. Já pagou? Toque pra marcar.`;
    const total = itens.reduce((s, i) => s + i.valor, 0);
    const nomes = itens.slice(0, 3).map((i) => i.nome);
    const mais = itens.length > 3 ? ` e mais ${itens.length - 3}` : "";
    return `💸 ${itens.length} despesas vencem ${quando} (${formatarMoeda(total)}): ${nomes.join(", ")}${mais}.`;
  };

  let enviados = 0;
  for (const [dono, g] of grupos) {
    // usa o tipo "conta_a_pagar" com o id da pessoa e uma "hora" própria pra não repetir no mesmo dia
    if (g.hoje.length)
      enviados += await notificarUsuariosDoItem(supabase, "conta_a_pagar", dono, dono, texto(g.hoje, "HOJE"), "/financas/extrato?tipo=despesa", hoje, undefined, "agendado-hoje");
    if (g.amanha.length)
      enviados += await notificarUsuariosDoItem(supabase, "conta_a_pagar", dono, dono, texto(g.amanha, "AMANHÃ"), "/financas/extrato?tipo=despesa", hoje, undefined, "agendado-amanha");
  }
  return enviados;
}

async function notificarOrcamentosEstourados(
  supabase: ReturnType<typeof criarClienteAdmin>,
  hoje: string
): Promise<number> {
  const primeiroDiaDoMes = hoje.slice(0, 7) + "-01"; // ex: "2026-09-01" — usado só como chave de "já avisei esse mês"
  const dataRef = new Date(primeiroDiaDoMes + "T00:00:00");
  const primeiroDiaProximoMes = new Date(dataRef.getFullYear(), dataRef.getMonth() + 1, 1).toLocaleDateString("sv-SE");

  const { data: categorias } = await supabase
    .from("financa_categorias")
    .select("id, nome, meta_mensal, dono_id")
    .not("meta_mensal", "is", null)
    .eq("tipo", "despesa");

  let enviados = 0;

  for (const cat of categorias ?? []) {
    const { data: transacoes } = await supabase
      .from("financa_transacoes")
      .select("valor")
      .eq("categoria_id", cat.id)
      .eq("tipo", "despesa")
      .gte("data", primeiroDiaDoMes)
      .lt("data", primeiroDiaProximoMes);

    const gastoTotal = (transacoes ?? []).reduce((soma, t) => soma + Number(t.valor), 0);
    const limite = Number(cat.meta_mensal);
    if (!limite || gastoTotal < limite * 0.8) continue;

    // Etapa 214 — aviso antes de estourar (80%); o de estourou continua
    const estourou = gastoTotal > limite;
    const texto = estourou
      ? `⚠️ Orçamento de "${cat.nome}" estourou este mês: ${formatarMoeda(gastoTotal)} de ${formatarMoeda(limite)}`
      : `🟡 "${cat.nome}" já está em ${Math.round((gastoTotal / limite) * 100)}% do limite do mês: ${formatarMoeda(
          gastoTotal
        )} de ${formatarMoeda(limite)}`;

    enviados += await notificarUsuariosDoItem(
      supabase,
      estourou ? "orcamento_estourado" : "orcamento_80",
      cat.id,
      cat.dono_id,
      texto,
      "/financas/categorias",
      primeiroDiaDoMes
    );
  }

  return enviados;
}

function diaDaSemana(iso: string) {
  return new Date(iso + "T12:00:00Z").getUTCDay();
}

function listarNomes(nomes: string[]) {
  const aspas = nomes.map((n) => `“${n}”`);
  if (aspas.length <= 1) return aspas.join("");
  if (aspas.length <= 3) return aspas.slice(0, -1).join(", ") + " e " + aspas.at(-1);
  return aspas.slice(0, 2).join(", ") + ` e mais ${aspas.length - 2}`;
}

/**
 * Etapa 202 — às 20:30, quem ainda tem hábito do dia sem marcar recebe
 * um empurrãozinho. Não manda nada pra quem já fez tudo (ou não tem
 * hábito pro dia) e respeita quem desligou em Notificações.
 */
async function notificarHabitosPendentesDaNoite(
  supabase: ReturnType<typeof criarClienteAdmin>,
  hoje: string
): Promise<number> {
  const { data: perfis } = await supabase.from("perfis").select("id").eq("aviso_noite", true);
  const ids = (perfis ?? []).map((p) => p.id as string);
  if (!ids.length) return 0;

  const [{ data: habitos }, { data: checkins }] = await Promise.all([
    supabase
      .from("habitos")
      .select("id, nome, dono_id, frequencia, dias_semana, meta_diaria, vezes_semana, pausas")
      .eq("arquivado", false)
      .eq("eh_negativo", false)
      .in("dono_id", ids),
    supabase.from("habito_checkins").select("habito_id, usuario_id, quantidade").eq("data", hoje).in("usuario_id", ids),
  ]);
  // Etapa 213 — hábitos "X por semana": dias já feitos nesta semana
  const { data: checkinsSemana } = await supabase
    .from("habito_checkins")
    .select("habito_id, usuario_id, data, quantidade")
    .gte("data", inicioDaSemana(hoje))
    .lte("data", hoje)
    .in("usuario_id", ids);

  const feito = new Map<string, number>();
  for (const c of checkins ?? []) {
    const k = `${c.usuario_id}|${c.habito_id}`;
    feito.set(k, (feito.get(k) ?? 0) + Number(c.quantidade ?? 1));
  }

  const porUsuario = new Map<string, { total: number; pendentes: string[] }>();
  for (const h of habitos ?? []) {
    if (!habitoDevidoNoDia(h, hoje)) continue;
    if (h.frequencia === "semanal") {
      const dias = (checkinsSemana ?? [])
        .filter((c) => c.habito_id === h.id && c.usuario_id === h.dono_id && Number(c.quantidade ?? 1) >= (h.meta_diaria ?? 1))
        .map((c) => c.data as string);
      if (feitosNaSemana(dias, hoje) >= ((h as any).vezes_semana ?? 3)) continue; // meta da semana já batida
    }
    const r = porUsuario.get(h.dono_id) ?? { total: 0, pendentes: [] };
    r.total++;
    if ((feito.get(`${h.dono_id}|${h.id}`) ?? 0) < (h.meta_diaria ?? 1)) r.pendentes.push(h.nome);
    porUsuario.set(h.dono_id, r);
  }

  let enviados = 0;
  for (const [usuarioId, r] of porUsuario) {
    if (!r.pendentes.length) continue;
    const feitos = r.total - r.pendentes.length;
    const texto =
      r.pendentes.length === 1
        ? `🌙 Falta só ${listarNomes(r.pendentes)} hoje${feitos ? ` — você já fez ${feitos} de ${r.total}` : ""}. Ainda dá tempo!`
        : `🌙 Faltam ${r.pendentes.length} hábitos hoje: ${listarNomes(r.pendentes)}. Ainda dá tempo de manter a sequência!`;
    enviados += await notificarUsuariosDoItem(supabase, "resumo_noite", usuarioId, usuarioId, texto, "/habitos", hoje);
  }
  return enviados;
}

/**
 * Etapa 202 — domingo às 19:00: resumo dos últimos 7 dias (hábitos,
 * tarefas concluídas e gastos). Só vai pra quem teve algum movimento.
 */
async function notificarResumoSemanal(
  supabase: ReturnType<typeof criarClienteAdmin>,
  hoje: string
): Promise<number> {
  const { data: perfis } = await supabase.from("perfis").select("id").eq("resumo_semanal", true);
  const ids = (perfis ?? []).map((p) => p.id as string);
  if (!ids.length) return 0;

  const inicio = somarDias(hoje, -6);
  const [{ data: habitos }, { data: checkins }, { data: conclusoes }, { data: gastos }] = await Promise.all([
    supabase
      .from("habitos")
      .select("id, dono_id, frequencia, dias_semana, meta_diaria, pausas")
      .eq("arquivado", false)
      .eq("eh_negativo", false)
      .in("dono_id", ids),
    supabase
      .from("habito_checkins")
      .select("habito_id, usuario_id, data, quantidade")
      .gte("data", inicio)
      .lte("data", hoje)
      .in("usuario_id", ids),
    supabase.from("tarefa_conclusoes").select("usuario_id").gte("data", inicio).lte("data", hoje).in("usuario_id", ids),
    // Etapa 250 — duas semanas (pra comparar), sem transferências
    supabase
      .from("financa_transacoes")
      .select("dono_id, valor, data, transferencia_grupo")
      .eq("tipo", "despesa")
      .is("transferencia_grupo", null)
      .gte("data", somarDias(inicio, -7))
      .lte("data", hoje)
      .in("dono_id", ids),
  ]);

  const qtd = new Map<string, number>();
  for (const c of checkins ?? []) {
    const k = `${c.usuario_id}|${c.habito_id}|${c.data}`;
    qtd.set(k, (qtd.get(k) ?? 0) + Number(c.quantidade ?? 1));
  }

  type Resumo = { devidos: number; feitos: number; tarefas: number; gasto: number; gastoAntes: number };
  const resumo = new Map<string, Resumo>();
  const pegar = (id: string) => {
    let r = resumo.get(id);
    if (!r) resumo.set(id, (r = { devidos: 0, feitos: 0, tarefas: 0, gasto: 0, gastoAntes: 0 }));
    return r;
  };

  for (let i = 0; i < 7; i++) {
    const dia = somarDias(inicio, i);
    for (const h of habitos ?? []) {
      if (!habitoDevidoNoDia(h, dia)) continue;
      const r = pegar(h.dono_id);
      r.devidos++;
      if ((qtd.get(`${h.dono_id}|${h.id}|${dia}`) ?? 0) >= (h.meta_diaria ?? 1)) r.feitos++;
    }
  }
  for (const c of conclusoes ?? []) pegar(c.usuario_id).tarefas++;
  for (const g of gastos ?? []) {
    if ((g as any).data >= inicio) pegar(g.dono_id).gasto += Number(g.valor);
    else pegar(g.dono_id).gastoAntes += Number(g.valor);
  }

  let enviados = 0;
  for (const [usuarioId, r] of resumo) {
    const partes: string[] = [];
    if (r.devidos > 0) partes.push(`${Math.round((r.feitos / r.devidos) * 100)}% dos hábitos feitos`);
    if (r.tarefas > 0) partes.push(`${r.tarefas} ${r.tarefas === 1 ? "tarefa concluída" : "tarefas concluídas"}`);
    if (r.gasto > 0) {
      // Etapa 250 — compara com a semana anterior
      const dif = r.gastoAntes > 0 ? Math.round(((r.gasto - r.gastoAntes) / r.gastoAntes) * 100) : null;
      const comparacao =
        dif === null || Math.abs(dif) < 5 ? "" : dif < 0 ? ` (${Math.abs(dif)}% menos que a anterior 👏)` : ` (${dif}% a mais que a anterior)`;
      partes.push(`${formatarMoeda(r.gasto)} em gastos${comparacao}`);
    }
    if (!partes.length || (r.feitos === 0 && r.tarefas === 0 && r.gasto === 0)) continue;
    const texto = `📊 Sua semana: ${partes.join(" · ")}. Toque pra ver os detalhes.`;
    enviados += await notificarUsuariosDoItem(
      supabase,
      "resumo_semana",
      usuarioId,
      usuarioId,
      texto,
      "/habitos/semana",
      hoje
    );
  }
  return enviados;
}

/**
 * Etapa 214 — no dia 1, resumo do mês anterior: entrou, saiu, a
 * categoria que mais pesou e a comparação com o mês antes dele.
 * Transferências entre contas não contam. Usa a mesma preferência do
 * resumo semanal (Notificações → Avisos automáticos).
 */
async function notificarResumoMensal(supabase: ReturnType<typeof criarClienteAdmin>, hoje: string): Promise<number> {
  const { data: perfis } = await supabase.from("perfis").select("id").eq("resumo_semanal", true);
  const ids = (perfis ?? []).map((p) => p.id as string);
  if (!ids.length) return 0;

  const [a, m] = hoje.split("-").map(Number);
  const iso = (d: Date) => d.toLocaleDateString("sv-SE");
  const inicioMes = iso(new Date(a, m - 2, 1));
  const fimMes = iso(new Date(a, m - 1, 0));
  const inicioAnterior = iso(new Date(a, m - 3, 1));
  const nomeMes = new Date(a, m - 2, 1).toLocaleDateString("pt-BR", { month: "long" });

  const { data: transacoes } = await supabase
    .from("financa_transacoes")
    .select("dono_id, tipo, valor, data, categoria_id, transferencia_grupo")
    .gte("data", inicioAnterior)
    .lte("data", fimMes)
    .is("transferencia_grupo", null)
    .in("dono_id", ids);
  const { data: categorias } = await supabase.from("financa_categorias").select("id, nome").in("dono_id", ids);
  const nomeCategoria = new Map((categorias ?? []).map((c) => [c.id as string, c.nome as string]));

  type R = { entrou: number; saiu: number; saiuAntes: number; porCat: Map<string, number> };
  const porUsuario = new Map<string, R>();
  for (const t of transacoes ?? []) {
    const r = porUsuario.get(t.dono_id) ?? { entrou: 0, saiu: 0, saiuAntes: 0, porCat: new Map() };
    const v = Number(t.valor);
    if (t.data >= inicioMes) {
      if (t.tipo === "receita") r.entrou += v;
      else {
        r.saiu += v;
        if (t.categoria_id) r.porCat.set(t.categoria_id, (r.porCat.get(t.categoria_id) ?? 0) + v);
      }
    } else if (t.tipo === "despesa") r.saiuAntes += v;
    porUsuario.set(t.dono_id, r);
  }

  let enviados = 0;
  for (const [usuarioId, r] of porUsuario) {
    if (r.entrou === 0 && r.saiu === 0) continue;
    const partes = [`entrou ${formatarMoeda(r.entrou)}`, `saiu ${formatarMoeda(r.saiu)}`];
    const topo = [...r.porCat.entries()].sort((x, y) => y[1] - x[1])[0];
    if (topo && nomeCategoria.get(topo[0])) partes.push(`mais gasto: ${nomeCategoria.get(topo[0])} (${formatarMoeda(topo[1])})`);
    let comparacao = "";
    if (r.saiuAntes > 0) {
      const dif = Math.round(((r.saiu - r.saiuAntes) / r.saiuAntes) * 100);
      comparacao = dif === 0 ? " Gastou igual ao mês anterior." : ` Gastou ${Math.abs(dif)}% ${dif < 0 ? "a menos" : "a mais"} que no mês anterior.`;
    }
    const texto = `📅 Seu ${nomeMes}: ${partes.join(" · ")}.${comparacao}`;
    enviados += await notificarUsuariosDoItem(supabase, "resumo_mes", usuarioId, usuarioId, texto, "/financas/analise", hoje);
  }
  return enviados;
}

/**
 * Etapa 215 — lembrete da fatura do cartão: 3 dias antes, na véspera e
 * no dia do vencimento, só se ainda tiver valor a pagar (pagamento =
 * transferência pro cartão depois do fechamento).
 */
async function notificarFaturasCartao(supabase: ReturnType<typeof criarClienteAdmin>, hoje: string): Promise<number> {
  const { data: cartoes } = await supabase
    .from("financa_contas")
    .select("id, nome, tipo, dono_id, dia_fechamento, dia_vencimento")
    .eq("tipo", "cartao")
    .eq("arquivado", false)
    .not("dia_fechamento", "is", null)
    .not("dia_vencimento", "is", null);

  const avisarEm = new Map([
    [somarDias(hoje, 3), "em 3 dias"],
    [somarDias(hoje, 1), "amanhã"],
    [hoje, "HOJE"],
  ]);
  let enviados = 0;

  for (const c of cartoes ?? []) {
    const aberta = calcularPeriodoFatura(c.dia_fechamento as number, hoje);
    const fechada = periodoFaturaAdjacente(c.dia_fechamento as number, aberta.fim, -1);
    for (const periodo of [fechada, aberta]) {
      const { data: transacoes } = await supabase
        .from("financa_transacoes")
        .select("conta_id, tipo, valor, data, transferencia_grupo")
        .eq("conta_id", c.id)
        .gte("data", periodo.inicio);
      const r = resumoFatura(c as any, (transacoes ?? []) as any, periodo);
      if (!r.vencimento || !avisarEm.has(r.vencimento) || r.aPagar <= 0) continue;
      const quando = avisarEm.get(r.vencimento)!;
      const texto = `💳 Fatura do ${c.nome} vence ${quando} (${r.vencimento.slice(8, 10)}/${r.vencimento.slice(5, 7)}): ${formatarMoeda(r.aPagar)}`;
      enviados += await notificarUsuariosDoItem(
        supabase,
        "fatura_cartao",
        c.id,
        c.dono_id as string,
        texto,
        `/financas/contas/${c.id}/fatura`,
        hoje
      );
    }
  }
  return enviados;
}

/**
 * Etapa 218 — 07:00: "Hoje: 4 hábitos · 2 tarefas · vence: Luz (R$ 120)".
 * Só pra quem deixou ligado (perfis.resumo_manha) e só se tiver algo.
 */
async function notificarResumoManha(supabase: ReturnType<typeof criarClienteAdmin>, hoje: string): Promise<number> {
  const { data: perfis } = await supabase.from("perfis").select("id").eq("resumo_manha", true);
  const ids = (perfis ?? []).map((p) => p.id as string);
  if (!ids.length) return 0;

  const diaHoje = Number(hoje.slice(8, 10));
  const [{ data: habitos }, { data: tarefas }, { data: conclusoes }, { data: transacoes }, { data: recorrencias }] = await Promise.all([
    supabase
      .from("habitos")
      .select("id, dono_id, frequencia, dias_semana, eh_negativo, pausas")
      .in("dono_id", ids)
      .eq("arquivado", false),
    supabase
      .from("tarefas")
      .select("id, dono_id, repetir, dias_semana, data, concluida, dia_mes, mes, intervalo_dias")
      .in("dono_id", ids)
      .eq("arquivada", false),
    supabase.from("tarefa_conclusoes").select("tarefa_id").in("usuario_id", ids).eq("data", hoje),
    supabase
      .from("financa_transacoes")
      .select("dono_id, descricao, valor, recorrencia_id, pago_em, transferencia_grupo")
      .in("dono_id", ids)
      .eq("data", hoje)
      .eq("tipo", "despesa"),
    supabase
      .from("financa_recorrencias")
      .select("id, dono_id, descricao, valor, data_fim, data_inicio")
      .in("dono_id", ids)
      .eq("ativo", true)
      .eq("tipo", "despesa")
      .eq("dia_mes", diaHoje),
  ]);

  type R = { habitos: number; tarefas: number; contas: { nome: string; valor: number }[] };
  const porUsuario = new Map<string, R>();
  const pegar = (id: string) => {
    let r = porUsuario.get(id);
    if (!r) porUsuario.set(id, (r = { habitos: 0, tarefas: 0, contas: [] }));
    return r;
  };
  for (const h of habitos ?? []) {
    if (h.eh_negativo || !habitoDevidoNoDia(h as any, hoje)) continue;
    pegar(h.dono_id as string).habitos++;
  }
  const feitasHoje = new Set((conclusoes ?? []).map((c) => c.tarefa_id));
  for (const t of tarefas ?? []) {
    if (!tarefaApareceNoDia(t as any, hoje)) continue;
    if (t.repetir === "nenhuma" ? t.concluida : feitasHoje.has(t.id)) continue;
    pegar(t.dono_id as string).tarefas++;
  }
  const recorrenciasLancadas = new Set<string>();
  for (const t of transacoes ?? []) {
    if (t.recorrencia_id) recorrenciasLancadas.add(t.recorrencia_id as string);
    if (t.pago_em || t.transferencia_grupo) continue;
    pegar(t.dono_id as string).contas.push({ nome: (t.descricao as string) || "Conta", valor: Number(t.valor) });
  }
  for (const r of recorrencias ?? []) {
    if (recorrenciasLancadas.has(r.id as string)) continue;
    if (r.data_fim && hoje > (r.data_fim as string)) continue;
    if (r.data_inicio && hoje < (r.data_inicio as string)) continue;
    pegar(r.dono_id as string).contas.push({ nome: (r.descricao as string) || "Conta", valor: Number(r.valor) });
  }

  let enviados = 0;
  for (const [usuarioId, r] of porUsuario) {
    if (!r.habitos && !r.tarefas && !r.contas.length) continue;
    const partes: string[] = [];
    if (r.habitos) partes.push(`${r.habitos} hábito${r.habitos > 1 ? "s" : ""}`);
    if (r.tarefas) partes.push(`${r.tarefas} tarefa${r.tarefas > 1 ? "s" : ""}`);
    if (r.contas.length === 1) partes.push(`vence ${r.contas[0].nome} (${formatarMoeda(r.contas[0].valor)})`);
    else if (r.contas.length > 1)
      partes.push(`vencem ${r.contas.length} contas (${formatarMoeda(r.contas.reduce((s, c) => s + c.valor, 0))})`);
    const texto = `☀️ Bom dia! Hoje: ${partes.join(" · ")}`;
    enviados += await notificarUsuariosDoItem(supabase, "resumo_manha", usuarioId, usuarioId, texto, "/habitos", hoje);
  }
  return enviados;
}

/** Etapa 220 — avisa em 80% e quando passar do teto de gastos do mês (uma vez por mês cada). */
async function notificarTetoMensal(supabase: ReturnType<typeof criarClienteAdmin>, hoje: string): Promise<number> {
  const { data: perfis } = await supabase.from("perfis").select("id, teto_mensal").not("teto_mensal", "is", null);
  let enviados = 0;
  const inicioMes = hoje.slice(0, 7) + "-01";
  for (const p of perfis ?? []) {
    const teto = Number(p.teto_mensal);
    if (!(teto > 0)) continue;
    const [{ data: contas }, { data: transacoes }] = await Promise.all([
      supabase.from("financa_contas").select("id, tipo").eq("dono_id", p.id),
      supabase
        .from("financa_transacoes")
        .select("conta_id, tipo, valor, data, transferencia_grupo, pago_em")
        .eq("dono_id", p.id)
        .eq("tipo", "despesa")
        .gte("data", inicioMes)
        .lte("data", hoje.slice(0, 7) + "-31"),
    ]);
    const gasto = gastoDoMes((contas ?? []) as any, (transacoes ?? []) as any, hoje);
    if (gasto < teto * 0.8) continue;
    const estourou = gasto > teto;
    const texto = estourou
      ? `🚨 Você passou do teto de gastos do mês: ${formatarMoeda(gasto)} de ${formatarMoeda(teto)}`
      : `🟡 Já foram ${Math.round((gasto / teto) * 100)}% do teto do mês: ${formatarMoeda(gasto)} de ${formatarMoeda(teto)}`;
    enviados += await notificarUsuariosDoItem(supabase, estourou ? "teto_100" : "teto_80", p.id as string, p.id as string, texto, "/financas", inicioMes);
  }
  return enviados;
}

/** Etapa 220 — lembra de lançar gastos quem está há 2+ dias sem lançar nada (no máx. a cada 2 dias). */
async function notificarLembreteLancar(supabase: ReturnType<typeof criarClienteAdmin>, hoje: string): Promise<number> {
  const { data: perfis } = await supabase.from("perfis").select("id").eq("lembrete_lancar", true);
  const ids = (perfis ?? []).map((p) => p.id as string);
  if (!ids.length) return 0;
  const doisDiasAtras = somarDias(hoje, -2);
  const [{ data: contas }, { data: recentes }, { data: avisados }] = await Promise.all([
    supabase.from("financa_contas").select("dono_id").in("dono_id", ids).eq("arquivado", false),
    // lançado à mão (não gerado por conta fixa) nos últimos 2 dias
    supabase
      .from("financa_transacoes")
      .select("dono_id")
      .in("dono_id", ids)
      .is("recorrencia_id", null)
      .gte("criado_em", new Date(Date.parse(doisDiasAtras + "T03:00:00Z")).toISOString()),
    supabase.from("lembretes_enviados").select("usuario_id").eq("tipo_item", "lembrete_lancar").gte("data", somarDias(hoje, -1)),
  ]);
  const temConta = new Set((contas ?? []).map((c) => c.dono_id as string));
  const lancouRecente = new Set((recentes ?? []).map((t) => t.dono_id as string));
  const avisadoRecente = new Set((avisados ?? []).map((a) => a.usuario_id as string));
  let enviados = 0;
  for (const id of ids) {
    if (!temConta.has(id) || lancouRecente.has(id) || avisadoRecente.has(id)) continue;
    enviados += await notificarUsuariosDoItem(
      supabase,
      "lembrete_lancar",
      id,
      id,
      "💸 Gastou algo hoje? Toque pra lançar em segundos — assim a previsão do mês fica certinha.",
      "/financas?gasto=1",
      hoje
    );
  }
  return enviados;
}
