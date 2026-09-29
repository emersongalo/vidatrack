// Etapa 221 — orçamento em envelopes: cada categoria com limite do mês
// vira um "envelope". Se a pessoa liga "guardar a sobra", o que não foi
// gasto num mês passa pro seguinte (e o que estourou, desconta).
// `envelope_desde` = primeiro dia do mês em que o acúmulo começou
// (null = não acumula). `sobra_enviada_mes` = mês ("YYYY-MM") cuja
// sobra já foi mandada pra uma meta.

type Categoria = {
  id: string;
  nome: string;
  tipo: string;
  meta_mensal?: number | string | null;
  envelope_desde?: string | null;
  sobra_enviada_mes?: string | null;
};
type Conta = { id: string; tipo: string };
type Transacao = {
  conta_id: string;
  categoria_id?: string | null;
  tipo: string;
  valor: number | string;
  data: string;
  transferencia_grupo?: string | null;
  pago_em?: string | null;
};

export function mesAnterior(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
}
function proximoMes(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, "0")}`;
}
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Quanto foi gasto numa categoria num mês (sem transferência, sem investimento, sem futuro não pago). */
export function gastoCategoriaNoMes(
  categoriaId: string,
  contas: Conta[],
  transacoes: Transacao[],
  mes: string,
  hojeISO: string
): number {
  const investimento = new Set(contas.filter((c) => c.tipo === "investimento").map((c) => c.id));
  let total = 0;
  for (const t of transacoes) {
    if (t.categoria_id !== categoriaId || t.tipo !== "despesa" || t.transferencia_grupo) continue;
    if (investimento.has(t.conta_id) || !t.data.startsWith(mes)) continue;
    if (t.data > hojeISO && !t.pago_em) continue;
    total += Number(t.valor);
  }
  return r2(total);
}

export type Envelope = {
  categoriaId: string;
  nome: string;
  meta: number;
  acumula: boolean;
  /** sobra (ou estouro, se negativo) trazida dos meses anteriores */
  trazido: number;
  disponivel: number;
  gasto: number;
  restante: number;
  pct: number;
  /** sobra do mês passado que ainda pode ir pra uma meta (0 se já foi ou não sobrou) */
  sobraParaMeta: number;
};

export function calcularEnvelope(cat: Categoria, contas: Conta[], transacoes: Transacao[], hojeISO: string): Envelope {
  const meta = Number(cat.meta_mensal) || 0;
  const mesAtual = hojeISO.slice(0, 7);
  const passado = mesAnterior(mesAtual);
  const acumula = !!cat.envelope_desde && cat.envelope_desde.slice(0, 7) <= mesAtual;

  let trazido = 0;
  if (acumula) {
    // no máximo 24 meses pra trás (o retrato local guarda ~13 meses de lançamentos)
    let mes = cat.envelope_desde!.slice(0, 7);
    let passos = 0;
    while (mes < mesAtual && passos < 24) {
      trazido += meta - gastoCategoriaNoMes(cat.id, contas, transacoes, mes, hojeISO);
      mes = proximoMes(mes);
      passos++;
    }
  }
  trazido = r2(trazido);

  const gasto = gastoCategoriaNoMes(cat.id, contas, transacoes, mesAtual, hojeISO);
  const disponivel = r2(meta + trazido);
  const restante = r2(disponivel - gasto);

  let sobraParaMeta = 0;
  if (acumula) {
    sobraParaMeta = Math.max(0, trazido);
  } else if (cat.sobra_enviada_mes !== passado) {
    sobraParaMeta = Math.max(0, r2(meta - gastoCategoriaNoMes(cat.id, contas, transacoes, passado, hojeISO)));
  }

  return {
    categoriaId: cat.id,
    nome: cat.nome,
    meta,
    acumula,
    trazido,
    disponivel,
    gasto,
    restante,
    pct: disponivel > 0 ? Math.round((gasto / disponivel) * 100) : gasto > 0 ? 100 : 0,
    sobraParaMeta,
  };
}

export function calcularEnvelopes(categorias: Categoria[], contas: Conta[], transacoes: Transacao[], hojeISO: string): Envelope[] {
  return categorias
    .filter((c) => c.tipo === "despesa" && Number(c.meta_mensal) > 0)
    .map((c) => calcularEnvelope(c, contas, transacoes, hojeISO))
    .sort((a, b) => b.pct - a.pct);
}

/**
 * O que gravar na categoria depois de mandar a sobra pra uma meta:
 * quem acumula recomeça o acúmulo neste mês; quem não acumula marca o
 * mês passado como "já enviado".
 */
export function alteracaoAposEnviarSobra(env: Envelope, hojeISO: string): { envelope_desde?: string; sobra_enviada_mes?: string } {
  return env.acumula
    ? { envelope_desde: hojeISO.slice(0, 7) + "-01" }
    : { sobra_enviada_mes: mesAnterior(hojeISO.slice(0, 7)) };
}
