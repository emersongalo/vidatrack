"use client";

// Etapa 314 — relatório do mês dos hábitos (‹ mês anterior · próximo ›).
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { mesAnterior, mesSeguinte, nomeDoMes, NOMES_DIA_SEMANA, relatorioDoMes, type LinhaHabito } from "@/lib/habitos/relatorioMes";
import { CarregandoTela } from "@/components/Esqueleto";
import { CabecalhoPagina } from "@/components/CabecalhoPagina";

const LETRAS = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function RelatorioPage() {
  return (
    <Suspense fallback={null}>
      <Relatorio />
    </Suspense>
  );
}

function Relatorio() {
  const { snapshot } = useSnapshotOffline();
  const router = useRouter();
  const params = useSearchParams();
  const hoje = hojeISO();
  const mesHoje = hoje.slice(0, 7);
  const pedido = params.get("mes");
  const mes = pedido && /^\d{4}-\d{2}$/.test(pedido) && pedido <= mesHoje ? pedido : mesHoje;
  const r = useMemo(() => (snapshot ? relatorioDoMes(snapshot, mes, hoje) : null), [snapshot, mes, hoje]);

  if (snapshot === undefined || !r) return <CarregandoTela cartoes={3} linhas={3} />;
  const ir = (m: string) => router.replace(`/habitos/relatorio?mes=${m}`);
  const dif = r.taxa !== null && r.taxaAntes !== null ? r.taxa - r.taxaAntes : null;

  return (
    <main className="pagina-curta px-6 md:px-12 pt-4 pb-12">
      <CabecalhoPagina voltarHref="/habitos/estatisticas" voltarTexto="Estatísticas" emoji="📅" titulo="Relatório do mês" subtitulo="Como foram seus hábitos" />

      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => ir(mesAnterior(mes))} className="w-10 h-10 rounded-full bg-base-800 border border-base-600 text-lg" aria-label="Mês anterior">
          ‹
        </button>
        <p className="font-display font-bold text-lg text-center">
          {nomeDoMes(mes)}
          {!r.completo && <span className="block text-center text-[11px] font-normal text-ink-400">até hoje</span>}
        </p>
        <button
          type="button"
          disabled={mes >= mesHoje}
          onClick={() => ir(mesSeguinte(mes))}
          className="w-10 h-10 rounded-full bg-base-800 border border-base-600 text-lg disabled:opacity-30"
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      {r.devidos === 0 ? (
        <p className="text-sm text-ink-400 rounded-2xl border border-base-600 bg-base-800 px-4 py-6 text-center">Nenhum hábito nesse mês ainda.</p>
      ) : (
        <>
          {/* números grandes */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Numero titulo="cumprido" valor={`${r.taxa ?? 0}%`} sub={dif === null ? "" : dif === 0 ? "igual ao anterior" : `${dif > 0 ? "▲" : "▼"} ${Math.abs(dif)} pts`} cor={dif !== null && dif < 0 ? "text-red-300" : "text-habito"} />
            <Numero titulo="dias perfeitos" valor={String(r.diasPerfeitos)} sub="tudo feito" />
            <Numero titulo="melhor sequência" valor={String(r.melhorSequencia?.dias ?? 0)} sub={r.melhorSequencia?.nome ?? ""} />
          </div>

          {/* dia da semana */}
          <section className="rounded-3xl border border-base-600/70 bg-base-800 p-4 mb-4">
            <p className="text-xs uppercase tracking-wide text-ink-400 mb-3">Por dia da semana</p>
            <div className="flex items-end gap-2 h-24">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const x = r.porDiaSemana[d];
                const alto = x.taxa ?? 0;
                return (
                  <div key={d} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[10px] text-ink-400">{x.taxa === null ? "–" : `${x.taxa}%`}</span>
                    <div
                      className={`w-full rounded-t-md ${d === r.melhorDia ? "bg-habito" : d === r.piorDia ? "bg-amber-400/70" : "bg-base-600"}`}
                      style={{ height: `${Math.max(4, alto * 0.6)}%` }}
                    />
                    <span className={`text-[11px] ${d === r.melhorDia || d === r.piorDia ? "font-bold" : "text-ink-400"}`}>{LETRAS[d]}</span>
                  </div>
                );
              })}
            </div>
            {r.melhorDia !== null && r.piorDia !== null && r.melhorDia !== r.piorDia && (
              <p className="text-xs text-ink-400 mt-3">
                Mais forte: <span className="text-habito font-semibold">{NOMES_DIA_SEMANA[r.melhorDia]}</span> · mais difícil:{" "}
                <span className="text-amber-300 font-semibold">{NOMES_DIA_SEMANA[r.piorDia]}</span>
              </p>
            )}
          </section>

          {/* destaque e queda */}
          {(r.destaque || r.queda) && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {r.destaque && (
                <div className="rounded-2xl border border-habito/40 bg-habito/10 p-3">
                  <p className="text-[11px] text-ink-400">🌟 Destaque</p>
                  <p className="text-sm font-semibold leading-tight mt-1">{r.destaque.nome}</p>
                  <p className="text-xs text-habito mt-0.5">{r.destaque.taxa}% cumprido</p>
                </div>
              )}
              {r.queda && (
                <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3">
                  <p className="text-[11px] text-ink-400">📉 Caiu</p>
                  <p className="text-sm font-semibold leading-tight mt-1">{r.queda.nome}</p>
                  <p className="text-xs text-amber-300 mt-0.5">
                    {r.queda.taxaAntes}% → {r.queda.taxa}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* sugestões */}
          <section className="rounded-3xl border border-base-600/70 bg-base-800 p-4 mb-4">
            <p className="text-xs uppercase tracking-wide text-ink-400 mb-2">💡 Sugestões</p>
            <ul className="space-y-2">
              {r.sugestoes.map((t) => (
                <li key={t} className="text-sm leading-snug">
                  {t}
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-3">
              <Link href="/habitos/lista" className="text-xs font-semibold rounded-full bg-base-700 px-3 py-1.5">
                Ajustar hábitos
              </Link>
              <Link href="/habitos/trilhas" className="text-xs font-semibold rounded-full bg-base-700 px-3 py-1.5">
                🥇 Desafios
              </Link>
            </div>
          </section>

          {/* hábito por hábito */}
          <section>
            <p className="text-xs uppercase tracking-wide text-ink-400 mb-2">Hábito por hábito</p>
            <ul className="space-y-2">
              {r.habitos.map((l) => (
                <LinhaRelatorio key={l.id} l={l} />
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}

function Numero({ titulo, valor, sub, cor = "text-habito" }: { titulo: string; valor: string; sub: string; cor?: string }) {
  return (
    <div className="rounded-2xl border border-base-600 bg-base-800 px-2 py-3 text-center min-w-0">
      <p className={`text-2xl font-display font-bold ${cor}`}>{valor}</p>
      <p className="text-[11px] text-ink-300">{titulo}</p>
      {sub && <p className="text-[10px] text-ink-500 truncate">{sub}</p>}
    </div>
  );
}

function LinhaRelatorio({ l }: { l: LinhaHabito }) {
  const dif = l.taxa !== null && l.taxaAntes !== null ? l.taxa - l.taxaAntes : null;
  return (
    <li className="rounded-2xl border border-base-600 bg-base-800 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold truncate">{l.nome}</p>
        <p className="text-sm font-bold shrink-0">
          {l.taxa === null ? "–" : `${l.taxa}%`}
          {dif !== null && dif !== 0 && <span className={`ml-1 text-[11px] font-semibold ${dif > 0 ? "text-habito" : "text-red-300"}`}>{dif > 0 ? `▲${dif}` : `▼${-dif}`}</span>}
        </p>
      </div>
      <div className="h-1.5 rounded-full bg-base-700 overflow-hidden mt-1.5">
        <div className="h-full rounded-full bg-habito" style={{ width: `${l.taxa ?? 0}%` }} />
      </div>
      <p className="text-[11px] text-ink-400 mt-1">
        {l.tipo === "semanal" ? `${l.feitos} de ${l.devidos} semanas com a meta` : l.tipo === "parar" ? `${l.feitos} de ${l.devidos} dias limpos` : `${l.feitos} de ${l.devidos} dias`}
        {l.melhorSequencia > 1 && l.tipo !== "semanal" ? ` · melhor sequência ${l.melhorSequencia}` : ""}
      </p>
    </li>
  );
}
