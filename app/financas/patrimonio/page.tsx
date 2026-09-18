"use client";

import Link from "next/link";
import { GraficoPatrimonioLazy as GraficoPatrimonio } from "@/components/GraficoPatrimonioLazy";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 127: o cálculo (12 meses, incluindo o que está guardado em
// desafios) já vem pronto do retrato local — não precisa de nenhuma
// conta nova aqui, só exibir.
export default function PatrimonioPage() {
  const { snapshot } = useSnapshotOffline();
  const pontos = snapshot?.financas.patrimonio ?? [];

  const atual = pontos.at(-1)?.patrimonio ?? 0;
  const inicial = pontos[0]?.patrimonio ?? 0;
  const variacao = atual - inicial;

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md lg:max-w-3xl mx-auto">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-1">Patrimônio líquido</h1>
      <p className="text-ink-400 text-sm mb-6">
        Tudo que você tem somado — contas, investimentos e desafios em andamento — ao longo dos últimos 12 meses.
      </p>

      <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 mb-6">
        <p className="text-xs text-ink-400 mb-1">Patrimônio atual</p>
        <p className="text-3xl font-mono font-bold mb-2">{formatarMoeda(atual)}</p>
        {pontos.length > 0 && (
          <p className={`text-sm ${variacao >= 0 ? "text-habito" : "text-red-400"}`}>
            {variacao >= 0 ? "+" : ""}
            {formatarMoeda(variacao)} nos últimos 12 meses
          </p>
        )}
      </div>

      {pontos.length > 0 && <GraficoPatrimonio dados={pontos} />}
    </main>
  );
}
