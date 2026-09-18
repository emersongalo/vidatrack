"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { atualizarCategoria } from "@/app/financas/actions";
import { FormularioCategoria } from "@/components/FormularioCategoria";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 133
export default function EditarCategoriaPage() {
  return (
    <Suspense fallback={null}>
      <EditarCategoriaConteudo />
    </Suspense>
  );
}

function EditarCategoriaConteudo() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { snapshot } = useSnapshotOffline();

  if (snapshot === undefined) return null;

  const categoria = (snapshot?.financas.categorias ?? []).find((c: any) => c.id === params.id);

  if (!categoria) {
    return (
      <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
        <p className="text-ink-400 text-sm">
          Não encontrei essa categoria no que está salvo no aparelho. Se ela foi criada há pouco tempo, conecte
          à internet uma vez pra atualizar.
        </p>
      </main>
    );
  }

  return (
    <FormularioCategoria
      action={atualizarCategoria.bind(null, categoria.id)}
      titulo="Editar categoria"
      textoBotao="Salvar alterações"
      erro={searchParams.get("erro") ?? undefined}
      valoresIniciais={{
        nome: categoria.nome,
        tipo: categoria.tipo,
        metaMensal: categoria.meta_mensal ? String(categoria.meta_mensal).replace(".", ",") : null,
        icone: categoria.icone,
        cor: categoria.cor,
      }}
    />
  );
}
