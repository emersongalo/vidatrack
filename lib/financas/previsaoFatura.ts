// Etapa 362 — previsão das próximas faturas do cartão: o que já está
// lançado pra cada uma (compras, parcelas futuras) + as contas fixas do
// cartão que ainda vão entrar + (na fatura aberta) o ritmo de gastos.
import { calcularPeriodoFatura, calcularVencimentoFatura, periodoFaturaAdjacente } from "@/lib/financas/fatura";

type Conta = { id: string; dia_fechamento?: number | null; dia_vencimento?: number | null; limite?: number | string | null };
type Transacao = {
  id?: string;
  conta_id: string;
  tipo: string;
  valor: number | string;
  data: string;
  descricao?: string | null;
  transferencia_grupo?: string | null;
  parcela_grupo?: string | null;
  parcela_numero?: number | null;
  parcela_total?: number | null;
  recorrencia_id?: string | null;
};
type Recorrencia = { id: string; conta_id: string; tipo: string; valor: number | string; descricao?: string | null; dia_mes: number; ativo?: boolean | null; data_inicio?: string | null; data_fim?: string | null };

export type FaturaPrevista = {
  inicio: string;
  fim: string;
  vencimento: string | null;
  aberta: boolean;
  /** já lançado no período (compras, parcelas, estornos abatidos) */
  lancado: number;
  /** quanto disso são parcelas */
  parcelas: number;
  qtdParcelas: number;
  /** contas fixas do cartão que ainda não foram lançadas */
  fixas: { descricao: string; valor: number; data: string }[];
  totalFixas: number;
  /** lançado + fixas */
  previsto: number;
  /** só na aberta: se continuar gastando no ritmo dos últimos 90 dias */
  ritmo: number | null;
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown) => Number(v) || 0;
function diasEntre(a: string, b: string) {
  return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000);
}
function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
function meses(inicio: string, fim: string) {
  const out: string[] = [];
  let [a, m] = inicio.split("-").map(Number);
  const [af, mf] = fim.split("-").map(Number);
  while (a < af || (a === af && m <= mf)) {
    out.push(`${a}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      a++;
    }
  }
  return out;
}

export function previsaoFaturas(conta: Conta, transacoes: Transacao[], recorrencias: Recorrencia[], hoje: string, quantas = 6): FaturaPrevista[] {
  if (!conta.dia_fechamento) return [];
  const doCartao = transacoes.filter((t) => t.conta_id === conta.id && !t.transferencia_grupo);
  const fixasDoCartao = recorrencias.filter((r) => r.conta_id === conta.id && r.tipo === "despesa" && r.ativo !== false);

  // ritmo: compras avulsas (sem parcela nem conta fixa) dos últimos 90 dias
  const desde = somarDias(hoje, -90);
  const avulsas = doCartao.filter((t) => t.tipo === "despesa" && !t.parcela_grupo && !t.recorrencia_id && t.data >= desde && t.data <= hoje);
  const primeiro = avulsas.reduce((m, t) => (t.data < m ? t.data : m), hoje);
  const diasBase = Math.max(30, diasEntre(primeiro, hoje) + 1);
  const porDia = avulsas.reduce((s, t) => s + num(t.valor), 0) / diasBase;

  const saida: FaturaPrevista[] = [];
  let periodo = calcularPeriodoFatura(conta.dia_fechamento, hoje);
  for (let i = 0; i < quantas; i++) {
    const noPeriodo = doCartao.filter((t) => t.data >= periodo.inicio && t.data <= periodo.fim);
    let lancado = 0;
    let parcelas = 0;
    let qtdParcelas = 0;
    for (const t of noPeriodo) {
      const v = num(t.valor);
      if (t.tipo === "despesa") {
        lancado += v;
        if (t.parcela_grupo) {
          parcelas += v;
          qtdParcelas++;
        }
      } else lancado -= v; // estorno/crédito
    }
    const fixas: FaturaPrevista["fixas"] = [];
    for (const r of fixasDoCartao) {
      for (const mes of meses(periodo.inicio, periodo.fim)) {
        const data = `${mes}-${String(Math.min(28, Number(r.dia_mes) || 1)).padStart(2, "0")}`;
        if (data < periodo.inicio || data > periodo.fim) continue;
        if ((r.data_inicio && data < r.data_inicio) || (r.data_fim && data > r.data_fim)) continue;
        if (doCartao.some((t) => t.recorrencia_id === r.id && t.data.startsWith(mes))) continue; // já lançada
        fixas.push({ descricao: r.descricao || "Conta fixa", valor: num(r.valor), data });
      }
    }
    const totalFixas = fixas.reduce((s, f) => s + f.valor, 0);
    const aberta = i === 0;
    const restantes = aberta ? Math.max(0, diasEntre(hoje, periodo.fim)) : 0;
    const previsto = Math.max(0, lancado) + totalFixas;
    saida.push({
      inicio: periodo.inicio,
      fim: periodo.fim,
      vencimento: conta.dia_vencimento ? calcularVencimentoFatura(conta.dia_vencimento, periodo.fim) : null,
      aberta,
      lancado: r2(Math.max(0, lancado)),
      parcelas: r2(parcelas),
      qtdParcelas,
      fixas,
      totalFixas: r2(totalFixas),
      previsto: r2(previsto),
      ritmo: aberta && porDia > 0 && restantes > 0 ? r2(previsto + porDia * restantes) : null,
    });
    periodo = periodoFaturaAdjacente(conta.dia_fechamento, periodo.fim, 1);
  }
  return saida;
}
