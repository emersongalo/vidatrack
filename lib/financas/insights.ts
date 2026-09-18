import { createClient } from "@/lib/supabase/server";
import { primeiroDiaDoMes } from "@/lib/financas/formatacao";
import {
  calcularInsightsFinanceiros,
  mesAnteriorISO,
  proximoMes,
  type InsightsFinanceiros,
} from "@/lib/financas/insights-calculo";

export type { CategoriaComparada, MaiorGasto, PontoAcumulado, OrcamentoComparado, InsightsFinanceiros } from "@/lib/financas/insights-calculo";

export async function buscarInsightsFinanceiros(
  supabase: ReturnType<typeof createClient>,
  mesReferenciaISO: string
): Promise<InsightsFinanceiros> {
  const inicioMes = primeiroDiaDoMes(mesReferenciaISO);
  const inicioMesAnterior = mesAnteriorISO(inicioMes);

  const [{ data: contas }, { data: categoriasComMeta }] = await Promise.all([
    supabase.from("financa_contas").select("id").eq("arquivado", false),
    supabase
      .from("financa_categorias")
      .select("nome, meta_mensal")
      .eq("tipo", "despesa")
      .not("meta_mensal", "is", null),
  ]);
  const idsContas = (contas ?? []).map((c) => c.id);

  if (idsContas.length === 0) {
    return {
      categorias: [],
      totalDespesasMes: 0,
      totalDespesasMesAnterior: 0,
      maiorGasto: null,
      acumulado: [],
      dicas: ["Crie sua primeira conta e comece a lançar despesas pra ver a análise aqui."],
      orcamentoComparado: [],
    };
  }

  const { data: transacoes } = await supabase
    .from("financa_transacoes")
    .select("tipo, valor, descricao, data, categoria_id, conta_id, financa_categorias(nome)")
    .in("conta_id", idsContas)
    .eq("tipo", "despesa")
    .gte("data", inicioMesAnterior)
    .lt("data", proximoMes(inicioMes));

  const transacoesComNome = ((transacoes ?? []) as any[]).map((t) => ({
    valor: Number(t.valor),
    descricao: t.descricao,
    data: t.data,
    nomeCategoria: t.financa_categorias?.nome ?? "Sem categoria",
  }));

  return calcularInsightsFinanceiros(
    transacoesComNome,
    (categoriasComMeta ?? []).map((c) => ({ nome: c.nome, meta_mensal: Number(c.meta_mensal) })),
    mesReferenciaISO,
    new Date().toLocaleDateString("sv-SE")
  );
}
