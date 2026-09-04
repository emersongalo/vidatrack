import { createClient } from "@/lib/supabase/server";
import { primeiroDiaDoMes } from "@/lib/financas/formatacao";

export type ContaComSaldo = {
  id: string;
  nome: string;
  banco: string | null;
  tipo: string;
  saldo: number;
};

/**
 * Saldo de CADA conta separadamente (não só o total geral) — usado na
 * lista de contas com saldo na tela principal de Finanças.
 */
export async function buscarSaldoPorConta(
  supabase: ReturnType<typeof createClient>
): Promise<ContaComSaldo[]> {
  const { data: contas } = await supabase
    .from("financa_contas")
    .select("id, nome, banco, tipo, saldo_inicial")
    .eq("arquivado", false)
    .order("criado_em", { ascending: true });

  const idsContas = (contas ?? []).map((c) => c.id);
  if (idsContas.length === 0) return [];

  const { data: transacoes } = await supabase
    .from("financa_transacoes")
    .select("conta_id, tipo, valor")
    .in("conta_id", idsContas);

  const somaPorConta = new Map<string, number>();
  for (const t of transacoes ?? []) {
    const atual = somaPorConta.get(t.conta_id) ?? 0;
    somaPorConta.set(t.conta_id, atual + (t.tipo === "receita" ? Number(t.valor) : -Number(t.valor)));
  }

  return (contas ?? []).map((c) => ({
    id: c.id,
    nome: c.nome,
    banco: c.banco,
    tipo: c.tipo,
    saldo: Number(c.saldo_inicial) + (somaPorConta.get(c.id) ?? 0),
  }));
}

/**
 * Saldo previsto pro fim do mês: saldo atual + receitas recorrentes
 * que ainda vão vencer esse mês - despesas recorrentes que ainda vão
 * vencer esse mês. Recorrências com dia <= hoje já foram lançadas
 * (viram transação de verdade via `garantirLancamentosRecorrentes`),
 * então já estão dentro do saldo atual — contar elas de novo aqui
 * duplicaria o valor.
 */
export function calcularSaldoPrevisto(
  saldoAtual: number,
  recorrencias: { tipo: string; valor: number; diaMes: number }[],
  diaAtual: number
): number {
  let saldo = saldoAtual;
  for (const r of recorrencias) {
    if (r.diaMes <= diaAtual) continue;
    saldo += r.tipo === "receita" ? Number(r.valor) : -Number(r.valor);
  }
  return saldo;
}

export async function buscarSaldoTotal(supabase: ReturnType<typeof createClient>): Promise<number> {
  const { data: contas } = await supabase
    .from("financa_contas")
    .select("id, saldo_inicial")
    .eq("arquivado", false);

  const idsContas = (contas ?? []).map((c) => c.id);
  if (idsContas.length === 0) return 0;

  const { data: transacoes } = await supabase
    .from("financa_transacoes")
    .select("conta_id, tipo, valor")
    .in("conta_id", idsContas);

  return (contas ?? []).reduce((total, conta) => {
    const doTransacoes = (transacoes ?? [])
      .filter((t) => t.conta_id === conta.id)
      .reduce((acc, t) => acc + (t.tipo === "receita" ? t.valor : -t.valor), 0);
    return total + Number(conta.saldo_inicial) + doTransacoes;
  }, 0);
}

export type ContaAPagar = { id: string; descricao: string; valor: number; diaMes: number };

/** Recorrências de despesa ativas, ordenadas pelo próximo dia de cobrança */
export async function buscarContasAPagar(
  supabase: ReturnType<typeof createClient>,
  limite = 5
): Promise<ContaAPagar[]> {
  const { data: recorrencias } = await supabase
    .from("financa_recorrencias")
    .select("id, descricao, valor, dia_mes, financa_contas(nome)")
    .eq("ativo", true)
    .eq("tipo", "despesa");

  const hojeDia = new Date().getDate();

  return (recorrencias ?? [])
    .map((r: any) => ({
      id: r.id,
      descricao: r.descricao || r.financa_contas?.nome || "Conta",
      valor: Number(r.valor),
      diaMes: r.dia_mes,
      diasAte: r.dia_mes >= hojeDia ? r.dia_mes - hojeDia : r.dia_mes - hojeDia + 30,
    }))
    .sort((a, b) => a.diasAte - b.diasAte)
    .slice(0, limite)
    .map(({ id, descricao, valor, diaMes }) => ({ id, descricao, valor, diaMes }));
}

export type DiaComGasto = { dia: number; total: number };

/**
 * Total de despesas por dia dentro de um mês, mais os dias em que
 * alguma recorrência ativa vence — usado pelo calendário de gastos.
 */
export async function buscarCalendarioGastos(
  supabase: ReturnType<typeof createClient>,
  anoMesISO: string, // "AAAA-MM"
  idsContasJaBuscadas?: string[]
): Promise<{ gastosPorDia: DiaComGasto[]; diasComContaAPagar: number[] }> {
  const [ano, mes] = anoMesISO.split("-").map(Number);
  const inicio = `${anoMesISO}-01`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const fim = `${anoMesISO}-${String(ultimoDia).padStart(2, "0")}`;

  // Se quem chamou já tinha buscado as contas (é o caso mais comum,
  // vindo da própria tela de Finanças), reaproveita — evita repetir a
  // mesma consulta ao banco.
  let idsContas = idsContasJaBuscadas;
  if (!idsContas) {
    const { data: contas } = await supabase.from("financa_contas").select("id").eq("arquivado", false);
    idsContas = (contas ?? []).map((c) => c.id);
  }

  const { data: transacoes } = idsContas.length
    ? await supabase
        .from("financa_transacoes")
        .select("data, valor")
        .eq("tipo", "despesa")
        .in("conta_id", idsContas)
        .gte("data", inicio)
        .lte("data", fim)
    : { data: [] as { data: string; valor: number }[] };

  const totalPorDia = new Map<number, number>();
  for (const t of transacoes ?? []) {
    const dia = Number(t.data.slice(8, 10));
    totalPorDia.set(dia, (totalPorDia.get(dia) ?? 0) + Number(t.valor));
  }

  const { data: recorrencias } = await supabase
    .from("financa_recorrencias")
    .select("dia_mes")
    .eq("ativo", true)
    .eq("tipo", "despesa")
    .lte("dia_mes", ultimoDia);

  const diasComContaAPagar = Array.from(new Set((recorrencias ?? []).map((r) => r.dia_mes)));

  return {
    gastosPorDia: Array.from(totalPorDia.entries()).map(([dia, total]) => ({ dia, total })),
    diasComContaAPagar,
  };
}
