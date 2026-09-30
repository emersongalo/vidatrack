// Etapa 228 — o assistente entendendo categorias: acha a categoria pelo
// nome (mesmo com nome repetido entre quem compartilha finanças), aceita
// erro de digitação ("supermecado" x "mercado") e monta rankings.
import { semAcento } from "@/lib/assistente/entender";

type Categoria = { id: string; nome: string; tipo: string; meta_mensal?: number | string | null };
type Transacao = {
  tipo: string;
  valor: number | string;
  data: string;
  categoria_id?: string | null;
  descricao?: string | null;
  etiquetas?: string[] | null;
  transferencia_grupo?: string | null;
  pago_em?: string | null;
  conta_id?: string;
};

/** Distância de edição (Levenshtein), parando cedo acima de `max`. */
function distancia(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    let menor = prev[0];
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
      menor = Math.min(menor, prev[j]);
    }
    if (menor > max) return max + 1;
  }
  return prev[b.length];
}

/** "supermecado" contém algo parecido com "mercado"? (1 letra de diferença a partir de 5 letras) */
export function contemParecido(textoAlvo: string, termoBruto: string): boolean {
  const alvo = semAcento(textoAlvo);
  const termo = semAcento(termoBruto).trim();
  if (!termo) return false;
  if (alvo.includes(termo)) return true;
  if (termo.length < 5) return false;
  for (const palavra of alvo.split(/[^a-z0-9]+/)) {
    if (palavra.length < termo.length - 1) continue;
    for (let tam = termo.length - 1; tam <= termo.length + 1; tam++) {
      for (let i = 0; i + tam <= palavra.length; i++) {
        if (distancia(palavra.slice(i, i + tam), termo, 1) <= 1) return true;
      }
    }
  }
  return false;
}

/**
 * Acha a categoria citada na frase. Devolve TODOS os ids com esse nome
 * (a pessoa e quem compartilha finanças com ela podem ter "Moradia" cada um).
 */
export function acharCategoria(
  frase: string,
  categorias: Categoria[],
  tipo?: "despesa" | "receita"
): { nome: string; ids: string[]; meta: number } | null {
  const texto = ` ${semAcento(frase).replace(/[^a-z0-9 ]/g, " ")} `;
  const candidatas = categorias.filter((c) => !tipo || c.tipo === tipo);
  let melhor: Categoria | null = null;
  for (const c of candidatas) {
    const nome = semAcento(c.nome).replace(/[^a-z0-9 ]/g, " ").trim();
    if (nome.length < 3) continue;
    // nome inteiro na frase, ou plural/singular ("moradias", "alimentacao")
    const bate = texto.includes(` ${nome} `) || texto.includes(` ${nome}s `) || (nome.endsWith("s") && texto.includes(` ${nome.slice(0, -1)} `));
    const parecido = !bate && nome.length >= 6 && texto.split(" ").some((p) => p.length >= 5 && distancia(p, nome, 1) <= 1);
    if ((bate || parecido) && (!melhor || nome.length > semAcento(melhor.nome).length)) melhor = c;
  }
  if (!melhor) return null;
  const chave = semAcento(melhor.nome).trim();
  const mesmas = candidatas.filter((c) => semAcento(c.nome).trim() === chave);
  return {
    nome: melhor.nome,
    ids: mesmas.map((c) => c.id),
    meta: mesmas.reduce((s, c) => s + (Number(c.meta_mensal) || 0), 0),
  };
}

/** Soma por categoria (pelo NOME, juntando categorias repetidas) num período. */
export function gastosPorCategoria(
  transacoes: Transacao[],
  categorias: Categoria[],
  inicio: string,
  fim: string,
  hoje: string,
  tipo: "despesa" | "receita" = "despesa"
): { nome: string; valor: number; qtd: number }[] {
  const nomePorId = new Map(categorias.map((c) => [c.id, c.nome]));
  const soma = new Map<string, { nome: string; valor: number; qtd: number }>();
  for (const t of transacoes) {
    if (t.tipo !== tipo || t.transferencia_grupo) continue;
    if (t.data < inicio || t.data > fim || (t.data > hoje && !t.pago_em)) continue;
    const nome = (t.categoria_id && nomePorId.get(t.categoria_id)) || "Sem categoria";
    const chave = semAcento(nome);
    const atual = soma.get(chave) ?? { nome, valor: 0, qtd: 0 };
    atual.valor += Number(t.valor);
    atual.qtd++;
    soma.set(chave, atual);
  }
  return [...soma.values()].map((x) => ({ ...x, valor: Math.round(x.valor * 100) / 100 })).sort((a, b) => b.valor - a.valor);
}
