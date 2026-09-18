"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { atualizarConta } from "@/app/financas/actions";
import { BANCOS } from "@/lib/financas/bancos";
import { SeletorTipoConta } from "@/components/SeletorTipoConta";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 128
export default function EditarContaPage() {
  return (
    <Suspense fallback={null}>
      <EditarContaConteudo />
    </Suspense>
  );
}

function EditarContaConteudo() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const erro = searchParams.get("erro");
  const { snapshot } = useSnapshotOffline();

  if (snapshot === undefined) {
    return (
      <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto animate-pulse">
        <div className="h-64 bg-base-800 border border-base-600 rounded-xl2 mt-6" />
      </main>
    );
  }

  const conta = (snapshot?.financas.contas ?? []).find((c: any) => c.id === params.id);

  if (!conta) {
    return (
      <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
        <Link href="/financas/contas" className="text-ink-400 text-sm hover:text-ink-100 transition">
          ← Contas
        </Link>
        <p className="text-ink-400 text-sm mt-6">
          Não encontrei essa conta no que está salvo no aparelho. Se você criou ela há pouco tempo, conecte à
          internet uma vez pra atualizar.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href="/financas/contas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Contas
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Editar conta</h1>

      {erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(erro)}
        </p>
      )}

      <form action={atualizarConta.bind(null, conta.id)} className="space-y-3">
        <input
          name="nome"
          type="text"
          required
          defaultValue={conta.nome}
          className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
        />
        <SeletorTipoConta
          tipoInicial={conta.tipo}
          diaFechamentoInicial={conta.dia_fechamento}
          diaVencimentoInicial={conta.dia_vencimento}
        />
        <div>
          <label className="block text-xs text-ink-400 mb-1.5">Banco (pra mostrar o selo certo)</label>
          <select
            name="banco"
            defaultValue={conta.banco ?? "outro"}
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          >
            {BANCOS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-400 mb-1.5">Saldo inicial</label>
          <input
            name="saldoInicial"
            type="text"
            inputMode="decimal"
            defaultValue={String(conta.saldo_inicial).replace(".", ",")}
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
          />
        </div>
        <BotaoSalvarFormulario>Salvar alterações</BotaoSalvarFormulario>
      </form>
    </main>
  );
}
