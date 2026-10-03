"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { criarHabito } from "../actions";
import { FormularioHabito } from "@/components/FormularioHabito";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { Dica } from "@/components/Dica";

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
    <main className="pagina-form">
      {erro && (
        <p className="m-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(erro)}
        </p>
      )}

      {/* Etapa 227 — topo na cor do hábito, igual ao lançamento de Finanças */}
      <FormularioHabito
        action={criarHabito}
        categorias={(snapshot?.categoriasProdutividade ?? []) as any}
        outrosHabitos={((snapshot?.habitos ?? []) as any[]).filter((h) => !h.eh_negativo).map((h) => ({ id: h.id, nome: h.nome }))}
        textoBotao="Criar hábito"
        topo={{ titulo: "Novo hábito", voltarHref: "/habitos" }}
      />
      <div className="px-6 md:px-12 mt-2">
        <Dica contexto="novoHabito" />
      </div>
    </main>
  );
}
