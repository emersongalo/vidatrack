import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/habitos/streak";
import { buscarInsightsFinanceiros } from "@/lib/financas/insights";
import { buscarSaldoTotal, buscarContasAPagar } from "@/lib/financas/consulta";
import { buscarItensDoDia } from "@/lib/agenda/consulta";
import { formatarMoeda } from "@/lib/financas/formatacao";

export async function montarContextoAssistente(): Promise<string> {
  const supabase = createClient();
  const hoje = hojeISO();

  const [saldoTotal, contasAPagar, insights, { itens }] = await Promise.all([
    buscarSaldoTotal(supabase),
    buscarContasAPagar(supabase, 6),
    buscarInsightsFinanceiros(supabase, hoje),
    buscarItensDoDia(hoje, ""),
  ]);

  const habitosPendentes = itens.filter((i) => i.tipo === "habito" && !i.feito);
  const tarefasPendentes = itens.filter((i) => i.tipo === "tarefa" && !i.feito);

  const linhas: string[] = [];

  linhas.push(`Hoje é ${new Date(hoje + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}.`);
  linhas.push("");
  linhas.push("=== FINANÇAS ===");
  linhas.push(`Saldo total (todas as contas): ${formatarMoeda(saldoTotal)}`);
  linhas.push(`Total gasto neste mês: ${formatarMoeda(insights.totalDespesasMes)}`);
  if (insights.totalDespesasMesAnterior > 0) {
    linhas.push(`Total gasto no mês passado (mesmo período): ${formatarMoeda(insights.totalDespesasMesAnterior)}`);
  }

  if (insights.categorias.length > 0) {
    linhas.push("Gastos por categoria neste mês:");
    for (const c of insights.categorias.slice(0, 10)) {
      linhas.push(`- ${c.nome}: ${formatarMoeda(c.valor)}`);
    }
  }

  if (insights.orcamentoComparado.length > 0) {
    linhas.push("Orçamento planejado x realizado (categorias com meta definida):");
    for (const o of insights.orcamentoComparado) {
      const status = o.gasto > o.orcamento ? "ESTOUROU" : "dentro do previsto";
      linhas.push(`- ${o.nome}: gastou ${formatarMoeda(o.gasto)} de um orçamento de ${formatarMoeda(o.orcamento)} (${status})`);
    }
  }

  if (contasAPagar.length > 0) {
    linhas.push("Próximas contas a pagar (recorrentes cadastradas):");
    for (const c of contasAPagar) {
      linhas.push(`- ${c.descricao}: ${formatarMoeda(c.valor)}, todo dia ${c.diaMes}`);
    }
  }

  if (insights.maiorGasto) {
    linhas.push(
      `Maior gasto individual do mês: "${insights.maiorGasto.descricao}" (${insights.maiorGasto.categoria}) — ${formatarMoeda(insights.maiorGasto.valor)}`
    );
  }

  linhas.push("");
  linhas.push("=== HÁBITOS E TAREFAS DE HOJE ===");
  if (habitosPendentes.length === 0 && tarefasPendentes.length === 0) {
    linhas.push("Tudo feito por hoje — nenhum hábito ou tarefa pendente.");
  } else {
    if (habitosPendentes.length > 0) {
      linhas.push(`Hábitos ainda não feitos hoje: ${habitosPendentes.map((h) => h.titulo).join(", ")}`);
    }
    if (tarefasPendentes.length > 0) {
      linhas.push(`Tarefas ainda não feitas hoje: ${tarefasPendentes.map((t) => t.titulo).join(", ")}`);
    }
  }

  return linhas.join("\n");
}
