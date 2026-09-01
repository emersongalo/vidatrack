"use client";

import { useTransition } from "react";
import { alternarSubtarefa } from "@/app/habitos/tarefas/actions";

export function CheckboxSubtarefa({
  tarefaId,
  subtarefaId,
  texto,
  feita,
}: {
  tarefaId: string;
  subtarefaId: string;
  texto: string;
  feita: boolean;
}) {
  const [pendente, iniciarTransicao] = useTransition();

  return (
    <button
      onClick={() => iniciarTransicao(() => alternarSubtarefa(tarefaId, subtarefaId))}
      disabled={pendente}
      className={`w-full flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-left transition ${
        pendente ? "opacity-60" : ""
      }`}
    >
      <span
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
          feita ? "bg-nota border-nota" : "border-base-600"
        }`}
      >
        {feita && (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8.5L6.2 11.5L13 4.5"
              stroke="#0F1013"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className={`text-sm ${feita ? "line-through text-ink-400" : ""}`}>{texto}</span>
    </button>
  );
}
