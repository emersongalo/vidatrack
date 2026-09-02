"use client";

import Link from "next/link";
import { ListaArrastavel } from "@/components/ListaArrastavel";
import { reordenarTarefas } from "@/app/habitos/tarefas/actions";

type Tarefa = {
  id: string;
  titulo: string;
  icone: string;
  repetir: string;
  data: string | null;
  concluida: boolean;
  subtarefas: { feita: boolean }[];
};

export function ListaTarefasArrastavel({ tarefas }: { tarefas: Tarefa[] }) {
  return (
    <ListaArrastavel
      itens={tarefas}
      aoReordenar={reordenarTarefas}
      renderItem={(tarefa, arrastando) => {
        const subtarefas = tarefa.subtarefas ?? [];
        return (
          <div
            className={`flex items-center gap-3 bg-base-800 border border-base-600 rounded-xl2 p-3 transition ${
              arrastando ? "opacity-50" : ""
            }`}
          >
            <span className="text-ink-400 text-sm select-none" aria-hidden>
              ⠿
            </span>
            <Link href={`/habitos/tarefas/${tarefa.id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-nota/15 flex items-center justify-center text-lg shrink-0">
                {tarefa.icone}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${tarefa.concluida ? "line-through text-ink-400" : ""}`}>
                  {tarefa.titulo}
                </p>
                <p className="text-xs text-ink-400">
                  {tarefa.repetir === "nenhuma"
                    ? tarefa.data
                      ? new Date(tarefa.data + "T00:00:00").toLocaleDateString("pt-BR")
                      : "Sem data"
                    : "Repete"}
                  {subtarefas.length > 0 &&
                    ` · ${subtarefas.filter((s) => s.feita).length}/${subtarefas.length}`}
                </p>
              </div>
            </Link>
          </div>
        );
      }}
    />
  );
}
