"use client";

// Etapa 317 — bloco "Tarefas de hoje" no Início: as atrasadas e as de
// hoje, com a bolinha pra concluir ali mesmo (funciona sem internet).
import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { agruparTarefas } from "@/lib/agenda/tarefasLista";
import { alternarConclusaoTarefa } from "@/app/habitos/tarefas/actions";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { adicionarNaFila } from "@/lib/offline/fila";
import { hexDaCor } from "@/lib/agenda/estilo";
import { vibrar } from "@/lib/app/vibrar";

export function TarefasHoje({ snapshot, hoje }: { snapshot: any; hoje: string }) {
  const [local, setLocal] = useState<Record<string, boolean>>({});
  const tarefas = (snapshot?.tarefas ?? []) as any[];
  const cats = new Map(((snapshot?.categoriasProdutividade ?? []) as any[]).map((c) => [c.id, c.cor]));

  const conclusoes = useMemo(() => {
    const s = new Set(((snapshot?.conclusoesTarefas ?? []) as any[]).filter((c) => c.data === hoje).map((c) => c.tarefa_id as string));
    return s;
  }, [snapshot, hoje]);
  const grupos = useMemo(() => agruparTarefas(tarefas as any, hoje, conclusoes), [tarefas, hoje, conclusoes]);
  if (!snapshot) return null;

  const atrasadas = grupos.get("atrasadas") ?? [];
  const deHoje = grupos.get("hoje") ?? [];
  // concluídas hoje ficam riscadas (pra ver o progresso)
  const feitasHoje = (grupos.get("concluidas") ?? []).filter((t: any) => (t.repetir === "nenhuma" ? t.data === hoje : conclusoes.has(t.id)));
  const lista = [...atrasadas.map((t) => ({ t, atrasada: true })), ...deHoje.map((t) => ({ t, atrasada: false })), ...feitasHoje.map((t) => ({ t, atrasada: false }))];
  const feita = (t: any) => (t.id in local ? local[t.id] : t._feita);
  const total = atrasadas.length + deHoje.length + feitasHoje.length;
  const prontas = lista.filter(({ t }) => feita(t)).length;

  async function alternar(t: any) {
    const agora = feita(t);
    vibrar(agora ? 10 : [15, 40, 25]);
    setLocal((l) => ({ ...l, [t.id]: !agora }));
    try {
      if (!navigator.onLine) {
        adicionarNaFila({ tipo: "conclusao_tarefa", tarefaId: t.id, data: hoje });
        return;
      }
      await alternarConclusaoTarefa(t.id, hoje);
      await atualizarSnapshotEmTodasAsTelas();
    } catch {
      setLocal((l) => ({ ...l, [t.id]: agora }));
    }
  }

  return (
    <section className="bg-base-800 border border-base-600 rounded-3xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">📝 Tarefas de hoje</h2>
        <Link href="/habitos/tarefas" className="text-sm text-ink-400 hover:text-ink-100 flex items-center">
          Ver todas <ChevronRight size={15} />
        </Link>
      </div>
      {total === 0 ? (
        <p className="text-base text-ink-400 py-2">Nenhuma tarefa pra hoje 🌿</p>
      ) : (
        <>
          <div className="h-1.5 rounded-full bg-base-700 overflow-hidden mb-3">
            <div className="h-full rounded-full bg-nota transition-all duration-700" style={{ width: `${Math.round((prontas / Math.max(1, lista.length)) * 100)}%` }} />
          </div>
          <ul className="space-y-1.5">
            {lista.slice(0, 7).map(({ t, atrasada }) => {
              const ok = feita(t);
              const cor = t.categoria_id && cats.get(t.categoria_id) ? hexDaCor(cats.get(t.categoria_id)) : "#9C8FD9";
              return (
                <li key={t.id} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void alternar(t)}
                    aria-label={ok ? "Desmarcar" : "Concluir"}
                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition active:scale-90"
                    style={{ borderColor: cor, background: ok ? cor : "transparent" }}
                  >
                    {ok && <Check size={15} strokeWidth={3} className="text-base-900" />}
                  </button>
                  <Link href={`/tarefas/${t.id}`} className="flex-1 min-w-0">
                    <span className={`block text-base truncate ${ok ? "line-through text-ink-500" : ""}`}>{t.titulo}</span>
                    {atrasada && !ok && <span className="block text-[11px] text-red-400">atrasada</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
          {lista.length > 7 && <p className="text-xs text-ink-400 mt-2">+{lista.length - 7} na lista de tarefas</p>}
        </>
      )}
    </section>
  );
}
