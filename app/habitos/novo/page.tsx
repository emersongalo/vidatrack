"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { criarHabito } from "../actions";
import { FormularioHabito } from "@/components/FormularioHabito";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { Dica } from "@/components/Dica";
import { CartaoTempoTela } from "@/components/CartaoTempoTela";

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
        comCompartilhar
        topo={{ titulo: "Novo hábito", voltarHref: "/habitos" }}
      />
      <div className="px-6 md:px-12 mt-2">
        {/* Etapa 312 — atalho pros hábitos prontos */}
        <Link href="/habitos/trilhas" className="flex items-center gap-3 rounded-2xl border border-base-600 bg-base-800 px-4 py-3 mb-3 hover:border-habito transition">
          <span className="text-2xl">🧭</span>
          <span className="flex-1 min-w-0">
            <span className="block font-semibold text-sm">Sem ideia? Use um hábito pronto</span>
            <span className="block text-xs text-ink-400">Trilhas de saúde, mente, casa, dinheiro… com desafio de 7, 21 ou 30 dias</span>
          </span>
          <span className="text-ink-400">›</span>
        </Link>
        {/* Etapa 295 — hábitos de tela (Android) */}
        <CartaoTempoTela compacto />
        <Dica contexto="novoHabito" />
      </div>
    </main>
  );
}
