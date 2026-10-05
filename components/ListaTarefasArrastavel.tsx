"use client";

import Link from "next/link";
import { ListaArrastavel } from "@/components/ListaArrastavel";
import { reordenarTarefas } from "@/app/habitos/tarefas/actions";
import { IconeHabito } from "@/components/IconeHabito";
import { descreverRepeticao, tarefaAtrasada, PRIORIDADES } from "@/lib/agenda/recorrencia";
import { hojeISO } from "@/lib/habitos/streak";

type Tarefa = {
  id: string;
  titulo: string;
  icone: string;
  repetir: string;
  data: string | null;
  concluida: boolean;
  subtarefas: { feita: boolean }[];
  dias_semana?: number[] | null;
  dia_mes?: number | null;
  mes?: number | null;
  intervalo_dias?: number | null;
  prioridade?: number | null;
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
            <Link href={`/tarefas/${tarefa.id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-nota/15 flex items-center justify-center text-lg shrink-0">
                <IconeHabito icone={tarefa.icone} tamanho={19} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${tarefa.concluida ? "line-through text-ink-400" : ""}`}>
                  {tarefa.titulo}
                </p>
                <p className="text-xs text-ink-400 flex items-center gap-1.5 flex-wrap">
                  {/* Etapa 193 — descrição real da repetição ("Todo dia 10 do mês")
                      em vez de só "Repete", prioridade e selo de atrasada. */}
                  {!!tarefa.prioridade && tarefa.prioridade > 0 && (
                    <span className={`w-2 h-2 rounded-full ${PRIORIDADES[tarefa.prioridade].fundo}`} title={`Prioridade ${PRIORIDADES[tarefa.prioridade].rotulo}`} />
                  )}
                  <span className={tarefaAtrasada(tarefa, hojeISO()) ? "text-red-400" : ""}>
                    {tarefa.repetir === "nenhuma" ? "" : "↻ "}
                    {descreverRepeticao(tarefa)}
                    {tarefaAtrasada(tarefa, hojeISO()) && " · atrasada"}
                  </span>
                  {subtarefas.length > 0 && <span>· {subtarefas.filter((s) => s.feita).length}/{subtarefas.length}</span>}
                </p>
              </div>
            </Link>
          </div>
        );
      }}
    />
  );
}
