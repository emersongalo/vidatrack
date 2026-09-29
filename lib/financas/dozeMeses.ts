// Etapa 220 — receitas x despesas dos últimos 12 meses (só o que já aconteceu)
export function resumoDozeMeses(
  contas: { id: string; tipo: string }[],
  transacoes: { conta_id: string; tipo: string; valor: number | string; data: string; transferencia_grupo?: string | null; pago_em?: string | null }[],
  hojeISO: string,
  quantidade = 12
) {
  const investimento = new Set(contas.filter((c) => c.tipo === "investimento").map((c) => c.id));
  const [a, m] = hojeISO.split("-").map(Number);
  const meses = Array.from({ length: quantidade }, (_, i) => {
    const d = new Date(Date.UTC(a, m - 1 - (quantidade - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
  const mapa = new Map(meses.map((mes) => [mes, { mes, receitas: 0, despesas: 0 }]));
  for (const t of transacoes) {
    if (t.transferencia_grupo || investimento.has(t.conta_id)) continue;
    if (t.data > hojeISO && !t.pago_em) continue;
    const g = mapa.get(t.data.slice(0, 7));
    if (!g) continue;
    if (t.tipo === "receita") g.receitas += Number(t.valor);
    else g.despesas += Number(t.valor);
  }
  return meses.map((mes) => {
    const g = mapa.get(mes)!;
    const r = Math.round(g.receitas * 100) / 100;
    const d = Math.round(g.despesas * 100) / 100;
    return { mes, receitas: r, despesas: d, sobra: Math.round((r - d) * 100) / 100 };
  });
}
