"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PainelCompartilhamentoCliente } from "@/components/PainelCompartilhamentoCliente";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 132
export default function CompartilharHabitoPage() {
  return (
    <Suspense fallback={null}>
      <CompartilharHabitoConteudo />
    </Suspense>
  );
}

function CompartilharHabitoConteudo() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { snapshot } = useSnapshotOffline();

  const habito = (snapshot?.habitos ?? []).find((h: any) => h.id === params.id);

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href="/habitos/lista" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Hábitos
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-1">Compartilhar</h1>
      <p className="text-ink-400 text-sm mb-4">{habito?.nome ?? "..."}</p>

      <p className="text-xs text-ink-400 bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 mb-6">
        💡 Ótimo pra hábitos em conjunto (ex: "ler a Bíblia juntos") — cada pessoa marca seu próprio check-in, e
        na agenda "Hoje" vocês veem o status um do outro lado a lado, pra se motivarem.
      </p>

      <PainelCompartilhamentoCliente
        tipoItem="habito"
        itemId={params.id}
        caminhoRetorno={`/habitos/${params.id}/compartilhar`}
        erroInicial={searchParams.get("erro")}
      />
    </main>
  );
}
