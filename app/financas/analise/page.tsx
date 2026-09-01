import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/habitos/streak";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { buscarInsightsFinanceiros } from "@/lib/financas/insights";
import { TreemapGastos } from "@/components/TreemapGastos";
import { GraficoAcumulado } from "@/components/GraficoAcumulado";
import { RadarOrcamento } from "@/components/RadarOrcamento";

export default async function AnaliseFinanceiraPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const supabase = createClient();
  const mesReferencia = searchParams.mes ?? hojeISO();

  const insights = await buscarInsightsFinanceiros(supabase, mesReferencia);
  const {
    categorias, totalDespesasMes, totalDespesasMesAnterior, maiorGasto, acumulado, dicas, orcamentoComparado,
  } = insights;

  const nomeMes = new Date(mesReferencia + "T00:00:00").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  function linkMes(deslocamento: number) {
    const d = new Date(mesReferencia + "T00:00:00");
    d.setMonth(d.getMonth() + deslocamento);
    return `/financas/analise?mes=${d.toLocaleDateString("sv-SE")}`;
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>

      <div className="flex items-center justify-between mt-4 mb-6">
        <h1 className="text-2xl font-display font-semibold">Para onde vai seu dinheiro</h1>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        <Link href={linkMes(-1)} className="text-ink-400 hover:text-ink-100 transition px-2">‹</Link>
        <p className="text-sm font-medium capitalize w-40 text-center">{nomeMes}</p>
        <Link href={linkMes(1)} className="text-ink-400 hover:text-ink-100 transition px-2">›</Link>
      </div>

      {categorias.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
          <p className="font-display font-semibold mb-1">Nada por aqui ainda</p>
          <p className="text-ink-400 text-sm">Lance algumas despesas nesse mês pra ver a análise.</p>
        </div>
      ) : (
        <>
          {/* Dicas automáticas */}
          <div className="space-y-2 mb-6">
            {dicas.map((dica, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-financa-soft border border-financa/30 rounded-xl2 p-4"
              >
                <span className="text-lg shrink-0">💡</span>
                <p className="text-sm text-ink-100">{dica}</p>
              </div>
            ))}
          </div>

          {/* Total do mês + comparação */}
          <div className="bg-base-800 border border-base-600 rounded-xl2 p-5 mb-6">
            <p className="text-ink-400 text-sm mb-1">Total gasto em {nomeMes}</p>
            <p className="text-3xl font-display font-semibold font-mono mb-1">
              {formatarMoeda(totalDespesasMes)}
            </p>
            {totalDespesasMesAnterior > 0 && (
              <p className={`text-sm ${totalDespesasMes <= totalDespesasMesAnterior ? "text-habito" : "text-red-400"}`}>
                {totalDespesasMes <= totalDespesasMesAnterior ? "↓" : "↑"}{" "}
                {Math.abs(
                  ((totalDespesasMes - totalDespesasMesAnterior) / totalDespesasMesAnterior) * 100
                ).toFixed(0)}
                % em relação ao mês anterior ({formatarMoeda(totalDespesasMesAnterior)})
              </p>
            )}
            {maiorGasto && (
              <p className="text-xs text-ink-400 mt-2">
                Maior gasto individual: <span className="text-ink-100">{maiorGasto.descricao}</span> —{" "}
                {formatarMoeda(maiorGasto.valor)}
              </p>
            )}
          </div>

          {/* Treemap */}
          <div className="mb-6">
            <p className="text-sm text-ink-400 mb-3">Mapa de gastos — quanto maior o bloco, mais você gastou</p>
            <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
              <TreemapGastos dados={categorias.map((c) => ({ nome: c.nome, valor: c.valor }))} />
            </div>
          </div>

          {/* Acumulado do mês */}
          <div className="mb-6">
            <p className="text-sm text-ink-400 mb-3">Acumulado ao longo do mês</p>
            <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
              <GraficoAcumulado dados={acumulado} />
            </div>
          </div>

          {/* Radar orçamento */}
          {orcamentoComparado.length >= 3 && (
            <div className="mb-6">
              <p className="text-sm text-ink-400 mb-3">Orçamento planejado x realizado</p>
              <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
                <RadarOrcamento dados={orcamentoComparado} />
              </div>
            </div>
          )}

          {/* Ranking de categorias */}
          <div className="mb-6">
            <p className="text-sm text-ink-400 mb-3">Ranking do mês</p>
            <div className="bg-base-800 border border-base-600 rounded-xl2 divide-y divide-base-600">
              {categorias.map((c, i) => {
                const percentual = totalDespesasMes > 0 ? (c.valor / totalDespesasMes) * 100 : 0;
                return (
                  <div key={c.nome} className="p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-400 font-mono w-4">{i + 1}</span>
                        <span className="text-sm font-medium">{c.nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.variacaoPercentual !== null && (
                          <span
                            className={`text-xs font-mono ${
                              c.variacaoPercentual > 0 ? "text-red-400" : "text-habito"
                            }`}
                          >
                            {c.variacaoPercentual > 0 ? "↑" : "↓"} {Math.abs(c.variacaoPercentual * 100).toFixed(0)}%
                          </span>
                        )}
                        <span className="text-sm font-mono">{formatarMoeda(c.valor)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-base-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-financa rounded-full"
                        style={{ width: `${Math.max(2, percentual)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
