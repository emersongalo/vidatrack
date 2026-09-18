"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AcoesLixeiraHabito } from "@/components/AcoesLixeiraHabito";
import { IconeHabito } from "@/components/IconeHabito";

// Etapa 129 — lixeiras usam busca direta (não entram no retrato
// principal): restaurar algo do lixo não é uma ação urgente pra
// funcionar sem internet, então não vale inchar o retrato com dado
// arquivado que quase nunca é olhado.
export default function LixeiraHabitosPage() {
  const [habitos, setHabitos] = useState<any[] | null>(null);

  const buscar = useCallback(() => {
    createClient()
      .from("habitos")
      .select("id, nome, icone")
      .eq("arquivado", true)
      .order("criado_em", { ascending: false })
      .then(({ data }) => setHabitos(data ?? []));
  }, []);

  useEffect(() => {
    buscar();
  }, [buscar]);

  return (
    <main className="max-w-2xl lg:max-w-4xl mx-auto px-6 md:px-12 pt-2 pb-20">
      <Link href="/habitos/lista" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Hábitos
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Lixeira de hábitos</h1>

      {!habitos || habitos.length === 0 ? (
        <p className="text-ink-400 text-sm">{habitos === null ? "Carregando..." : "Nenhum hábito arquivado."}</p>
      ) : (
        <ul className="space-y-2">
          {habitos.map((h) => (
            <li key={h.id} className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-xl2 p-3">
              <span className="text-lg"><IconeHabito icone={h.icone} /></span>
              <span className="flex-1 text-sm truncate">{h.nome}</span>
              <AcoesLixeiraHabito habitoId={h.id} aoConcluir={buscar} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
