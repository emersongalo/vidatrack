"use client";

// Etapa 354 — telas que buscam direto do banco (planejador, divisões):
// guardam a última lista no aparelho e, sem internet, mostram essa cópia
// com as mudanças que ainda estão na fila por cima.
import { lerFila } from "@/lib/offline/fila";
import type { Escrita } from "@/lib/offline/escrita";

export function lerCacheLista<T>(chave: string): T | null {
  try {
    const v = localStorage.getItem("vt-cache-" + chave);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export function salvarCacheLista(chave: string, valor: unknown) {
  try {
    localStorage.setItem("vt-cache-" + chave, JSON.stringify(valor));
  } catch {}
}

/** escritas ainda na fila pra essa tabela (na ordem) */
export function escritasPendentes(tabela: string): Escrita[] {
  return lerFila()
    .filter((a: any) => a.tipo === "generica" && a.acao === "gravarNoBanco" && a.args?.[0]?.tabela === tabela)
    .map((a: any) => a.args[0] as Escrita);
}

/** aplica as escritas pendentes numa lista (filtro: quais inserts entram nela) */
export function sobreporEscritas<T extends { id: string }>(lista: T[], tabela: string, entra?: (valores: Record<string, unknown>) => boolean): (T & { pendente_sync?: boolean })[] {
  let out: any[] = [...lista];
  for (const e of escritasPendentes(tabela)) {
    const v = e.valores ?? {};
    if (e.op === "insert" && typeof v.id === "string") {
      if (entra && !entra(v)) continue;
      if (!out.some((x) => x.id === v.id)) out.push({ ...v, pendente_sync: true });
    } else if (e.op === "update" && e.id) {
      out = out.map((x) => (x.id === e.id ? { ...x, ...v, pendente_sync: true } : x));
      if (entra && !entra(out.find((x) => x.id === e.id) ?? {})) out = out.filter((x) => x.id !== e.id);
    } else if (e.op === "delete" && e.id) {
      out = out.filter((x) => x.id !== e.id);
    }
  }
  return out;
}
