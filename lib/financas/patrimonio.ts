export type PontoPatrimonio = { mes: string; patrimonio: number };

type ContaBasica = { id: string; saldo_inicial: number };
type TransacaoBasica = { conta_id: string; tipo: "receita" | "despesa"; valor: number; data: string };

/**
 * Calcula o patrimônio líquido total (soma de TODAS as contas,
 * incluindo investimento — aqui é "tudo que você tem", diferente do
 * "saldo disponível" da tela principal) no fim de cada um dos
 * últimos N meses.
 */
export function calcularPatrimonioPorMes(
  contas: ContaBasica[],
  transacoes: TransacaoBasica[],
  quantidadeMeses: number,
  hojeISO: string
): PontoPatrimonio[] {
  const hoje = new Date(hojeISO + "T00:00:00");
  const pontos: PontoPatrimonio[] = [];

  for (let i = quantidadeMeses - 1; i >= 0; i--) {
    const dataRef = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const fimDoMes = new Date(dataRef.getFullYear(), dataRef.getMonth() + 1, 0);
    const dataCorte = fimDoMes < hoje ? fimDoMes : hoje;
    const dataCorteISO = dataCorte.toLocaleDateString("sv-SE");

    let total = 0;
    for (const conta of contas) {
      const movimentacoes = transacoes
        .filter((t) => t.conta_id === conta.id && t.data <= dataCorteISO)
        .reduce((soma, t) => soma + (t.tipo === "receita" ? t.valor : -t.valor), 0);
      total += Number(conta.saldo_inicial) + movimentacoes;
    }

    pontos.push({
      mes: dataRef.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      patrimonio: Math.round(total * 100) / 100,
    });
  }

  return pontos;
}
