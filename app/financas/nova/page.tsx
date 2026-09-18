"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormularioTransacao } from "@/components/FormularioTransacao";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 128 — essa é provavelmente a tela mais importante de deixar
// funcionando offline (lançar uma despesa/receita no meio do dia).
// O formulário em si (FormularioTransacao) já sabia enfileirar
// offline desde a Etapa 44; só faltava essa página conseguir abrir
// (mostrar as contas/categorias) sem internet — agora lê do retrato.
export default function NovaTransacaoPage() {
  return (
    <Suspense fallback={null}>
      <NovaTransacaoConteudo />
    </Suspense>
  );
}

function NovaTransacaoConteudo() {
  const searchParams = useSearchParams();
  const { snapshot } = useSnapshotOffline();

  if (snapshot === undefined) return null;

  const contas = snapshot?.financas.contas ?? [];
  const categorias = snapshot?.financas.categorias ?? [];

  if (contas.length === 0) {
    return (
      <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
        <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
          ← Finanças
        </Link>
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center mt-6">
          <p className="font-display font-semibold mb-1">Crie uma conta primeiro</p>
          <p className="text-ink-400 text-sm mb-4">
            Todo lançamento precisa estar ligado a uma conta (carteira, banco ou cartão).
          </p>
          <Link
            href="/financas/contas"
            className="inline-block bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition"
          >
            Criar conta
          </Link>
        </div>
      </main>
    );
  }

  return (
    <FormularioTransacao
      contas={contas as any}
      categorias={categorias as any}
      erro={searchParams.get("erro") ?? undefined}
    />
  );
}
