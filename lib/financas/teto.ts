// Etapa 220 — teto de gastos do mês (um limite geral, além dos por categoria)
type Conta = { id: string; tipo: string };
type Transacao = { conta_id: string; tipo: string; valor: number | string; data: string; transferencia_grupo?: string | null; pago_em?: string | null };

/** Gasto do mês até hoje: despesas (inclusive no cartão), sem transferências nem investimento. */
export function gastoDoMes(contas: Conta[], transacoes: Transacao[], hojeISO: string): number {
  const investimento = new Set(contas.filter((c) => c.tipo === "investimento").map((c) => c.id));
  const mes = hojeISO.slice(0, 7);
  const total = transacoes
    .filter(
      (t) =>
        t.tipo === "despesa" &&
        !t.transferencia_grupo &&
        !investimento.has(t.conta_id) &&
        t.data.startsWith(mes) &&
        (t.data <= hojeISO || !!t.pago_em)
    )
    .reduce((s, t) => s + Number(t.valor), 0);
  return Math.round(total * 100) / 100;
}

export function situacaoTeto(gasto: number, teto: number, hojeISO: string) {
  const [a, m, d] = hojeISO.split("-").map(Number);
  const diasNoMes = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const pct = teto > 0 ? Math.round((gasto / teto) * 100) : 0;
  const restante = Math.round((teto - gasto) * 100) / 100;
  const diasRestantes = diasNoMes - d + 1;
  const ritmoEsperado = Math.round((teto * d) / diasNoMes);
  return {
    pct,
    restante,
    porDia: restante > 0 ? Math.round((restante / diasRestantes) * 100) / 100 : 0,
    estourou: gasto > teto,
    acimaDoRitmo: gasto > ritmoEsperado * 1.1,
  };
}
