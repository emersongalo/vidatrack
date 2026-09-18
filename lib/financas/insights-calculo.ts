import { primeiroDiaDoMes } from "@/lib/financas/formatacao";

export type CategoriaComparada = {
  nome: string;
  valor: number;
  valorMesAnterior: number;
  variacaoPercentual: number | null; // null = categoria nova (sem histórico)
};

export type MaiorGasto = {
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
} | null;

export type PontoAcumulado = { dia: number; acumulado: number };
export type OrcamentoComparado = { nome: string; orcamento: number; gasto: number };

export type InsightsFinanceiros = {
  categorias: CategoriaComparada[];
  totalDespesasMes: number;
  totalDespesasMesAnterior: number;
  maiorGasto: MaiorGasto;
  acumulado: PontoAcumulado[];
  dicas: string[];
  orcamentoComparado: OrcamentoComparado[];
};

export function mesAnteriorISO(dataISO: string): string {
  const d = new Date(dataISO + "T00:00:00");
  d.setMonth(d.getMonth() - 1);
  return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString("sv-SE");
}

export function proximoMes(dataISO: string): string {
  const d = new Date(dataISO + "T00:00:00");
  d.setMonth(d.getMonth() + 1);
  return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString("sv-SE");
}

/**
 * Etapa 128 — arquivo separado de propósito: essa conta é toda pura
 * (sem tocar no Supabase), então dá pra chamar tanto do servidor
 * quanto rodando no navegador (tela de Análise local-first). Fica
 * separado de insights.ts porque aquele arquivo importa o cliente
 * Supabase do SERVIDOR (usa cookies()), que não pode ser importado
 * dentro de um componente client — mesmo sem usar a função que
 * precisa dele, o import sozinho já quebraria.
 */
export function calcularInsightsFinanceiros(
  transacoesDespesa: { valor: number; descricao: string | null; data: string; nomeCategoria: string }[],
  categoriasComMeta: { nome: string; meta_mensal: number }[],
  mesReferenciaISO: string,
  hojeISO: string
): InsightsFinanceiros {
  const inicioMes = primeiroDiaDoMes(mesReferenciaISO);
  const inicioMesAnterior = mesAnteriorISO(inicioMes);

  const doMes = transacoesDespesa.filter((t) => t.data >= inicioMes);
  const doMesAnterior = transacoesDespesa.filter((t) => t.data >= inicioMesAnterior && t.data < inicioMes);

  const mapaAtual = new Map<string, number>();
  const mapaAnterior = new Map<string, number>();
  for (const t of doMes) {
    mapaAtual.set(t.nomeCategoria, (mapaAtual.get(t.nomeCategoria) ?? 0) + Number(t.valor));
  }
  for (const t of doMesAnterior) {
    mapaAnterior.set(t.nomeCategoria, (mapaAnterior.get(t.nomeCategoria) ?? 0) + Number(t.valor));
  }

  const nomesCategorias = new Set([...mapaAtual.keys(), ...mapaAnterior.keys()]);
  const categorias: CategoriaComparada[] = Array.from(nomesCategorias)
    .map((nome) => {
      const valor = mapaAtual.get(nome) ?? 0;
      const valorMesAnterior = mapaAnterior.get(nome) ?? 0;
      const variacaoPercentual = valorMesAnterior > 0 ? (valor - valorMesAnterior) / valorMesAnterior : null;
      return { nome, valor, valorMesAnterior, variacaoPercentual };
    })
    .filter((c) => c.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const totalDespesasMes = doMes.reduce((acc, t) => acc + Number(t.valor), 0);
  const totalDespesasMesAnterior = doMesAnterior.reduce((acc, t) => acc + Number(t.valor), 0);

  let maiorGasto: MaiorGasto = null;
  for (const t of doMes) {
    if (!maiorGasto || Number(t.valor) > maiorGasto.valor) {
      maiorGasto = {
        descricao: t.descricao || t.nomeCategoria || "Lançamento",
        categoria: t.nomeCategoria,
        valor: Number(t.valor),
        data: t.data,
      };
    }
  }

  const diasNoMes = new Date(Number(inicioMes.slice(0, 4)), Number(inicioMes.slice(5, 7)), 0).getDate();
  const gastoPorDia = new Map<number, number>();
  for (const t of doMes) {
    const dia = Number(t.data.slice(8, 10));
    gastoPorDia.set(dia, (gastoPorDia.get(dia) ?? 0) + Number(t.valor));
  }
  const acumulado: PontoAcumulado[] = [];
  let corrente = 0;
  const ehMesAtual = inicioMes === primeiroDiaDoMes(hojeISO);
  const diaLimite = ehMesAtual ? Number(hojeISO.slice(8, 10)) : diasNoMes;
  for (let dia = 1; dia <= diaLimite; dia++) {
    corrente += gastoPorDia.get(dia) ?? 0;
    acumulado.push({ dia, acumulado: Math.round(corrente * 100) / 100 });
  }

  const dicas = gerarDicas({ categorias, totalDespesasMes, totalDespesasMesAnterior, maiorGasto });

  const orcamentoComparado: OrcamentoComparado[] = categoriasComMeta.map((c) => ({
    nome: c.nome,
    orcamento: Number(c.meta_mensal),
    gasto: mapaAtual.get(c.nome) ?? 0,
  }));

  return { categorias, totalDespesasMes, totalDespesasMesAnterior, maiorGasto, acumulado, dicas, orcamentoComparado };
}

function gerarDicas(dados: {
  categorias: CategoriaComparada[];
  totalDespesasMes: number;
  totalDespesasMesAnterior: number;
  maiorGasto: MaiorGasto;
}): string[] {
  const dicas: string[] = [];
  const { categorias, totalDespesasMes, totalDespesasMesAnterior, maiorGasto } = dados;

  if (categorias.length === 0) {
    return ["Nenhuma despesa lançada neste mês ainda."];
  }

  const top = categorias[0];
  const percentualTop = totalDespesasMes > 0 ? (top.valor / totalDespesasMes) * 100 : 0;
  if (percentualTop >= 30) {
    dicas.push(
      `${top.nome} sozinha já é ${percentualTop.toFixed(0)}% de tudo que você gastou este mês. Vale um olhar mais de perto aí.`
    );
  }

  const categoriaQueMaisCresceu = categorias
    .filter((c) => c.variacaoPercentual !== null && c.variacaoPercentual > 0.2 && c.valorMesAnterior >= 20)
    .sort((a, b) => (b.variacaoPercentual ?? 0) - (a.variacaoPercentual ?? 0))[0];
  if (categoriaQueMaisCresceu) {
    dicas.push(
      `${categoriaQueMaisCresceu.nome} subiu ${(categoriaQueMaisCresceu.variacaoPercentual! * 100).toFixed(0)}% em relação ao mês passado.`
    );
  }

  if (totalDespesasMesAnterior > 0 && totalDespesasMes < totalDespesasMesAnterior) {
    const reducao = ((totalDespesasMesAnterior - totalDespesasMes) / totalDespesasMesAnterior) * 100;
    dicas.push(`Boa! Você gastou ${reducao.toFixed(0)}% a menos que no mês passado até agora.`);
  }

  if (maiorGasto && totalDespesasMes > 0 && maiorGasto.valor / totalDespesasMes >= 0.25) {
    dicas.push(
      `Seu maior gasto único do mês foi "${maiorGasto.descricao}" (${maiorGasto.categoria}) — puxou bastante o total sozinho.`
    );
  }

  if (dicas.length === 0) {
    dicas.push("Seus gastos estão distribuídos de forma equilibrada este mês. Continue assim.");
  }

  return dicas.slice(0, 4);
}
