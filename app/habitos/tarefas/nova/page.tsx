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
      contasFinancas={((snapshot?.financas.contas ?? []) as any[]).filter((c) => c.dono_id === undefined || c.dono_id === snapshot?.perfil.id)}
      categoriasFinancas={((snapshot?.financas.categorias ?? []) as any[]).filter((c) => c.dono_id === snapshot?.perfil.id)}
      erro={searchParams.get("erro") ?? undefined}
      hoje={hojeISO()}
    />
  );
}
