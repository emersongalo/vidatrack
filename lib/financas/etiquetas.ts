// Etapa 218 — etiquetas livres nos lançamentos (ex: "viagem praia", "reforma")
export function normalizarEtiqueta(t: string): string {
  return t
    .replace(/^#/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .slice(0, 30);
}

export function normalizarEtiquetas(lista: (string | null | undefined)[]): string[] {
  const saida: string[] = [];
  for (const bruto of lista) {
    for (const parte of String(bruto ?? "").split(",")) {
      const e = normalizarEtiqueta(parte);
      if (e && !saida.includes(e)) saida.push(e);
    }
  }
  return saida.slice(0, 10);
}

/** Totais por etiqueta (despesas e receitas), sem transferências. */
export function totaisPorEtiqueta(
  transacoes: { tipo: string; valor: number | string; etiquetas?: string[] | null; transferencia_grupo?: string | null; data: string }[]
) {
  const mapa = new Map<string, { etiqueta: string; despesas: number; receitas: number; quantidade: number; primeira: string; ultima: string }>();
  for (const t of transacoes) {
    if (t.transferencia_grupo || !t.etiquetas?.length) continue;
    for (const e of t.etiquetas) {
      const g = mapa.get(e) ?? { etiqueta: e, despesas: 0, receitas: 0, quantidade: 0, primeira: t.data, ultima: t.data };
      if (t.tipo === "receita") g.receitas += Number(t.valor);
      else g.despesas += Number(t.valor);
      g.quantidade++;
      if (t.data < g.primeira) g.primeira = t.data;
      if (t.data > g.ultima) g.ultima = t.data;
      mapa.set(e, g);
    }
  }
  return [...mapa.values()]
    .map((g) => ({ ...g, despesas: Math.round(g.despesas * 100) / 100, receitas: Math.round(g.receitas * 100) / 100 }))
    .sort((a, b) => b.ultima.localeCompare(a.ultima));
}

/** Etiquetas já usadas, mais recentes primeiro (pra sugerir no formulário). */
export function etiquetasUsadas(transacoes: { etiquetas?: string[] | null; data: string }[]): string[] {
  const vistas = new Map<string, string>();
  for (const t of transacoes) for (const e of t.etiquetas ?? []) if (!vistas.has(e) || t.data > vistas.get(e)!) vistas.set(e, t.data);
  return [...vistas.entries()].sort((a, b) => b[1].localeCompare(a[1])).map(([e]) => e);
}
