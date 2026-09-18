"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { atualizarTransacao } from "../../actions";
import { FormularioTransacao } from "@/components/FormularioTransacao";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 128
export default function EditarTransacaoPage() {
  return (
    <Suspense fallback={null}>
      <EditarTransacaoConteudo />
    </Suspense>
  );
}

function EditarTransacaoConteudo() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const erro = searchParams.get("erro") ?? undefined;
  const { snapshot } = useSnapshotOffline();

  if (snapshot === undefined) return null;

  const transacao = (snapshot?.financas.transacoes ?? []).find((t: any) => t.id === params.id);
  const contas = snapshot?.financas.contas ?? [];
  const categorias = snapshot?.financas.categorias ?? [];

  if (!transacao) {
    return (
      <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
        <p className="text-ink-400 text-sm">
          Não encontrei esse lançamento no que está salvo no aparelho. Se ele foi feito há pouco tempo, conecte à
          internet uma vez pra atualizar.
        </p>
      </main>
    );
  }

  return (
    <FormularioTransacao
      contas={contas as any}
      categorias={categorias as any}
      erro={erro}
      action={atualizarTransacao.bind(null, transacao.id)}
      titulo="Editar lançamento"
      textoBotao="Salvar alterações"
      voltarHref="/financas"
      valoresIniciais={{
        tipo: transacao.tipo,
        valor: String(transacao.valor),
        contaId: transacao.conta_id,
        categoriaId: transacao.categoria_id,
        data: transacao.data,
        descricao: transacao.descricao,
      }}
    />
  );
}
