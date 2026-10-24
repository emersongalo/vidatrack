// Etapa 227 — "Personalizar início" também na tela Hoje (salvo por login
// em perfis.ordem_blocos_habitos; "!" na frente = escondido).
// Etapa 285 — "contas" saiu: a aba Hábitos mostra só hábitos (finanças ficam em Finanças).
// Etapa 300 — "mascote": o bichinho fica no topo da aba Hábitos.
export type BlocoHojeId = "mascote" | "missoes" | "desafios" | "resumo" | "agenda" | "lista" | "jardim" | "pausados" | "diario" | "sugestoes";
export type BlocoHoje = { id: BlocoHojeId; visivel: boolean };

export const BLOCOS_HOJE_PADRAO: BlocoHojeId[] = ["mascote", "missoes", "desafios", "resumo", "agenda", "lista", "jardim", "pausados", "diario", "sugestoes"];

export const NOMES_BLOCOS_HOJE: Record<BlocoHojeId, string> = {
  mascote: "🐣 Mascote",
  // Etapa 309
  missoes: "🎯 Missões do dia",
  // Etapa 314
  desafios: "🥇 Desafios em andamento",
  resumo: "🎯 Resumo do dia",
  // Etapa 360
  agenda: "📅 Agenda do dia",
  lista: "✅ Hábitos",
  // Etapa 308
  jardim: "🌳 Seu jardim",
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
  // nunca organizou a tela: ordem padrão (Etapa 360 — com a agenda antes dos hábitos)
  if (!lidos.length) return BLOCOS_HOJE_PADRAO.map((id) => ({ id, visivel: true }));
  const faltando = BLOCOS_HOJE_PADRAO.filter((id) => !lidos.some((b) => b.id === id)).map((id) => ({ id, visivel: true }));
  // Etapa 300 — quem já tinha a tela organizada ganha o mascote no topo
  const novosNoTopo = faltando.filter((b) => b.id === "mascote");
  const resto = faltando.filter((b) => b.id !== "mascote" && b.id !== "missoes" && b.id !== "desafios" && b.id !== "agenda");
  const lista = [...novosNoTopo, ...lidos, ...resto];
  // Etapa 309 — missões novas entram logo depois do mascote
  if (faltando.some((b) => b.id === "missoes")) {
    const i = lista.findIndex((b) => b.id === "mascote");
    lista.splice(i + 1, 0, { id: "missoes", visivel: true });
  }
  // Etapa 314 — desafios logo depois das missões (ou do mascote)
  if (faltando.some((b) => b.id === "desafios")) {
    let i = lista.findIndex((b) => b.id === "missoes");
    if (i < 0) i = lista.findIndex((b) => b.id === "mascote");
    lista.splice(i + 1, 0, { id: "desafios", visivel: true });
  }
  // Etapa 360 — agenda do dia: logo depois do resumo (se a pessoa já
  // organizou a tela com ele); senão, no fim. Nunca empurra o que a
  // pessoa arrumou.
  if (faltando.some((b) => b.id === "agenda")) {
    const i = lidos.some((b) => b.id === "resumo") ? lista.findIndex((b) => b.id === "resumo") : -1;
    lista.splice(i < 0 ? lista.length : i + 1, 0, { id: "agenda", visivel: true });
  }
  return lista;
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
