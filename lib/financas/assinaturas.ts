// Etapa 221 — assinaturas detectadas: gastos com a mesma descrição e
// valor parecido que aparecem todo mês (streaming, academia, app…).
// Nada é gravado: é tudo calculado dos lançamentos que já existem.
import { normalizarTexto } from "@/lib/financas/sugestaoCategoria";

type Transacao = {
  conta_id: string;
  tipo: string;
  valor: number | string;
  data: string;
  descricao?: string | null;
  recorrencia_id?: string | null;
  transferencia_grupo?: string | null;
  parcela_grupo?: string | null;
};
type Recorrencia = { descricao: string | null; ativo: boolean };

export type Assinatura = {
  chave: string;
  descricao: string;
  valorAtual: number;
  valorAnual: number;
  meses: number;
  diaTipico: number;
  ultimaData: string;
  /** subiu de preço na última cobrança */
  aumento: { de: number; para: number; pct: number } | null;
  /** já está cadastrada como conta fixa */
  jaEhContaFixa: boolean;
};

/** Chave pra agrupar: sem acento, sem números (datas, parcelas, códigos) e sem palavras de banco. */
export function chaveAssinatura(descricao: string): string {
  return normalizarTexto(descricao)
    .replace(/\d+/g, " ")
    .replace(/\b(compra|pagamento|pag|pgto|debito|deb|credito|cartao|visa|master|mastercard|elo|pix|www|com|br|ltda|sa)\b/g, " ")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mesesAtras(hojeISO: string, n: number): string {
  const [a, m] = hojeISO.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 - n, 1));
  return d.toISOString().slice(0, 7);
}

function mediana(v: number[]): number {
  const s = [...v].sort((a, b) => a - b);
  const meio = Math.floor(s.length / 2);
  return s.length % 2 ? s[meio] : (s[meio - 1] + s[meio]) / 2;
}

export function detectarAssinaturas(transacoes: Transacao[], recorrencias: Recorrencia[], hojeISO: string): Assinatura[] {
  const inicio = mesesAtras(hojeISO, 5) + "-01"; // mês atual + 5 anteriores
  const grupos = new Map<string, { descricao: string; porMes: Map<string, { valor: number; data: string }> }>();

  for (const t of transacoes) {
    if (t.tipo !== "despesa" || t.transferencia_grupo || t.recorrencia_id || t.parcela_grupo) continue;
    if (t.data < inicio || t.data > hojeISO || !t.descricao) continue;
    const chave = chaveAssinatura(t.descricao);
    if (chave.length < 3) continue;
    let g = grupos.get(chave);
    if (!g) grupos.set(chave, (g = { descricao: t.descricao.trim(), porMes: new Map() }));
    const mes = t.data.slice(0, 7);
    const atual = g.porMes.get(mes);
    // duas cobranças no mesmo mês com a mesma descrição = provavelmente não é assinatura; marca com NaN
    if (atual) g.porMes.set(mes, { valor: NaN, data: t.data });
    else g.porMes.set(mes, { valor: Number(t.valor), data: t.data });
  }

  const fixas = new Set(recorrencias.filter((r) => r.ativo && r.descricao).map((r) => chaveAssinatura(r.descricao!)));
  const saida: Assinatura[] = [];

  for (const [chave, g] of grupos) {
    const meses = [...g.porMes.entries()].sort(([a], [b]) => a.localeCompare(b));
    if (meses.length < 3) continue;
    if (meses.some(([, v]) => Number.isNaN(v.valor))) continue;
    // precisa ter aparecido em pelo menos 3 dos últimos 4 meses (senão é compra de vez em quando)
    const recentes = meses.filter(([m]) => m >= mesesAtras(hojeISO, 3));
    if (recentes.length < 3) continue;
    const valores = meses.map(([, v]) => v.valor);
    const med = mediana(valores);
    // valores muito diferentes entre si = gasto variável (mercado, gasolina), não assinatura
    if (valores.some((v) => Math.abs(v - med) > med * 0.25)) continue;

    const [, ultimo] = meses[meses.length - 1];
    const [, penultimo] = meses[meses.length - 2];
    const pct = penultimo.valor > 0 ? ((ultimo.valor - penultimo.valor) / penultimo.valor) * 100 : 0;
    const dias = meses.map(([, v]) => Number(v.data.slice(8, 10)));

    saida.push({
      chave,
      descricao: g.descricao,
      valorAtual: ultimo.valor,
      valorAnual: Math.round(ultimo.valor * 12 * 100) / 100,
      meses: meses.length,
      diaTipico: Math.round(mediana(dias)),
      ultimaData: ultimo.data,
      aumento: pct >= 3 ? { de: penultimo.valor, para: ultimo.valor, pct: Math.round(pct) } : null,
      jaEhContaFixa: fixas.has(chave),
    });
  }

  return saida.sort((a, b) => b.valorAtual - a.valorAtual);
}
