"use client";

// Etapa 353 — troca de `createClient().from(t).update(v).eq("id", id)` nas
// telas: com internet grava direto (igual antes); sem internet (ou se a
// rede cair) guarda no aparelho, a tela já mostra a mudança e a fila
// grava quando a conexão volta. Devolve { error } no mesmo formato do
// Supabase, pra mexer o mínimo nas telas.
import { createClient } from "@/lib/supabase/client";
import { enfileirarAcao, ehErroDeRede, semInternet } from "@/lib/local/acaoOffline";
import { patchesDaEscrita, type Escrita } from "@/lib/offline/escrita";
import type { Patch } from "@/lib/offline/patches";

export type ResultadoGravar = { error: { message: string } | null; naFila?: boolean };

export async function gravar(e: Escrita, extra?: { patches?: Patch[]; rotulo?: string }): Promise<ResultadoGravar> {
  const guardar = (): ResultadoGravar => {
    enfileirarAcao({
      acao: "gravarNoBanco",
      args: [e],
      patches: extra?.patches ?? patchesDaEscrita(e),
      rotulo: extra?.rotulo,
    });
    return { error: null, naFila: true };
  };
  if (semInternet()) return guardar();
  try {
    const t = createClient().from(e.tabela);
    const r =
      e.op === "update"
        ? await t.update(e.valores!).eq("id", e.id!)
        : e.op === "insert"
          ? await t.insert(e.valores!)
          : e.op === "upsert"
            ? await t.upsert(e.valores!, e.onConflict ? { onConflict: e.onConflict } : undefined)
            : await t.delete().eq("id", e.id!);
    if (r.error && ehErroDeRede(r.error.message)) return guardar();
    if (r.error && e.op === "insert" && (r.error as any).code === "23505") return { error: null };
    return { error: r.error ? { message: r.error.message } : null };
  } catch (err) {
    if (ehErroDeRede(err)) return guardar();
    return { error: { message: String((err as any)?.message ?? err) } };
  }
}
