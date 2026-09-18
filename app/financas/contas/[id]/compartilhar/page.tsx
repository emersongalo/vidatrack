"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PainelCompartilhamentoCliente } from "@/components/PainelCompartilhamentoCliente";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 132
export default function CompartilharContaPage() {
  return (
    <Suspense fallback={null}>
      <CompartilharContaConteudo />
    </Suspense>
  );
}

function CompartilharContaConteudo() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { snapshot } = useSnapshotOffline();

  const conta = (snapshot?.financas.contas ?? []).find((c: any) => c.id === params.id);

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href="/financas/contas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Contas
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-1">Compartilhar</h1>
      <p className="text-ink-400 text-sm mb-6">{conta?.nome ?? "..."}</p>
      <p className="text-xs text-ink-400 mb-6 bg-base-800 border border-base-600 rounded-lg px-3 py-2">
        Quem tiver acesso a essa conta vê e lança transações nela — as categorias continuam pessoais de cada um.
      </p>

      <PainelCompartilhamentoCliente
        tipoItem="financa"
        itemId={params.id}
        caminhoRetorno={`/financas/contas/${params.id}/compartilhar`}
        erroInicial={searchParams.get("erro")}
      />
    </main>
  );
}
