// Etapa 237 — cartão de crédito não é "saldo": mostra o que foi gasto na
// fatura aberta e qual a próxima fatura a pagar (com o vencimento).
import { calcularPeriodoFatura, periodoFaturaAdjacente } from "@/lib/financas/fatura";
import { resumoFatura } from "@/lib/financas/previsao";

type Conta = { id: string; tipo: string; saldo?: number | string; dia_fechamento?: number | null; dia_vencimento?: number | null };
type Transacao = { conta_id: string; tipo: string; valor: number | string; data: string; transferencia_grupo?: string | null };

export type ResumoCartao = {
  /** gasto na fatura que ainda está aberta */
  faturaAberta: number;
  /** a próxima a pagar: a fechada (se ainda falta pagar) ou a aberta */
  proxima: { valor: number; vencimento: string | null; fechada: boolean } | null;
  /** tudo que está devendo no cartão (todas as faturas) */
  devendo: number;
  configurado: boolean;
};

export function resumoCartao(c: Conta, transacoes: Transacao[], hoje: string): ResumoCartao {
  const devendo = Math.max(0, Math.round(-Number(c.saldo ?? 0) * 100) / 100);
  if (!c.dia_fechamento) return { faturaAberta: devendo, proxima: null, devendo, configurado: false };
  const aberta = calcularPeriodoFatura(c.dia_fechamento, hoje);
  const fechada = periodoFaturaAdjacente(c.dia_fechamento, aberta.fim, -1);
  const doCartao = transacoes.filter((t) => t.conta_id === c.id);
  const rAberta = resumoFatura(c as any, doCartao as any, aberta);
  const rFechada = resumoFatura(c as any, doCartao as any, fechada);
  const proxima =
    rFechada.aPagar > 0 && (!rFechada.vencimento || rFechada.vencimento >= hoje)
      ? { valor: rFechada.aPagar, vencimento: rFechada.vencimento, fechada: true }
      : { valor: rAberta.aPagar, vencimento: rAberta.vencimento, fechada: false };
  return { faturaAberta: rAberta.total, proxima, devendo, configurado: true };
}

/** "vence hoje", "vence amanhã", "vence em 5 dias", "venceu dia 03/10" */
export function textoVencimento(vencimento: string | null, hoje: string): string {
  if (!vencimento) return "";
  const dias = Math.round((Date.parse(vencimento + "T12:00:00Z") - Date.parse(hoje + "T12:00:00Z")) / 86400000);
  const ddmm = `${vencimento.slice(8, 10)}/${vencimento.slice(5, 7)}`;
  if (dias < 0) return `venceu dia ${ddmm}`;
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  if (dias <= 7) return `vence em ${dias} dias (${ddmm})`;
  return `vence dia ${ddmm}`;
}
