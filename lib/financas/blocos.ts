export type BlocoFinancasId = "calendario" | "grafico" | "linksRapidos" | "lancamentos";

export const BLOCOS_FINANCAS_PADRAO: BlocoFinancasId[] = [
  "calendario",
  "grafico",
  "linksRapidos",
  "lancamentos",
];

export const NOMES_BLOCOS_FINANCAS: Record<BlocoFinancasId, string> = {
  calendario: "📅 Calendário de gastos",
  grafico: "🥧 Gráfico por categoria",
  linksRapidos: "🔗 Links rápidos",
  lancamentos: "🧾 Últimos lançamentos",
};

/**
 * A pessoa pode ter salvo uma ordem antiga que não bate mais com os
 * blocos que existem hoje (ex: um bloco foi removido numa atualização
 * futura). Essa função sempre devolve uma lista válida e completa:
 * usa a ordem salva pros blocos que ainda existem, e adiciona no fim
 * qualquer bloco novo que a pessoa ainda não tinha reordenado.
 */
export function normalizarOrdemBlocos(ordemSalva: string[] | null): BlocoFinancasId[] {
  if (!ordemSalva || ordemSalva.length === 0) return BLOCOS_FINANCAS_PADRAO;

  const validos = ordemSalva.filter((id): id is BlocoFinancasId =>
    BLOCOS_FINANCAS_PADRAO.includes(id as BlocoFinancasId)
  );
  const faltando = BLOCOS_FINANCAS_PADRAO.filter((id) => !validos.includes(id));

  return [...validos, ...faltando];
}
