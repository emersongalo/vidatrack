import { createClient } from "@/lib/supabase/server";
import { primeiroDiaDoMes } from "@/lib/financas/formatacao";

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
