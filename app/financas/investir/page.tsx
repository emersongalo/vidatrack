"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LinkVoltar } from "@/components/LinkVoltar";
import { transferirParaInvestimento } from "../actions";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 129
export default function InvestirPage() {
  return (
    <Suspense fallback={null}>
      <InvestirConteudo />
    </Suspense>
  );
}

function InvestirConteudo() {
  const searchParams = useSearchParams();
  const erro = searchParams.get("erro");
  const { snapshot } = useSnapshotOffline();

  const contas = snapshot?.financas.contas ?? [];
  const contasOrigem = contas.filter((c: any) => c.tipo !== "investimento");
  const contasInvestimento = contas.filter((c: any) => c.tipo === "investimento");
  const hoje = new Date().toLocaleDateString("sv-SE");

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <LinkVoltar href="/financas" texto="Finanças" />
      <h1 className="text-2xl font-display font-semibold mt-4 mb-2">Guardar em investimento</h1>
      <p className="text-ink-400 text-sm mb-6">
        Move o dinheiro de uma conta comum pra uma conta de investimento. Esse valor sai do seu saldo disponível
        e passa a contar no total guardado, separado.
      </p>

      {erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(erro)}
        </p>
      )}

      {snapshot !== undefined && contasInvestimento.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-6 text-center">
          <p className="text-sm text-ink-400 mb-4">
            Você ainda não tem nenhuma conta do tipo "Investimento". Cria uma primeiro pra poder guardar
            dinheiro nela.
          </p>
          <Link
            href="/financas/contas"
            className="inline-block bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition"
          >
            Criar conta de investimento
          </Link>
        </div>
      ) : (
        <form action={transferirParaInvestimento} className="space-y-4">
          <div>
            <label className="block text-xs text-ink-400 mb-1.5">De qual conta sai o dinheiro</label>
            <select
              name="contaOrigemId"
              required
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            >
              {contasOrigem.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-ink-400 mb-1.5">Pra qual conta de investimento vai</label>
            <select
              name="contaInvestimentoId"
              required
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            >
              {contasInvestimento.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-ink-400 mb-1.5">Valor</label>
            <input
              name="valor"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              required
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 font-mono focus:border-ink-100 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-400 mb-1.5">Data</label>
            <input
              name="data"
              type="date"
              defaultValue={hoje}
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            />
          </div>

          <BotaoSalvarFormulario className="w-full bg-financa text-base-900 font-semibold rounded-lg py-2.5 hover:opacity-90 transition disabled:opacity-50">
            Guardar
          </BotaoSalvarFormulario>
        </form>
      )}
    </main>
  );
}
