"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AcoesLixeiraConta } from "@/components/AcoesLixeiraConta";

// Etapa 129
export default function LixeiraContasPage() {
  const [contas, setContas] = useState<any[] | null>(null);

  const buscar = useCallback(() => {
    createClient()
      .from("financa_contas")
      .select("id, nome")
      .eq("arquivado", true)
      .order("criado_em", { ascending: false })
      .then(({ data }) => setContas(data ?? []));
  }, []);

  useEffect(() => {
    buscar();
  }, [buscar]);

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <Link href="/financas/contas" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Contas
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-6">Lixeira de contas</h1>

      {!contas || contas.length === 0 ? (
        <p className="text-ink-400 text-sm">{contas === null ? "Carregando..." : "Nenhuma conta arquivada."}</p>
      ) : (
        <ul className="space-y-2">
          {contas.map((c) => (
            <li key={c.id} className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-2xl p-4">
              <span className="flex-1 text-sm truncate">{c.nome}</span>
              <AcoesLixeiraConta contaId={c.id} aoConcluir={buscar} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
