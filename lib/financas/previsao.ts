// Etapa 215 — previsão até o fim do mês: saldo de hoje + o que ainda
// vai entrar/sair (agendados, recorrentes que ainda não viraram
// lançamento e faturas de cartão que vencem no mês). Função pura.
import { calcularPeriodoFatura, calcularVencimentoFatura, periodoFaturaAdjacente } from "@/lib/financas/fatura";

export type ItemPrevisto = {
  data: string;
  descricao: string;
  valor: number; // sempre positivo
  tipo: "receita" | "despesa";
  origem: "agendado" | "recorrente" | "fatura";
};

export type PrevisaoMes = {
  saldoHoje: number;
  entradas: number;
  saidas: number;
  sobra: number;
  diasRestantes: number;
  /** quanto dá pra gastar por dia (livre) sem ficar no vermelho; null se sobra <= 0 */
  porDia: number | null;
  /** primeiro dia em que o saldo fica negativo, se ficar */
  diaNegativo: string | null;
  itens: ItemPrevisto[];
};

type Conta = { id: string; nome: string; tipo: string; saldo?: number | string; dia_fechamento?: number | null; dia_vencimento?: number | null };
type Transacao = {
  id?: string;
  conta_id: string;
  tipo: string;
  valor: number | string;
  data: string;
  descricao?: string | null;
  pago_em?: string | null;
  recorrencia_id?: string | null;
  transferencia_grupo?: string | null;
};
type Recorrencia = {
  id: string;
  conta_id: string;
  tipo: string;
  valor: number | string;
  dia_mes: number;
  data_fim: string | null;
  data_inicio?: string | null;
  ativo: boolean;
  descricao: string | null;
};

export function ultimoDiaISO(iso: string): string {
  const [a, m] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return `${iso.slice(0, 7)}-${String(d).padStart(2, "0")}`;
}

function diasEntre(aISO: string, bISO: string) {
  const [a1, m1, d1] = aISO.split("-").map(Number);
  const [a2, m2, d2] = bISO.split("-").map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
}

export const ehContaComum = (c: { tipo: string }) => c.tipo !== "investimento" && c.tipo !== "cartao";

/**
 * Fatura de um cartão: total (compras − estornos) do período, menos o
 * que já foi pago depois do fechamento. Pagamento = receita na conta do
 * cartão (a transferência do banco pro cartão).
 */
export function resumoFatura(
  conta: Conta,
  transacoes: Transacao[],
  periodo: { inicio: string; fim: string }
): { total: number; pago: number; aPagar: number; vencimento: string | null } {
  let total = 0;
  let pago = 0;
  for (const t of transacoes) {
    if (t.conta_id !== conta.id) continue;
    const noPeriodo = t.data >= periodo.inicio && t.data <= periodo.fim;
    if (t.tipo === "despesa") {
      if (noPeriodo) total += Number(t.valor);
    } else if (t.transferencia_grupo) {
      // pagamento (transferência do banco pro cartão) feito depois do fechamento
      if (t.data > periodo.fim) pago += Number(t.valor);
    } else if (noPeriodo) {
      // estorno/crédito dentro do período abate da fatura
      total -= Number(t.valor);
    }
  }
  const vencimento = conta.dia_vencimento ? calcularVencimentoFatura(conta.dia_vencimento, periodo.fim) : null;
  const r2 = (n: number) => Math.round(n * 100) / 100;
  total = r2(Math.max(0, total));
  pago = r2(pago);
  return { total, pago, aPagar: Math.max(0, r2(total - pago)), vencimento };
}

/** Faturas (fechada e aberta) de cada cartão com vencimento entre (desde, ate]. */
export function faturasVencendo(contas: Conta[], transacoes: Transacao[], desdeISO: string, ateISO: string) {
  const saida: { conta: Conta; valor: number; vencimento: string; fechada: boolean }[] = [];
  for (const c of contas) {
    if (c.tipo !== "cartao" || !c.dia_fechamento || !c.dia_vencimento) continue;
    const aberta = calcularPeriodoFatura(c.dia_fechamento, desdeISO);
    const fechada = periodoFaturaAdjacente(c.dia_fechamento, aberta.fim, -1);
    for (const [periodo, ehFechada] of [
      [fechada, true],
      [aberta, false],
    ] as const) {
      const r = resumoFatura(c, transacoes, periodo);
      if (!r.vencimento || r.vencimento <= desdeISO || r.vencimento > ateISO) continue;
      if (r.aPagar <= 0) continue;
      saida.push({ conta: c, valor: r.aPagar, vencimento: r.vencimento, fechada: ehFechada });
    }
  }
  return saida;
}

export function preverFimDoMes(entrada: {
  contas: Conta[];
  transacoes: Transacao[];
  recorrencias: Recorrencia[];
  hojeISO: string;
  /** saldo de hoje nas contas comuns; se não vier, soma c.saldo */
  saldoHoje?: number;
}): PrevisaoMes {
  const { contas, transacoes, recorrencias, hojeISO } = entrada;
  const fim = ultimoDiaISO(hojeISO);
  const inicioMes = hojeISO.slice(0, 8) + "01";
  const comuns = new Set(contas.filter(ehContaComum).map((c) => c.id));
  const saldoHoje =
    entrada.saldoHoje ?? contas.filter(ehContaComum).reduce((s, c) => s + Number(c.saldo ?? 0), 0);

  const itens: ItemPrevisto[] = [];

  // 1) Lançamentos com data futura ainda não pagos
  for (const t of transacoes) {
    if (!comuns.has(t.conta_id)) continue;
    if (t.data <= hojeISO || t.data > fim || t.pago_em) continue;
    itens.push({
      data: t.data,
      descricao: t.descricao || (t.transferencia_grupo ? "Transferência" : t.tipo === "receita" ? "Receita" : "Despesa"),
      valor: Number(t.valor),
      tipo: t.tipo === "receita" ? "receita" : "despesa",
      origem: "agendado",
    });
  }

  // 2) Recorrentes que ainda não viraram lançamento neste mês
  const recorrenciasComLancamento = new Set(
    transacoes.filter((t) => t.recorrencia_id && t.data >= inicioMes && t.data <= fim).map((t) => t.recorrencia_id)
  );
  const [ano, mes] = hojeISO.split("-").map(Number);
  const ultimoDia = Number(fim.slice(8));
  for (const r of recorrencias) {
    if (!r.ativo || !comuns.has(r.conta_id)) continue;
    if (recorrenciasComLancamento.has(r.id)) continue;
    const dia = Math.min(r.dia_mes, ultimoDia);
    const data = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    if (data <= hojeISO) continue; // já deveria ter sido lançada (entra quando abrir Finanças)
    if (r.data_fim && data > r.data_fim) continue;
    if (r.data_inicio && data < r.data_inicio) continue;
    itens.push({
      data,
      descricao: r.descricao || (r.tipo === "receita" ? "Receita fixa" : "Conta fixa"),
      valor: Number(r.valor),
      tipo: r.tipo === "receita" ? "receita" : "despesa",
      origem: "recorrente",
    });
  }

  // 3) Faturas de cartão vencendo até o fim do mês (se já tem pagamento
  // agendado, a fatura aparece paga e o agendado já entrou no item 1)
  for (const f of faturasVencendo(contas, transacoes, hojeISO, fim)) {
    itens.push({
      data: f.vencimento,
      descricao: `Fatura ${f.conta.nome}${f.fechada ? "" : " (parcial)"}`,
      valor: f.valor,
      tipo: "despesa",
      origem: "fatura",
    });
  }

  itens.sort((a, b) => a.data.localeCompare(b.data) || (a.tipo === "receita" ? -1 : 1));

  let entradas = 0;
  let saidas = 0;
  let corrente = saldoHoje;
  let diaNegativo: string | null = saldoHoje < 0 ? hojeISO : null;
  for (const i of itens) {
    if (i.tipo === "receita") {
      entradas += i.valor;
      corrente += i.valor;
    } else {
      saidas += i.valor;
      corrente -= i.valor;
    }
    if (corrente < -0.004 && !diaNegativo) diaNegativo = i.data;
  }
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const sobra = r2(saldoHoje + entradas - saidas);
  const diasRestantes = diasEntre(hojeISO, fim) + 1;
  return {
    saldoHoje: r2(saldoHoje),
    entradas: r2(entradas),
    saidas: r2(saidas),
    sobra,
    diasRestantes,
    porDia: sobra > 0 ? r2(sobra / diasRestantes) : null,
    diaNegativo,
    itens,
  };
}
