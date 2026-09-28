// Etapa 215 — alertas automáticos a partir do histórico:
//  - gasto fora do normal numa categoria (mês atual x média dos 3 anteriores)
//  - cobranças que se repetem todo mês e ainda não estão em Recorrentes
import { normalizarTexto } from "@/lib/financas/sugestaoCategoria";

type Transacao = {
  id?: string;
  conta_id: string;
  categoria_id?: string | null;
  tipo: string;
  valor: number | string;
  data: string;
  descricao?: string | null;
  recorrencia_id?: string | null;
  parcela_grupo?: string | null;
  transferencia_grupo?: string | null;
};

export type GastoForaDoNormal = {
  categoriaId: string;
  gastoMes: number;
  media: number;
  percentualAcima: number;
};

function mesMenos(anoMes: string, n: number): string {
  const [a, m] = anoMes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 - n, 1));
  return d.toISOString().slice(0, 7);
}

export function gastosForaDoNormal(
  transacoes: Transacao[],
  hojeISO: string,
  opcoes: { minimoPercentual?: number; minimoValor?: number } = {}
): GastoForaDoNormal[] {
  const minimoPercentual = opcoes.minimoPercentual ?? 30;
  const minimoValor = opcoes.minimoValor ?? 50;
  const mesAtual = hojeISO.slice(0, 7);
  const anteriores = [1, 2, 3].map((n) => mesMenos(mesAtual, n));

  const porCatMes = new Map<string, Map<string, number>>();
  for (const t of transacoes) {
    if (t.tipo !== "despesa" || !t.categoria_id || t.transferencia_grupo) continue;
    if (t.data > hojeISO) continue; // agendado ainda não é gasto
    const mes = t.data.slice(0, 7);
    if (mes !== mesAtual && !anteriores.includes(mes)) continue;
    if (!porCatMes.has(t.categoria_id)) porCatMes.set(t.categoria_id, new Map());
    const m = porCatMes.get(t.categoria_id)!;
    m.set(mes, (m.get(mes) ?? 0) + Number(t.valor));
  }

  const saida: GastoForaDoNormal[] = [];
  for (const [categoriaId, meses] of porCatMes) {
    const historico = anteriores.map((m) => meses.get(m)).filter((v): v is number => v !== undefined);
    if (historico.length < 2) continue; // pouco histórico: não dá pra dizer o que é "normal"
    const media = historico.reduce((s, v) => s + v, 0) / historico.length;
    const gastoMes = meses.get(mesAtual) ?? 0;
    if (media <= 0 || gastoMes - media < minimoValor) continue;
    const percentualAcima = Math.round(((gastoMes - media) / media) * 100);
    if (percentualAcima < minimoPercentual) continue;
    saida.push({ categoriaId, gastoMes: Math.round(gastoMes * 100) / 100, media: Math.round(media * 100) / 100, percentualAcima });
  }
  return saida.sort((a, b) => b.gastoMes - b.media - (a.gastoMes - a.media));
}

export type AssinaturaSugerida = {
  chave: string;
  descricao: string;
  valorMedio: number;
  diaMes: number;
  contaId: string;
  categoriaId: string | null;
  meses: number;
  /** já teve cobrança neste mês */
  cobradaEsteMes: boolean;
};

/**
 * Despesa com a mesma descrição, valor parecido (±15%), em pelo menos 3
 * meses diferentes dos últimos 4 — e que não é recorrente, parcela nem
 * transferência — vira sugestão de "cadastrar como recorrente".
 */
export function assinaturasNaoCadastradas(
  transacoes: Transacao[],
  recorrencias: { descricao: string | null; ativo: boolean }[],
  hojeISO: string
): AssinaturaSugerida[] {
  const mesAtual = hojeISO.slice(0, 7);
  const janela = [0, 1, 2, 3].map((n) => mesMenos(mesAtual, n));
  const jaCadastradas = new Set(recorrencias.filter((r) => r.ativo).map((r) => normalizarTexto(r.descricao)));

  const grupos = new Map<string, Transacao[]>();
  for (const t of transacoes) {
    if (t.tipo !== "despesa" || t.recorrencia_id || t.parcela_grupo || t.transferencia_grupo) continue;
    if (t.data > hojeISO || !janela.includes(t.data.slice(0, 7))) continue;
    const chave = normalizarTexto(t.descricao);
    if (chave.length < 3) continue;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(t);
  }

  const saida: AssinaturaSugerida[] = [];
  for (const [chave, lista] of grupos) {
    if (jaCadastradas.has(chave)) continue;
    const meses = new Set(lista.map((t) => t.data.slice(0, 7)));
    if (meses.size < 3) continue;
    // mais de 2 lançamentos no mesmo mês = gasto do dia a dia (ex: padaria), não assinatura
    const porMes = new Map<string, number>();
    for (const t of lista) porMes.set(t.data.slice(0, 7), (porMes.get(t.data.slice(0, 7)) ?? 0) + 1);
    if ([...porMes.values()].some((n) => n > 1)) continue;
    const valores = lista.map((t) => Number(t.valor));
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    if (min <= 0 || max / min > 1.15) continue;
    const recente = [...lista].sort((a, b) => b.data.localeCompare(a.data))[0];
    const dias = lista.map((t) => Number(t.data.slice(8, 10))).sort((a, b) => a - b);
    saida.push({
      chave,
      descricao: recente.descricao ?? chave,
      valorMedio: Math.round((valores.reduce((s, v) => s + v, 0) / valores.length) * 100) / 100,
      diaMes: Math.min(28, dias[Math.floor(dias.length / 2)]),
      contaId: recente.conta_id,
      categoriaId: recente.categoria_id ?? null,
      meses: meses.size,
      cobradaEsteMes: meses.has(mesAtual),
    });
  }
  return saida.sort((a, b) => b.valorMedio - a.valorMedio);
}

/** Primeira data em que a recorrência sugerida deve começar (sem duplicar o mês já cobrado). */
export function inicioDaRecorrenciaSugerida(s: AssinaturaSugerida, hojeISO: string): string {
  const [a, m, d] = hojeISO.split("-").map(Number);
  const iso = (ano: number, mes: number) => `${ano}-${String(mes).padStart(2, "0")}-${String(s.diaMes).padStart(2, "0")}`;
  if (!s.cobradaEsteMes && s.diaMes >= d) return iso(a, m);
  return m === 12 ? iso(a + 1, 1) : iso(a, m + 1);
}
