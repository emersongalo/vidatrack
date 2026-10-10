// Etapa 227 — "Personalizar início" também na tela Hoje (salvo por login
// em perfis.ordem_blocos_habitos; "!" na frente = escondido).
// Etapa 285 — "contas" saiu: a aba Hábitos mostra só hábitos (finanças ficam em Finanças).
export type BlocoHojeId = "resumo" | "lista" | "pausados" | "diario" | "sugestoes";
export type BlocoHoje = { id: BlocoHojeId; visivel: boolean };

export const BLOCOS_HOJE_PADRAO: BlocoHojeId[] = ["resumo", "lista", "pausados", "diario", "sugestoes"];

export const NOMES_BLOCOS_HOJE: Record<BlocoHojeId, string> = {
  resumo: "🎯 Resumo do dia",
  lista: "✅ Hábitos",
  pausados: "⏸ Hábitos pausados",
  diario: "🙂 Como foi seu dia",
  sugestoes: "💡 Sugestões de lembrete",
};

export function lerLayoutHoje(salvo: string[] | null | undefined): BlocoHoje[] {
  const validos = new Set<string>(BLOCOS_HOJE_PADRAO);
  const lidos: BlocoHoje[] = [];
  for (const bruto of salvo ?? []) {
    if (typeof bruto !== "string") continue;
    const id = bruto.replace(/^!/, "");
    if (!validos.has(id) || lidos.some((b) => b.id === id)) continue;
    lidos.push({ id: id as BlocoHojeId, visivel: !bruto.startsWith("!") });
  }
  const faltando = BLOCOS_HOJE_PADRAO.filter((id) => !lidos.some((b) => b.id === id)).map((id) => ({ id, visivel: true }));
  return [...lidos, ...faltando];
}

export function salvarLayoutHoje(layout: BlocoHoje[]): string[] {
  return layout.map((b) => (b.visivel ? b.id : `!${b.id}`));
}

export function moverItem<T>(lista: T[], i: number, direcao: -1 | 1): T[] {
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= lista.length) return lista;
  const n = [...lista];
  [n[i], n[j]] = [n[j], n[i]];
  return n;
}
export function fixarItemNoTopo<T>(lista: T[], i: number): T[] {
  if (i <= 0 || i >= lista.length) return lista;
  return [lista[i], ...lista.filter((_, k) => k !== i)];
}
export function alternarVisivel<T extends { visivel: boolean }>(lista: T[], i: number): T[] {
  return lista.map((b, k) => (k === i ? { ...b, visivel: !b.visivel } : b));
}
