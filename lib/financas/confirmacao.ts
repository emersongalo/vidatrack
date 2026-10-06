// Etapa 268 — receita programada (salário, aluguel que recebe, fixa ou
// agendada) não entra mais no saldo sozinha no dia: fica "aguardando
// confirmação" até a pessoa dizer que caiu (ou adiar, se atrasou).
// Etapa 270 — o mesmo vale pra DESPESA programada (conta fixa ou
// agendada): só sai do saldo quando a pessoa toca em "Paguei".
// Não vale pra cartão de crédito (a compra vai pra fatura) nem pra
// conta de investimento. O que já tinha passado antes continua igual.
export const INICIO_CONFIRMACAO = "2026-10-06";
export const INICIO_CONFIRMACAO_DESPESA = "2026-10-06";

type T = {
  tipo: string;
  data?: string | null;
  pago_em?: string | null;
  transferencia_grupo?: string | null;
  recorrencia_id?: string | null;
  criado_em?: string | null;
  /** Etapa 270 — tipo da conta (vem junto no retrato do aparelho) */
  conta_tipo?: string | null;
};

function programada(t: T) {
  return !!t.recorrencia_id || (!!t.criado_em && !!t.data && String(t.criado_em).slice(0, 10) < t.data);
}

/** Receita programada cuja data já chegou e ninguém confirmou ainda. */
export function receitaAguardando(t: T, hoje: string): boolean {
  if (t.tipo !== "receita" || t.pago_em || t.transferencia_grupo || !t.data) return false;
  if (t.data > hoje || t.data < INICIO_CONFIRMACAO) return false;
  if (t.conta_tipo === "cartao" || t.conta_tipo === "investimento") return false;
  return programada(t);
}

/** Etapa 270 — despesa programada que venceu e ninguém marcou "Paguei". */
export function despesaAguardando(t: T, hoje: string, tipoConta?: string | null): boolean {
  if (t.tipo !== "despesa" || t.pago_em || t.transferencia_grupo || !t.data) return false;
  if (t.data > hoje || t.data < INICIO_CONFIRMACAO_DESPESA) return false;
  const tipo = tipoConta ?? t.conta_tipo;
  if (tipo === "cartao" || tipo === "investimento") return false;
  // sem saber o tipo da conta, não arrisca (pode ser compra no cartão)
  if (!tipo) return false;
  return programada(t);
}

/** Receita ou despesa esperando a pessoa confirmar. */
export function aguardandoConfirmacao(t: T, hoje: string, tipoConta?: string | null): boolean {
  if (tipoConta === "cartao" || tipoConta === "investimento") return false;
  return receitaAguardando(t, hoje) || despesaAguardando(t, hoje, tipoConta);
}

/** "amanhã", "+2 dias"… → data ISO */
export function somarDiasISO(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
