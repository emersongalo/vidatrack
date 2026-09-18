"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AcoesLixeiraTarefa } from "@/components/AcoesLixeiraTarefa";
import { IconeHabito } from "@/components/IconeHabito";

// Etapa 129
export default function LixeiraTarefasPage() {
  const [tarefas, setTarefas] = useState<any[] | null>(null);

  const buscar = useCallback(() => {
    createClient()
      .from("tarefas")
      .select("id, titulo, icone")
      .eq("arquivada", true)
      .order("criado_em", { ascending: false })
      .then(({ data }) => setTarefas(data ?? []));
  }, []);

  useEffect(() => {
    buscar();
  }, [buscar]);

  return (
    <main className="max-w-2xl lg:max-w-4xl mx-auto px-6 md:px-12 pt-2 pb-20">
      <Link href="/habitos/tarefas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Tarefas
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Lixeira de tarefas</h1>

      {!tarefas || tarefas.length === 0 ? (
        <p className="text-ink-400 text-sm">{tarefas === null ? "Carregando..." : "Nenhuma tarefa arquivada."}</p>
      ) : (
        <ul className="space-y-2">
          {tarefas.map((t) => (
            <li key={t.id} className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-xl2 p-3">
              <span className="text-lg"><IconeHabito icone={t.icone} /></span>
              <span className="flex-1 text-sm truncate">{t.titulo}</span>
              <AcoesLixeiraTarefa tarefaId={t.id} aoConcluir={buscar} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
