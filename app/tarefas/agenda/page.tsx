"use client";

// Etapa 341 — Agenda (dentro de Tarefas)
import { Suspense } from "react";
import { TopoArea } from "@/components/TopoArea";
import { AgendaApp } from "@/components/agenda/AgendaApp";

export default function AgendaPage() {
  return (
    <main className="pagina px-6 md:px-12 pt-2 pb-10">
      <TopoArea area="tarefa" titulo="Agenda" emoji="🗓️" subtitulo="Seus compromissos e os que você divide" />
      <Suspense fallback={null}>
        <AgendaApp />
      </Suspense>
    </main>
  );
}
