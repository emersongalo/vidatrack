import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  // Tudo em paralelo — isso já é uma boa quantidade de dados, mas
  // continua sendo bem menor que abrir cada tela do app individualmente.
  const [
    { data: habitos },
    { data: tarefas },
    { data: categoriasProdutividade },
    { data: notas },
    { data: contas },
    { data: categoriasFinancas },
  ] = await Promise.all([
    supabase
      .from("habitos")
      .select("id, nome, cor, icone, frequencia, dias_semana, meta_diaria, unidade, ordem")
      .eq("arquivado", false),
    supabase
      .from("tarefas")
      .select("id, titulo, icone, repetir, dias_semana, data, concluida, ordem")
      .eq("arquivada", false),
    supabase.from("categorias_produtividade").select("id, nome, cor"),
    supabase
      .from("notas")
      .select("id, titulo, conteudo, fixada, atualizado_em")
      .eq("arquivado", false)
      .order("atualizado_em", { ascending: false }),
    supabase.from("financa_contas").select("id, nome, banco, tipo, saldo_inicial").eq("arquivado", false),
    supabase.from("financa_categorias").select("id, nome, tipo, icone, cor"),
  ]);

  const idsContas = (contas ?? []).map((c) => c.id);

  // Só os lançamentos mais recentes — não faz sentido guardar o
  // histórico financeiro inteiro no navegador da pessoa pra sempre.
  const { data: transacoesRecentes } = idsContas.length
    ? await supabase
        .from("financa_transacoes")
        .select("id, conta_id, categoria_id, tipo, valor, descricao, data")
        .in("conta_id", idsContas)
        .order("data", { ascending: false })
        .limit(200)
    : { data: [] };

  return NextResponse.json({
    baixadoEm: new Date().toISOString(),
    habitos: habitos ?? [],
    tarefas: tarefas ?? [],
    categoriasProdutividade: categoriasProdutividade ?? [],
    notas: notas ?? [],
    financas: {
      contas: contas ?? [],
      categorias: categoriasFinancas ?? [],
      transacoesRecentes: transacoesRecentes ?? [],
    },
  });
}
