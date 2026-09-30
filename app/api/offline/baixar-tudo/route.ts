import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calcularSaldoPorConta } from "@/lib/financas/consulta";
import { calcularPatrimonioPorMes } from "@/lib/financas/patrimonio";

// Quantas transações, no máximo, vão pro retrato offline. Pra uso
// pessoal isso cobre vários anos de histórico — é um limite de
// segurança, não algo que a maioria das pessoas chega perto de bater.
const LIMITE_TRANSACOES = 3000;

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const [
    { data: habitos },
    { data: tarefas },
    { data: categoriasProdutividade },
    { data: contas },
    { data: categoriasFinancas },
    { data: metas },
    { data: desafios },
    { data: recorrencias },
    { data: perfil },
  ] = await Promise.all([
    supabase
      .from("habitos")
      .select("id, nome, cor, icone, frequencia, dias_semana, meta_diaria, unidade, ordem, eh_negativo, criado_em, categoria_id, horario_lembrete, horarios_lembrete, vezes_semana, pausas, dono_id, rotina")
      .eq("arquivado", false),
    supabase
      .from("tarefas")
      .select("id, titulo, icone, repetir, dias_semana, data, concluida, ordem, subtarefas, categoria_id, horario_lembrete, observacoes, dia_mes, mes, intervalo_dias, prioridade, financa_tipo, financa_valor, financa_conta_id, financa_categoria_id")
      .eq("arquivada", false),
    supabase.from("categorias_produtividade").select("id, nome, cor"),
    supabase.from("financa_contas").select("id, dono_id, nome, banco, tipo, saldo_inicial, dia_fechamento, dia_vencimento, limite").eq("arquivado", false),
    supabase.from("financa_categorias").select("id, dono_id, nome, tipo, icone, cor, meta_mensal, envelope_desde, sobra_enviada_mes"),
    // Etapa 215 — meta arquivada não aparece mais na lista
    supabase.from("metas_financeiras").select("id, nome, valor_atual, valor_alvo, concluida, data_alvo").eq("arquivada", false),
    supabase
      .from("desafios_financeiros")
      .select("id, nome, quantidade_quadrados, valor_alvo, valor_guardado, concluido, conta_origem_id")
      .eq("arquivado", false),
    supabase.from("financa_recorrencias").select("id, tipo, valor, dia_mes, data_fim, data_inicio, ativo, descricao, conta_id, categoria_id"),
    supabase.from("perfis").select("nome, foto_url, ordem_blocos_financas, teto_mensal, ordem_blocos_habitos").eq("id", user.id).maybeSingle(),
  ]);

  const idsDesafios = (desafios ?? []).map((d) => d.id);
  const { data: quadrados } = idsDesafios.length
    ? await supabase
        .from("desafio_quadrados")
        .select("id, desafio_id, numero, valor, completado")
        .in("desafio_id", idsDesafios)
        .order("numero", { ascending: true })
    : { data: [] as any[] };

  const idsContas = (contas ?? []).map((c) => c.id);
  const idsHabitos = (habitos ?? []).map((h) => h.id);

  // 400 dias cobre mais de um ano de check-ins/conclusões — de sobra
  // pro que aparece na tela (sequência, recorde, estatísticas) sem
  // carregar a vida inteira da pessoa.
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 400);
  const dataLimiteISO = dataLimite.toLocaleDateString("sv-SE");

  const [{ data: checkins }, { data: conclusoesTarefas }, { data: transacoes }, { data: diario }, { data: metasLongas }] = await Promise.all([
    idsHabitos.length
      ? supabase
          .from("habito_checkins")
          .select("habito_id, usuario_id, data, quantidade, criado_em")
          .in("habito_id", idsHabitos)
          .gte("data", dataLimiteISO)
      : Promise.resolve({ data: [] as any[] }),
    supabase.from("tarefa_conclusoes").select("tarefa_id, data").eq("usuario_id", user.id).gte("data", dataLimiteISO),
    // TODAS as transações (não só as recentes) — usadas pra três
    // coisas ao mesmo tempo: o saldo certo de cada conta, o extrato
    // completo offline, e o gráfico de patrimônio. Uma consulta só,
    // em vez de três.
    idsContas.length
      ? supabase
          .from("financa_transacoes")
          .select("id, conta_id, categoria_id, tipo, valor, descricao, data, recorrencia_id, pago_em, parcela_grupo, parcela_numero, parcela_total, transferencia_grupo, etiquetas")
          .in("conta_id", idsContas)
          .order("data", { ascending: false })
          .limit(LIMITE_TRANSACOES)
      : Promise.resolve({ data: [] as any[] }),
    // Etapa 215 — diário do dia
    supabase.from("diario_dias").select("data, humor, texto").eq("dono_id", user.id).gte("data", dataLimiteISO).order("data", { ascending: false }),
    // Etapa 218 — metas de longo prazo
    supabase
      .from("metas_longas")
      .select("id, nome, emoji, alvo, unidade, data_inicio, data_fim, habito_id, progresso")
      .eq("dono_id", user.id)
      .eq("arquivada", false)
      .order("data_fim", { ascending: true }),
  ]);

  const todasTransacoes = transacoes ?? [];

  // Etapa 203 — saldo de HOJE (lançamento com data futura não sai ainda)
  const hojeBrasil = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
  const contasComSaldo = calcularSaldoPorConta(contas ?? [], todasTransacoes, hojeBrasil);
  const mapaSaldos = new Map(contasComSaldo.map((c) => [c.id, c.saldo]));
  const contasComSaldoCerto = (contas ?? []).map((c) => ({ ...c, saldo: mapaSaldos.get(c.id) ?? Number(c.saldo_inicial) }));

  const hojeISO = new Date().toLocaleDateString("sv-SE");
  const totalEmDesafios = (desafios ?? []).reduce((soma, d) => soma + Number(d.valor_guardado), 0);
  const patrimonio = calcularPatrimonioPorMes(
    (contas ?? []).map((c) => ({ id: c.id, saldo_inicial: Number(c.saldo_inicial) })),
    todasTransacoes.map((t) => ({ conta_id: t.conta_id, tipo: t.tipo, valor: Number(t.valor), data: t.data })),
    12,
    hojeISO
  );
  // Mesmo ajuste que a tela online faz: dinheiro guardado num desafio
  // continua sendo seu, soma no ponto mais recente do gráfico.
  if (patrimonio.length > 0) {
    patrimonio[patrimonio.length - 1].patrimonio += totalEmDesafios;
  }

  return NextResponse.json({
    baixadoEm: new Date().toISOString(),
    habitos: habitos ?? [],
    habitoCheckins: checkins ?? [],
    tarefas: tarefas ?? [],
    conclusoesTarefas: conclusoesTarefas ?? [],
    categoriasProdutividade: categoriasProdutividade ?? [],
    financas: {
      contas: contasComSaldoCerto,
      categorias: categoriasFinancas ?? [],
      transacoes: todasTransacoes,
      metas: metas ?? [],
      desafios: desafios ?? [],
      desafioQuadrados: quadrados ?? [],
      patrimonio,
      recorrencias: recorrencias ?? [],
      ordemBlocosFinancas: perfil?.ordem_blocos_financas ?? null,
    },
    diario: diario ?? [],
    metasLongas: metasLongas ?? [],
    perfil: {
      nome: perfil?.nome ?? null,
      email: user.email ?? null,
      teto_mensal: (perfil as any)?.teto_mensal ?? null,
      // Etapa 227 — ordem dos blocos da tela Hoje (por login)
      ordem_blocos_habitos: (perfil as any)?.ordem_blocos_habitos ?? null,
      id: user.id,
    },
  });
}
