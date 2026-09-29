"use client";

import Link from "next/link";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { totaisPorEtiqueta } from "@/lib/financas/etiquetas";
import { ValorMonetario } from "@/components/ValorMonetario";

// Etapa 218 — quanto foi em cada etiqueta (ex: "viagem praia"), misturando categorias
export default function EtiquetasPage() {
  const { snapshot } = useSnapshotOffline();
  const grupos = totaisPorEtiqueta((snapshot?.financas.transacoes ?? []) as any[]);
  const ddmm = (iso: string) => iso.split("-").reverse().join("/");

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <Link href="/financas/mais" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Mais
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-1">Etiquetas</h1>
      <p className="text-ink-400 text-sm mb-6">
        Junte gastos de categorias diferentes num assunto só — tipo #viagem-praia ou #reforma. Adicione etiquetas ao lançar
        ou editar um lançamento.
      </p>

      {snapshot === undefined ? null : grupos.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
          <p className="text-3xl mb-2">🏷️</p>
          <p className="font-display font-semibold mb-1">Nenhuma etiqueta ainda</p>
          <p className="text-ink-400 text-sm">No formulário de lançamento, use o campo “Etiquetas”.</p>
        </div>
      ) : (
        <ul className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {grupos.map((g) => (
            <li key={g.etiqueta}>
              <Link
                href={`/financas/extrato?etiqueta=${encodeURIComponent(g.etiqueta)}&periodo=tudo`}
                className="block bg-base-800 border border-base-600 rounded-xl2 p-4 hover:border-nota transition"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-nota truncate">#{g.etiqueta}</span>
                  <span className="font-mono text-red-400 shrink-0">
                    -<ValorMonetario valor={g.despesas} />
                  </span>
                </div>
                <p className="text-xs text-ink-400 mt-1">
                  {g.quantidade} lançamento{g.quantidade > 1 ? "s" : ""} · {ddmm(g.primeira)}
                  {g.primeira !== g.ultima ? ` a ${ddmm(g.ultima)}` : ""}
                  {g.receitas > 0 && (
                    <span className="text-habito">
                      {" "}
                      · +<ValorMonetario valor={g.receitas} />
                    </span>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
