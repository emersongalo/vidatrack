// Etapa 280 — monitor de erros: monta a mensagem (anônima) e agrupa
// erros parecidos no painel. Funções puras.

/** Tira números, ids e valores que mudam, pra juntar erros iguais. */
export function normalizarErro(msg: string): string {
  return String(msg ?? "")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ":id")
    .replace(/\/\d{4}-\d{2}-\d{2}/g, "/:data")
    .replace(/\b\d{3,}\b/g, "#")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

export type OrigemErro = "js" | "promise" | "http" | "outro";

export function origemDoErro(msg: string): OrigemErro {
  if (msg.startsWith("erro-http")) return "http";
  if (msg.includes("(promise)")) return "promise";
  if (msg.startsWith("erro-js")) return "js";
  return "outro";
}

/** "/financas/abc/editar" → "/financas/:id/editar" (pra agrupar por tela) */
export function telaDoErro(msg: string): string {
  const m = msg.match(/^erro-[a-z]+ (\/[^\s:]*)/);
  return normalizarErro(m?.[1] ?? "?");
}

export type GrupoErro = {
  chave: string;
  exemplo: string;
  total: number;
  ultimo: string;
  primeiro: string;
  origem: OrigemErro;
  tela: string;
  app: number;
  web: number;
};

export function agruparErros(eventos: { pagina: string; criado_em: string }[]): GrupoErro[] {
  const grupos = new Map<string, GrupoErro>();
  for (const e of eventos) {
    const msg = String(e.pagina);
    const chave = normalizarErro(msg.replace(/ \[(app|web)\]$/, ""));
    const g =
      grupos.get(chave) ??
      ({ chave, exemplo: msg, total: 0, ultimo: e.criado_em, primeiro: e.criado_em, origem: origemDoErro(msg), tela: telaDoErro(msg), app: 0, web: 0 } as GrupoErro);
    g.total++;
    if (e.criado_em > g.ultimo) g.ultimo = e.criado_em;
    if (e.criado_em < g.primeiro) g.primeiro = e.criado_em;
    if (msg.endsWith("[app]")) g.app++;
    else if (msg.endsWith("[web]")) g.web++;
    grupos.set(chave, g);
  }
  return [...grupos.values()].sort((a, b) => b.total - a.total || b.ultimo.localeCompare(a.ultimo));
}
