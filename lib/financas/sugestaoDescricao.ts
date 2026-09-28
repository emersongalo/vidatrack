// Etapa 217 — completar a descrição com o que você já costuma lançar
// ("lave" → "Lavagem do carro"), trazendo junto categoria e último valor.
import { normalizarTexto } from "@/lib/financas/sugestaoCategoria";

export type DescricaoSugerida = {
  descricao: string;
  categoriaId: string | null;
  contaId: string | null;
  ultimoValor: number;
  vezes: number;
  ultimaData: string;
};

type Transacao = {
  tipo: string;
  descricao?: string | null;
  categoria_id?: string | null;
  conta_id?: string | null;
  valor: number | string;
  data: string;
  transferencia_grupo?: string | null;
  parcela_grupo?: string | null;
};

function agrupar(historico: Transacao[], tipo: string): Map<string, DescricaoSugerida> {
  const grupos = new Map<string, DescricaoSugerida>();
  // mais recentes primeiro: o texto/categoria/valor do grupo é o do último lançamento
  const ordenadas = historico
    .filter((t) => t.tipo === tipo && t.descricao && !t.transferencia_grupo && !t.parcela_grupo)
    .sort((a, b) => b.data.localeCompare(a.data));
  for (const t of ordenadas) {
    const chave = normalizarTexto(t.descricao);
    if (chave.length < 2) continue;
    const g = grupos.get(chave);
    if (g) {
      g.vezes++;
      if (!g.categoriaId && t.categoria_id) g.categoriaId = t.categoria_id;
    } else {
      grupos.set(chave, {
        descricao: String(t.descricao).trim(),
        categoriaId: t.categoria_id ?? null,
        contaId: t.conta_id ?? null,
        ultimoValor: Number(t.valor),
        vezes: 1,
        ultimaData: t.data,
      });
    }
  }
  return grupos;
}

function quaseComeca(palavra: string, q: string): boolean {
  if (palavra.length < q.length) return false;
  let diferentes = 0;
  for (let i = 0; i < q.length; i++) if (palavra[i] !== q[i] && ++diferentes > 1) return false;
  return palavra[0] === q[0];
}

/** Descrições que começam (ou têm uma palavra que começa) com o que foi digitado. */
export function sugerirDescricoes(texto: string, tipo: string, historico: Transacao[], limite = 4): DescricaoSugerida[] {
  const q = normalizarTexto(texto);
  if (q.length < 2) return [];
  const grupos = agrupar(historico, tipo);
  const saida: { s: DescricaoSugerida; pontos: number }[] = [];
  for (const [chave, s] of grupos) {
    if (chave === q) continue; // já digitou tudo
    let pontos = 0;
    if (chave.startsWith(q)) pontos = 3;
    else if (chave.split(" ").some((p) => p.startsWith(q))) pontos = 2;
    else if (q.length >= 3 && chave.includes(q)) pontos = 1;
    // tolera 1 letra diferente no começo de uma palavra ("lave" → "lavagem")
    else if (q.length >= 4 && chave.split(" ").some((p) => quaseComeca(p, q))) pontos = 1;
    if (!pontos) continue;
    saida.push({ s, pontos });
  }
  return saida
    .sort((a, b) => b.pontos - a.pontos || b.s.vezes - a.s.vezes || b.s.ultimaData.localeCompare(a.s.ultimaData))
    .slice(0, limite)
    .map((x) => x.s);
}

/** Os lançamentos que mais se repetem nos últimos 90 dias (pra tocar sem digitar nada). */
export function descricoesFrequentes(tipo: string, historico: Transacao[], hojeISO: string, limite = 4): DescricaoSugerida[] {
  const [a, m, d] = hojeISO.split("-").map(Number);
  const desde = new Date(Date.UTC(a, m - 1, d - 90)).toISOString().slice(0, 10);
  const grupos = agrupar(
    historico.filter((t) => t.data >= desde && t.data <= hojeISO),
    tipo
  );
  return [...grupos.values()]
    .filter((s) => s.vezes >= 2)
    .sort((x, y) => y.vezes - x.vezes || y.ultimaData.localeCompare(x.ultimaData))
    .slice(0, limite);
}
