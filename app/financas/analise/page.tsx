"use client";

import { useState } from "react";
import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { hojeISO } from "@/lib/habitos/streak";
import { formatarMoeda, primeiroDiaDoMes, ultimoDiaDoMes } from "@/lib/financas/formatacao";
import { calcularInsightsFinanceiros, calcularComparacaoSemanal } from "@/lib/financas/insights-calculo";
import { TreemapGastosLazy as TreemapGastos } from "@/components/TreemapGastosLazy";
import { GraficoComparacaoMensalLazy as GraficoComparacaoMensal } from "@/components/GraficoComparacaoMensalLazy";
import { GraficoAcumuladoLazy as GraficoAcumulado } from "@/components/GraficoAcumuladoLazy";
import { RadarOrcamentoLazy as RadarOrcamento } from "@/components/RadarOrcamentoLazy";
import { MapaCalorGastos } from "@/components/MapaCalorGastos";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { gastosForaDoNormal } from "@/lib/financas/alertas";
import { SugestoesRecorrentes } from "@/components/SugestoesRecorrentes";

// Etapa 128 — o cálculo pesado (lib/financas/insights-calculo.ts) já
// era puro; só precisava alimentar com as transações certas vindas
// do retrato local em vez de uma consulta nova.
export default function AnaliseFinanceiraPage() {
  const { snapshot } = useSnapshotOffline();
  const [mesReferencia, setMesReferencia] = useState(hojeISO());

  if (snapshot === undefined) {
    return (
      <main className="min-h-screen p-6 md:p-12 pagina animate-pulse">
        <div className="h-40 bg-base-800 border border-base-600 rounded-xl2" />
      </main>
    );
  }

  const mapaCategorias = new Map((snapshot?.financas.categorias ?? []).map((c: any) => [c.id, c.nome]));
  // Etapa 217 — mês atual/passado: só o que já foi gasto (data até hoje
  // ou marcado "Paguei"). Mês futuro: o que está agendado (previsão).
  const hojeRef = hojeISO();
  const mesFuturo = mesReferencia.slice(0, 7) > hojeRef.slice(0, 7);
  const transacoesDespesa = (snapshot?.financas.transacoes ?? [])
    .filter((t: any) => t.tipo === "despesa" && !t.transferencia_grupo)
    .filter((t: any) => mesFuturo || t.data <= hojeRef || t.pago_em)
    .map((t: any) => ({
      valor: Number(t.valor),
      descricao: t.descricao,
      data: t.data,
      nomeCategoria: (t.categoria_id && mapaCategorias.get(t.categoria_id)) || "Sem categoria",
    }));

  const categoriasComMeta = (snapshot?.financas.categorias ?? [])
    .filter((c: any) => c.tipo === "despesa" && c.meta_mensal !== null)
    .map((c: any) => ({ nome: c.nome, meta_mensal: Number(c.meta_mensal) }));

  const insights = calcularInsightsFinanceiros(transacoesDespesa, categoriasComMeta, mesReferencia, hojeISO());
  const { categorias, totalDespesasMes, totalDespesasMesAnterior, maiorGasto, acumulado, acumuladoMesAnterior, dicas, orcamentoComparado, projecaoFimDoMes } = insights;
  const { gastoSemanaAtual, gastoSemanaAnterior } = calcularComparacaoSemanal(transacoesDespesa, hojeISO());

  // Etapa 175 — gasto por dia do mês sendo visto, pro mapa de calor.
  const inicioMesVisto = primeiroDiaDoMes(mesReferencia);
  const fimMesVisto = ultimoDiaDoMes(mesReferencia);
  const gastoPorDiaMapa = new Map<number, number>();
  for (const t of transacoesDespesa) {
    if (t.data < inicioMesVisto || t.data > fimMesVisto) continue;
    const dia = Number(t.data.slice(8, 10));
    gastoPorDiaMapa.set(dia, (gastoPorDiaMapa.get(dia) ?? 0) + t.valor);
  }

  // Etapa 197 — a Análise agrupa por NOME; aqui volta pro id pra montar
  // o link do Extrato filtrado (tocar num bloco/barra → lançamentos dela).
  const idPorNome = new Map<string, string>();
  for (const c of snapshot?.financas.categorias ?? []) {
    if ((c as any).tipo === "despesa" && !idPorNome.has((c as any).nome)) idPorNome.set((c as any).nome, (c as any).id);
  }
  const mesVisto = mesReferencia.slice(0, 7);
  const hrefCategoria = (nome: string) =>
    `/financas/extrato?categoria=${idPorNome.get(nome) ?? "sem"}&tipo=despesa&mes=${mesVisto}`;

  // Etapa 215 — categorias bem acima da média dos 3 meses anteriores
  const hojeAgora = hojeISO();
  const refForaDoNormal = ultimoDiaDoMes(mesReferencia) < hojeAgora ? ultimoDiaDoMes(mesReferencia) : hojeAgora;
  const foraDoNormal = gastosForaDoNormal((snapshot?.financas.transacoes ?? []) as any, refForaDoNormal, { minimoPercentual: 20, minimoValor: 30 });
  const ehMesCorrente = mesReferencia.slice(0, 7) === hojeAgora.slice(0, 7);

  const nomeMes = new Date(mesReferencia + "T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  function mudarMes(deslocamento: number) {
    const d = new Date(mesReferencia + "T00:00:00");
    d.setMonth(d.getMonth() + deslocamento);
    setMesReferencia(d.toLocaleDateString("sv-SE"));
  }

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>

      <div className="flex items-center justify-between mt-4 mb-6">
        <h1 className="text-2xl font-display font-semibold">Para onde vai seu dinheiro</h1>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={() => mudarMes(-1)} className="text-ink-400 hover:text-ink-100 transition px-2">‹</button>
        <p className="text-sm font-medium capitalize w-40 text-center">{nomeMes}</p>
        <button onClick={() => mudarMes(1)} className="text-ink-400 hover:text-ink-100 transition px-2">›</button>
      </div>

      {mesFuturo && (
        <p className="mb-4 text-xs text-ink-400 bg-base-800 border border-base-600 rounded-lg px-3 py-2">
          📅 Mês que ainda não chegou: aqui aparece só o que já está agendado (contas fixas e lançamentos com data futura).
        </p>
      )}

      {categorias.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
          <p className="font-display font-semibold mb-1">Nada por aqui ainda</p>
          <p className="text-ink-400 text-sm">Lance algumas despesas nesse mês pra ver a análise.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-6">
            {(mesFuturo ? [] : dicas).map((dica, i) => (
              <div key={i} className="flex items-start gap-3 bg-financa-soft border border-financa/30 rounded-xl2 p-4">
                <span className="text-financa shrink-0">
                  <Lightbulb size={18} strokeWidth={2} />
                </span>
                <p className="text-sm text-ink-100">{dica}</p>
              </div>
            ))}
          </div>

          {foraDoNormal.length > 0 && (
            <div className="bg-base-800 border border-red-400/30 rounded-xl2 p-4 mb-6">
              <p className="text-sm font-medium mb-1">📈 Fora do normal</p>
              <p className="text-xs text-ink-400 mb-3">Comparado com a média dos 3 meses anteriores</p>
              <ul className="space-y-2">
                {foraDoNormal.map((g) => {
                  const nome = mapaCategorias.get(g.categoriaId) ?? "Categoria";
                  return (
                    <li key={g.categoriaId}>
                      <Link href={hrefCategoria(nome)} className="flex items-center justify-between gap-3 text-sm hover:text-financa transition">
                        <span className="truncate">{nome}</span>
                        <span className="shrink-0 text-right">
                          <span className="font-mono">{formatarMoeda(g.gastoMes)}</span>
                          <span className="text-xs text-red-400 ml-2">+{g.percentualAcima}%</span>
                          <span className="block text-[11px] text-ink-400">média {formatarMoeda(g.media)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="bg-base-800 border border-base-600 rounded-xl2 p-5 mb-6">
            <p className="text-ink-400 text-sm mb-1">{mesFuturo ? `Previsto para ${nomeMes}` : `Total gasto em ${nomeMes}`}</p>
            <p className="text-3xl font-display font-semibold font-mono mb-1">{formatarMoeda(totalDespesasMes)}</p>
            {totalDespesasMesAnterior > 0 && (
              <p className={`text-sm ${totalDespesasMes <= totalDespesasMesAnterior ? "text-habito" : "text-red-400"}`}>
                {totalDespesasMes <= totalDespesasMesAnterior ? "↓" : "↑"}{" "}
                {Math.abs(((totalDespesasMes - totalDespesasMesAnterior) / totalDespesasMesAnterior) * 100).toFixed(0)}%
                em relação ao mês anterior ({formatarMoeda(totalDespesasMesAnterior)})
              </p>
            )}
            {maiorGasto && (
              <p className="text-xs text-ink-400 mt-2">
                Maior gasto individual: <span className="text-ink-100">{maiorGasto.descricao}</span> — {formatarMoeda(maiorGasto.valor)}
              </p>
            )}
            {projecaoFimDoMes !== null && (
              <div className="mt-3 pt-3 border-t border-base-600 flex items-center justify-between">
                <p className="text-xs text-ink-400">No ritmo de hoje, deve fechar o mês em</p>
                <p className="text-sm font-mono font-medium text-financa">{formatarMoeda(projecaoFimDoMes)}</p>
              </div>
            )}
          </div>

          {/* Etapa 165 — ritmo recente, sempre relativo a HOJE (não
             ao mês sendo navegado na tela) — por isso fica numa
             comparação separada da "este mês x mês passado" acima. */}
          <div className="bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 p-5 mb-6">
            <p className="text-sm text-ink-400 mb-3">Essa semana x semana passada</p>
            <div className="flex items-end gap-6">
              <div>
                <p className="text-2xl font-display font-bold font-mono">{formatarMoeda(gastoSemanaAtual)}</p>
                <p className="text-xs text-ink-400">Últimos 7 dias</p>
              </div>
              <div>
                <p className="text-base font-mono text-ink-400">{formatarMoeda(gastoSemanaAnterior)}</p>
                <p className="text-xs text-ink-400">7 dias anteriores</p>
              </div>
              {gastoSemanaAnterior > 0 && gastoSemanaAtual !== gastoSemanaAnterior && (
                <span
                  className={`text-sm font-medium ${gastoSemanaAtual < gastoSemanaAnterior ? "text-habito" : "text-red-400"}`}
                >
                  {gastoSemanaAtual < gastoSemanaAnterior ? "↓" : "↑"}{" "}
                  {Math.abs(((gastoSemanaAtual - gastoSemanaAnterior) / gastoSemanaAnterior) * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-ink-400 mb-3">Mapa de gastos — quanto maior o bloco, mais você gastou</p>
            <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
              <TreemapGastos dados={categorias.map((c) => ({ nome: c.nome, valor: c.valor, href: hrefCategoria(c.nome) }))} />
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-ink-400 mb-3">Este mês x mês passado, por categoria</p>
            <GraficoComparacaoMensal
              dados={categorias.map((c) => ({ nome: c.nome, valor: c.valor, valorMesAnterior: c.valorMesAnterior, href: hrefCategoria(c.nome) }))}
            />
          </div>

          <div className="mb-6">
            <p className="text-sm text-ink-400 mb-3">Ritmo de gasto — este mês x mês passado</p>
            <div className="bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 p-4">
              <GraficoAcumulado dados={acumulado} dadosMesAnterior={acumuladoMesAnterior} />
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-ink-400 mb-3">Mapa de calor — gasto por dia</p>
            <div className="bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 p-4">
              <MapaCalorGastos
                anoMesISO={mesVisto}
                gastoPorDia={gastoPorDiaMapa}
                hrefDoDia={(dia) => `/financas/extrato?tipo=despesa&dia=${dia}`}
              />
            </div>
          </div>

          {orcamentoComparado.length >= 3 && (
            <div className="mb-6">
              <p className="text-sm text-ink-400 mb-3">Orçamento planejado x realizado</p>
              <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
                <RadarOrcamento dados={orcamentoComparado} />
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm text-ink-400 mb-3">Ranking do mês</p>
            <div className="bg-base-800 border border-base-600 rounded-xl2 divide-y divide-base-600">
              {categorias.map((c, i) => {
                const percentual = totalDespesasMes > 0 ? (c.valor / totalDespesasMes) * 100 : 0;
                return (
                  <Link key={c.nome} href={hrefCategoria(c.nome)} className="block p-4 hover:bg-base-700/50 transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-400 font-mono w-4">{i + 1}</span>
                        <span className="text-sm font-medium">{c.nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.variacaoPercentual !== null && (
                          <span className={`text-xs font-mono ${c.variacaoPercentual > 0 ? "text-red-400" : "text-habito"}`}>
                            {c.variacaoPercentual > 0 ? "↑" : "↓"} {Math.abs(c.variacaoPercentual * 100).toFixed(0)}%
                          </span>
                        )}
                        <span className="text-sm font-mono">{formatarMoeda(c.valor)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-base-600 rounded-full overflow-hidden">
                      <div className="h-full bg-financa rounded-full" style={{ width: `${Math.max(2, percentual)}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
      {snapshot && ehMesCorrente && (
        <div className="mt-6">
          <SugestoesRecorrentes snapshot={snapshot} hojeISO={hojeAgora} />
        </div>
      )}
    </main>
  );
}
