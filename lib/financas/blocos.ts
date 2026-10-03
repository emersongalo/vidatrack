// Etapa 133 — ordem dos blocos da tela de Finanças, salva por login em
// perfis.ordem_blocos_financas (cada pessoa organiza do seu jeito,
// vendo os mesmos dados).
// Etapa 222 — todos os blocos da tela entram na ordem, e dá pra
// esconder um bloco: salvo com "!" na frente (ex: "!metas").
export type BlocoFinancasId =
  | "hoje"
  | "rapidos"
  | "previsao"
  | "teto"
  | "contas"
  | "orcamento"
  | "metas"
  | "atalhos"
  | "grafico"
  | "lancamentos";

export type BlocoFinancas = { id: BlocoFinancasId; visivel: boolean };

export const BLOCOS_FINANCAS_PADRAO: BlocoFinancasId[] = [
  "hoje",
  "rapidos",
  "previsao",
  "teto",
  "contas",
  "orcamento",
  "metas",
  "atalhos",
  "grafico",
  "lancamentos",
];

export const NOMES_BLOCOS_FINANCAS: Record<BlocoFinancasId, string> = {
  hoje: "👛 Quanto posso gastar hoje",
  rapidos: "⚡ Lançar rápido",
  previsao: "📈 Previsão do fim do mês",
  teto: "🎯 Teto de gastos",
  contas: "🏦 Contas e cartões",
  orcamento: "📊 Orçamento por categoria",
  metas: "🏁 Metas",
  atalhos: "💬 Assistente e Análise",
  grafico: "🥧 Gráfico por categoria",
  lancamentos: "🧾 Últimos lançamentos",
};

/**
 * Lê o que foi salvo e sempre devolve a lista completa e válida: a
 * ordem salva pros blocos que existem, e no fim (visíveis) os blocos
 * novos que a pessoa ainda não tinha organizado. Quem salvou só
 * "grafico/lancamentos" (versão antiga) mantém essa ordem relativa,
 * com os demais blocos no lugar de sempre, antes deles.
 */
const NOVOS_NO_TOPO: BlocoFinancasId[] = ["hoje", "rapidos"];
// Etapa 251 — opcionais: começam escondidos; liga em "Personalizar"
export const BLOCOS_OPCIONAIS: BlocoFinancasId[] = ["hoje", "rapidos"];
const visivelPorPadrao = (id: BlocoFinancasId) => !BLOCOS_OPCIONAIS.includes(id);

export function lerLayoutBlocos(ordemSalva: string[] | null | undefined): BlocoFinancas[] {
  const validos = new Set<string>(BLOCOS_FINANCAS_PADRAO);
  const lidos: BlocoFinancas[] = [];
  for (const bruto of ordemSalva ?? []) {
    if (typeof bruto !== "string") continue;
    const id = bruto.replace(/^!/, "");
    if (!validos.has(id) || lidos.some((b) => b.id === id)) continue;
    lidos.push({ id: id as BlocoFinancasId, visivel: !bruto.startsWith("!") });
  }
  if (!lidos.length) return BLOCOS_FINANCAS_PADRAO.map((id) => ({ id, visivel: visivelPorPadrao(id) }));

  const faltando = BLOCOS_FINANCAS_PADRAO.filter((id) => !lidos.some((b) => b.id === id)).map((id) => ({ id, visivel: visivelPorPadrao(id) }));
  // Etapa 247 — blocos novos que valem estar no topo pra todo mundo
  const noTopo = faltando.filter((b) => NOVOS_NO_TOPO.includes(b.id));
  const resto = faltando.filter((b) => !NOVOS_NO_TOPO.includes(b.id));
  // formato antigo: só tinha gráfico e lançamentos → os outros vêm antes, como sempre foi
  const formatoAntigo = lidos.every((b) => b.id === "grafico" || b.id === "lancamentos");
  return formatoAntigo ? [...noTopo, ...resto, ...lidos] : [...noTopo, ...lidos, ...resto];
}

export function salvarLayoutBlocos(layout: BlocoFinancas[]): string[] {
  return layout.map((b) => (b.visivel ? b.id : `!${b.id}`));
}

export function moverBloco(layout: BlocoFinancas[], i: number, direcao: -1 | 1): BlocoFinancas[] {
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= layout.length) return layout;
  const n = [...layout];
  [n[i], n[j]] = [n[j], n[i]];
  return n;
}

export function fixarNoTopo(layout: BlocoFinancas[], i: number): BlocoFinancas[] {
  if (i <= 0 || i >= layout.length) return layout;
  return [layout[i], ...layout.filter((_, k) => k !== i)];
}

export function alternarBloco(layout: BlocoFinancas[], i: number): BlocoFinancas[] {
  return layout.map((b, k) => (k === i ? { ...b, visivel: !b.visivel } : b));
}

/** Compatibilidade: quem só precisa da ordem (sem saber o que está escondido). */
export function normalizarOrdemBlocos(ordemSalva: string[] | null): BlocoFinancasId[] {
  return lerLayoutBlocos(ordemSalva).map((b) => b.id);
}
