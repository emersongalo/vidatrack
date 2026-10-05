// Etapa 268 — receita programada (salário, aluguel que recebe, fixa ou
// agendada) não entra mais no saldo sozinha no dia: fica "aguardando
// confirmação" até a pessoa dizer que caiu (ou adiar, se atrasou).
// Vale a partir de 06/10/2026 — o que já tinha caído antes continua igual.
export const INICIO_CONFIRMACAO = "2026-10-06";

type T = {
  tipo: string;
  data?: string | null;
  pago_em?: string | null;
  transferencia_grupo?: string | null;
  recorrencia_id?: string | null;
  criado_em?: string | null;
};

/** Receita programada cuja data já chegou e ninguém confirmou ainda. */
export function receitaAguardando(t: T, hoje: string): boolean {
  if (t.tipo !== "receita" || t.pago_em || t.transferencia_grupo || !t.data) return false;
  if (t.data > hoje || t.data < INICIO_CONFIRMACAO) return false;
  const programada = !!t.recorrencia_id || (!!t.criado_em && String(t.criado_em).slice(0, 10) < t.data);
  return programada;
}

/** "amanhã", "+2 dias"… → data ISO */
export function somarDiasISO(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
