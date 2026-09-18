"use client";

import Link from "next/link";

/**
 * Etapa 137 — Tarefas deixou de ser uma aba própria da barra de baixo
 * (eram 5 abas, meio apertado no celular). A lista de tarefas continua
 * existindo exatamente igual, só que agora se chega nela por esse
 * alternador, dentro da aba Hábitos, em vez de uma aba própria.
 */
export function AlternadorHabitosTarefas({ ativo }: { ativo: "habitos" | "tarefas" }) {
  return (
    <div className="inline-flex bg-base-800 border border-base-600 rounded-full p-1 mb-6">
      <Link
        href="/habitos/lista"
        className={`px-4 py-1.5 rounded-full text-sm transition ${
          ativo === "habitos" ? "bg-habito text-base-900 font-medium" : "text-ink-400 hover:text-ink-100"
        }`}
      >
        Hábitos
      </Link>
      <Link
        href="/habitos/tarefas"
        className={`px-4 py-1.5 rounded-full text-sm transition ${
          ativo === "tarefas" ? "bg-nota text-base-900 font-medium" : "text-ink-400 hover:text-ink-100"
        }`}
      >
        Tarefas
      </Link>
    </div>
  );
}
