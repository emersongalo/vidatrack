import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { diaBateComFrequencia, inicioDaSemana, feitosNaSemana } from "@/lib/agenda/dias";
import { tarefaApareceNoDia } from "@/lib/agenda/recorrencia";
import { enviarPush } from "@/lib/push/servidor";
import { segredosIguais } from "@/lib/seguranca";
import { horaAtualNoFuso, dataAtualNoFuso, horaMinutosAtrasNoFuso } from "@/lib/tempo/fuso";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { enviarNotificacaoFCM, enviarLembreteHabitoFCM } from "@/lib/fcm/servidor";
import { somarDias } from "@/lib/widgets/dados";

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
      `🔔 Hora de: ${h.nome}`,
      "/habitos",
      hoje,
      // Etapa 195 — app novo mostra com botões "✓ Feito" / "Lembrar em 30 min"
      { habitoId: h.id, titulo: `🔔 Hora de: ${h.nome}`, corpo: "Toque em ✓ Feito se já fez.", data: hoje }
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
  }

  // --- Orçamento estourado (categorias com meta mensal) ---
  // Também só 1x por dia — o gasto do mês não muda tão rápido a
  // ponto de precisar checar a cada poucos minutos.
  if (horaAtual >= "08:05" && horaAtual <= "08:10") {
    enviados += await notificarOrcamentosEstourados(supabase, hoje);
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
  lembreteHabito?: { habitoId: string; titulo: string; corpo: string; data: string }
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

  let enviados = 0;

  for (const r of recorrencias ?? []) {
    const venceHoje = r.dia_mes === diaHoje;
    const venceAmanha = r.dia_mes === diaAmanha;
    if (!venceHoje && !venceAmanha) continue;

    const dataDoVencimento = venceHoje ? hoje : amanhaISO;
    if (r.data_fim && dataDoVencimento > r.data_fim) continue; // já expirou
    if ((r as any).data_inicio && dataDoVencimento < (r as any).data_inicio) continue; // Etapa 205: ainda não começou

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
      .select("id, nome, dono_id, frequencia, dias_semana, meta_diaria, vezes_semana")
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
    if (!diaBateComFrequencia(h.frequencia, h.dias_semana ?? [], hoje)) continue;
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
      .select("id, dono_id, frequencia, dias_semana, meta_diaria")
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
    supabase
      .from("financa_transacoes")
      .select("dono_id, valor")
      .eq("tipo", "despesa")
      .gte("data", inicio)
      .lte("data", hoje)
      .in("dono_id", ids),
  ]);

  const qtd = new Map<string, number>();
  for (const c of checkins ?? []) {
    const k = `${c.usuario_id}|${c.habito_id}|${c.data}`;
    qtd.set(k, (qtd.get(k) ?? 0) + Number(c.quantidade ?? 1));
  }

  type Resumo = { devidos: number; feitos: number; tarefas: number; gasto: number };
  const resumo = new Map<string, Resumo>();
  const pegar = (id: string) => {
    let r = resumo.get(id);
    if (!r) resumo.set(id, (r = { devidos: 0, feitos: 0, tarefas: 0, gasto: 0 }));
    return r;
  };

  for (let i = 0; i < 7; i++) {
    const dia = somarDias(inicio, i);
    for (const h of habitos ?? []) {
      if (!diaBateComFrequencia(h.frequencia, h.dias_semana ?? [], dia)) continue;
      const r = pegar(h.dono_id);
      r.devidos++;
      if ((qtd.get(`${h.dono_id}|${h.id}|${dia}`) ?? 0) >= (h.meta_diaria ?? 1)) r.feitos++;
    }
  }
  for (const c of conclusoes ?? []) pegar(c.usuario_id).tarefas++;
  for (const g of gastos ?? []) pegar(g.dono_id).gasto += Number(g.valor);

  let enviados = 0;
  for (const [usuarioId, r] of resumo) {
    const partes: string[] = [];
    if (r.devidos > 0) partes.push(`${Math.round((r.feitos / r.devidos) * 100)}% dos hábitos feitos`);
    if (r.tarefas > 0) partes.push(`${r.tarefas} ${r.tarefas === 1 ? "tarefa concluída" : "tarefas concluídas"}`);
    if (r.gasto > 0) partes.push(`${formatarMoeda(r.gasto)} em gastos`);
    if (!partes.length || (r.feitos === 0 && r.tarefas === 0 && r.gasto === 0)) continue;
    const texto = `📊 Sua semana: ${partes.join(" · ")}. Toque pra ver os detalhes.`;
    enviados += await notificarUsuariosDoItem(
      supabase,
      "resumo_semana",
      usuarioId,
      usuarioId,
      texto,
      "/habitos/estatisticas",
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
