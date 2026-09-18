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
  ] = await Promise.all([
    supabase
      .from("habitos")
      .select("id, nome, cor, icone, frequencia, dias_semana, meta_diaria, unidade, ordem, eh_negativo, criado_em")
      .eq("arquivado", false),
    supabase
      .from("tarefas")
      .select("id, titulo, icone, repetir, dias_semana, data, concluida, ordem")
      .eq("arquivada", false),
    supabase.from("categorias_produtividade").select("id, nome, cor"),
    supabase.from("financa_contas").select("id, nome, banco, tipo, saldo_inicial").eq("arquivado", false),
    supabase.from("financa_categorias").select("id, nome, tipo, icone, cor"),
    supabase.from("metas_financeiras").select("id, nome, valor_atual, valor_alvo, concluida"),
    supabase
      .from("desafios_financeiros")
      .select("id, nome, quantidade_quadrados, valor_alvo, valor_guardado, concluido")
      .eq("arquivado", false),
  ]);

  const idsContas = (contas ?? []).map((c) => c.id);
  const idsHabitos = (habitos ?? []).map((h) => h.id);

  // 400 dias cobre mais de um ano de check-ins/conclusões — de sobra
  // pro que aparece na tela (sequência, recorde, estatísticas) sem
  // carregar a vida inteira da pessoa.
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 400);
  const dataLimiteISO = dataLimite.toLocaleDateString("sv-SE");

  const [{ data: checkins }, { data: conclusoesTarefas }, { data: transacoes }] = await Promise.all([
    idsHabitos.length
      ? supabase
          .from("habito_checkins")
          .select("habito_id, data")
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
          .select("id, conta_id, categoria_id, tipo, valor, descricao, data")
          .in("conta_id", idsContas)
          .order("data", { ascending: false })
          .limit(LIMITE_TRANSACOES)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const todasTransacoes = transacoes ?? [];

  const contasComSaldo = calcularSaldoPorConta(contas ?? [], todasTransacoes);
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
      patrimonio,
    },
  });
}
