"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { hojeISO } from "@/lib/habitos/streak";
import { FormularioTarefa } from "@/components/FormularioTarefa";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 132
export default function NovaTarefaPage() {
  return (
    <Suspense fallback={null}>
      <NovaTarefaConteudo />
    </Suspense>
  );
}

function NovaTarefaConteudo() {
  const searchParams = useSearchParams();
  const { snapshot } = useSnapshotOffline();

  return (
    <FormularioTarefa
      categorias={(snapshot?.categoriasProdutividade ?? []) as any}
      erro={searchParams.get("erro") ?? undefined}
      hoje={hojeISO()}
    />
  );
}
