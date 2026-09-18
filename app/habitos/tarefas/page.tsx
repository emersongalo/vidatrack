"use client";

import Link from "next/link";
import { ListaTarefasArrastavel } from "@/components/ListaTarefasArrastavel";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 127
export default function TarefasPage() {
  const { snapshot } = useSnapshotOffline();
  const tarefas = [...(snapshot?.tarefas ?? [])].sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0));

  return (
    <main className="max-w-2xl lg:max-w-4xl mx-auto px-6 md:px-12 pt-2">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold">Tarefas</h1>
        <Link
          href="/habitos/tarefas/nova"
          className="bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition"
        >
          + Nova
        </Link>
      </div>
      <Link href="/habitos/tarefas/lixeira" className="text-ink-400 text-xs hover:text-ink-100 transition">
        Lixeira
      </Link>

      {snapshot !== undefined && tarefas.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
          <p className="font-display font-semibold mb-1">Nenhuma tarefa ainda</p>
          <p className="text-ink-400 text-sm">Tarefas podem ser únicas ou repetir como um hábito.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-ink-400 mb-3">Arraste ⠿ para reordenar</p>
          <ListaTarefasArrastavel tarefas={tarefas as any} />
        </>
      )}
    </main>
  );
}
