"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { criarHabito } from "../actions";
import { FormularioHabito } from "@/components/FormularioHabito";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 132
export default function NovoHabitoPage() {
  return (
    <Suspense fallback={null}>
      <NovoHabitoConteudo />
    </Suspense>
  );
}

function NovoHabitoConteudo() {
  const searchParams = useSearchParams();
  const erro = searchParams.get("erro");
  const { snapshot } = useSnapshotOffline();

  return (
    <main className="max-w-md lg:max-w-xl mx-auto px-6 md:px-12 pt-2">
      <Link href="/habitos" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Hoje
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Novo hábito</h1>

      {erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(erro)}
        </p>
      )}

      <FormularioHabito action={criarHabito} categorias={(snapshot?.categoriasProdutividade ?? []) as any} textoBotao="Criar hábito" />
    </main>
  );
}
