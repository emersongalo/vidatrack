"use client";

import Link from "next/link";
import { habitoDevidoNoDia, pausasDe } from "@/lib/habitos/pausa";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO, calcularStreak } from "@/lib/habitos/streak";
import { diaBateComFrequencia } from "@/lib/agenda/dias";
import { hexDaCor } from "@/lib/agenda/estilo";
import { IconeHabito } from "@/components/IconeHabito";
import { GraficoConsistenciaLazy as GraficoConsistencia } from "@/components/GraficoConsistenciaLazy";
import { MapaContribuicoes } from "@/components/MapaContribuicoes";
import { calcularMapaContribuicoes } from "@/lib/habitos/mapa-contribuicoes";
import type { SnapshotOffline } from "@/lib/offline/snapshot";
import { SugestoesLembrete } from "@/components/SugestoesLembrete";
import { PadroesSemana } from "@/components/PadroesSemana";

function ultimosNDias(n: number): string[] {
  const dias: string[] = [];
  const hoje = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    dias.push(d.toLocaleDateString("sv-SE"));
  }
  return dias;
}

// Etapa 127: toda a conta aqui já era pura (nenhuma consulta extra
// no meio do cálculo) — só precisava de habitos+checkins, que já
// vêm prontos no retrato local. Isso virou uma conversão direta,
// sem precisar reescrever a lógica.
export default function EstatisticasHabitosPage() {
  const { snapshot } = useSnapshotOffline();

  if (snapshot === undefined) {
    return (
      <main className="min-h-screen p-6 md:p-12 pagina pb-16 animate-pulse">
        <div className="h-40 bg-base-800 border border-base-600 rounded-xl2" />
      </main>
    );
  }

  const habitos = snapshot?.habitos ?? [];
  const checkins = snapshot?.habitoCheckins ?? [];

  const janela = ultimosNDias(30);

  const checkinsPorHabito = new Map<string, Map<string, number>>();
  for (const c of checkins) {
    if (!checkinsPorHabito.has(c.habito_id)) checkinsPorHabito.set(c.habito_id, new Map());
    checkinsPorHabito.get(c.habito_id)!.set(c.data, c.quantidade);
  }

  const checkinsPorHabitoAno = new Map<string, Set<string>>();
  for (const c of checkins) {
    if (!checkinsPorHabitoAno.has(c.habito_id)) checkinsPorHabitoAno.set(c.habito_id, new Set());
    checkinsPorHabitoAno.get(c.habito_id)!.add(c.data);
  }

  const mapaContribuicoes = calcularMapaContribuicoes(habitos, checkinsPorHabitoAno, 365, hojeISO());

  const sete7DiasAtuais = janela.slice(-7);
  const sete7DiasAnteriores = janela.slice(-14, -7);

  function calcularResumo(dias: string[]) {
    let aplicaveis = 0;
    let feitos = 0;
    const porHabito = habitos.map((habito: any) => {
      const mapaDatas = checkinsPorHabito.get(habito.id) ?? new Map();
      const meta = habito.meta_diaria ?? 1;
      let aplicaveisHabito = 0;
      let feitosHabito = 0;
      for (const d of dias) {
        if (habitoDevidoNoDia(habito, d)) {
          aplicaveisHabito++;
          if ((mapaDatas.get(d) ?? 0) >= meta) feitosHabito++;
        }
      }
      aplicaveis += aplicaveisHabito;
      feitos += feitosHabito;
      return { habito, aplicaveis: aplicaveisHabito, feitos: feitosHabito };
    });
    return {
      aplicaveis,
      feitos,
      percentual: aplicaveis ? Math.round((feitos / aplicaveis) * 100) : 0,
      porHabito,
    };
  }

  const resumoAtual = calcularResumo(sete7DiasAtuais);
  const resumoAnterior = calcularResumo(sete7DiasAnteriores);

  // Etapa 165 — "placar" geral: qual a maior sequência ativa entre
  // TODOS os hábitos agora (não é a de um hábito só — é o seu melhor
  // resultado do momento, pra comemorar o que está indo bem).
  let melhorSequenciaGeral = { nome: "", dias: 0 };
  for (const habito of habitos as any[]) {
    const mapaDatas = checkinsPorHabito.get(habito.id) ?? new Map();
    const meta = habito.meta_diaria ?? 1;
    const datasFeitas = Array.from(mapaDatas.entries())
      .filter(([, qtd]) => (qtd as number) >= meta)
      .map(([data]) => data as string);
    const streak = calcularStreak(datasFeitas, pausasDe(habito));
    if (streak > melhorSequenciaGeral.dias) melhorSequenciaGeral = { nome: habito.nome, dias: streak };
  }

  const comDadosEstaSemana = resumoAtual.porHabito
    .filter((p) => p.aplicaveis > 0)
    .map((p) => ({ ...p, pct: Math.round((p.feitos / p.aplicaveis) * 100) }));
  const melhorHabito = comDadosEstaSemana.length
    ? comDadosEstaSemana.reduce((a, b) => (b.pct > a.pct ? b : a))
    : null;
  const piorHabito = comDadosEstaSemana.length
    ? comDadosEstaSemana.reduce((a, b) => (b.pct < a.pct ? b : a))
    : null;

  const comparacaoOrdenada = [...comDadosEstaSemana].sort((a, b) => b.pct - a.pct);
  const diferencaSemanas = resumoAtual.percentual - resumoAnterior.percentual;

  const dicas: string[] = [];
  if (resumoAtual.aplicaveis === 0) {
    dicas.push("Ainda não há dados suficientes essa semana pra gerar dicas.");
  } else {
    if (resumoAnterior.aplicaveis > 0 && diferencaSemanas > 0) {
      dicas.push(`Você melhorou ${diferencaSemanas} pontos percentuais em relação à semana passada.`);
    } else if (resumoAnterior.aplicaveis > 0 && diferencaSemanas < 0) {
      dicas.push(`Essa semana caiu ${Math.abs(diferencaSemanas)} pontos percentuais em relação à passada — ainda dá tempo de virar.`);
    }
    if (melhorHabito && melhorHabito.pct === 100) {
      dicas.push(`${melhorHabito.habito.nome} está com 100% essa semana — mandou bem!`);
    }
    if (piorHabito && piorHabito.pct < 50 && piorHabito.habito.id !== melhorHabito?.habito.id) {
      dicas.push(`${piorHabito.habito.nome} está com ${piorHabito.pct}% essa semana — o que mais precisa de atenção agora.`);
    }
    if (dicas.length === 0) {
      dicas.push("Sem grandes mudanças em relação à semana passada — mantendo o ritmo.");
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-12 pagina pb-16">
      <Link href="/habitos/lista" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Hábitos
      </Link>
      <div className="flex items-center justify-between gap-3 mt-4 mb-6">
        <h1 className="text-3xl font-display font-bold">Estatísticas</h1>
        <Link
          href="/habitos/conquistas"
          className="shrink-0 text-base px-4 py-2 rounded-full bg-base-800 border border-base-600 hover:border-habito/60 transition"
        >
          🏆 Conquistas →
        </Link>
      </div>
      {/* Etapa 227 — resumo em 3 cartões, no estilo da Análise de Finanças */}
      {habitos.length > 0 && (() => {
        const mes = calcularResumo(janela);
        return (
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-base-800 border border-base-600 rounded-2xl p-3 min-w-0">
              <p className="text-sm text-ink-400">Esta semana</p>
              <p className="text-xl font-semibold mt-0.5">{resumoAtual.percentual}%</p>
              {resumoAnterior.aplicaveis > 0 && diferencaSemanas !== 0 && (
                <p className={`text-xs ${diferencaSemanas > 0 ? "text-habito" : "text-red-400"}`}>
                  {diferencaSemanas > 0 ? "↑" : "↓"} {Math.abs(diferencaSemanas)} pts
                </p>
              )}
            </div>
            <div className="bg-base-800 border border-base-600 rounded-2xl p-3 min-w-0">
              <p className="text-sm text-ink-400">30 dias</p>
              <p className="text-xl font-semibold mt-0.5">{mes.percentual}%</p>
              <p className="text-xs text-ink-400">
                {mes.feitos} de {mes.aplicaveis}
              </p>
            </div>
            <div className="bg-base-800 border border-base-600 rounded-2xl p-3 min-w-0">
              <p className="text-sm text-ink-400">🔥 Sequência</p>
              <p className="text-xl font-semibold mt-0.5">{melhorSequenciaGeral.dias}</p>
              <p className="text-xs text-ink-400 truncate">{melhorSequenciaGeral.dias > 0 ? melhorSequenciaGeral.nome : "—"}</p>
            </div>
          </div>
        );
      })()}

      {/* Etapa 215 */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-6 scrollbar-none">
        <Link href="/habitos/diario" className="shrink-0 text-base px-4 py-2 rounded-full bg-base-800 border border-base-600 hover:border-nota/60 transition">
          🙂 Diário
        </Link>
        <Link href="/habitos/metas" className="shrink-0 text-base px-4 py-2 rounded-full bg-base-800 border border-base-600 hover:border-habito/60 transition">
          🎯 Metas do ano
        </Link>
        <Link href="/habitos/desafios" className="shrink-0 text-base px-4 py-2 rounded-full bg-base-800 border border-base-600 hover:border-habito/60 transition">
          🤝 Desafios
        </Link>
        {/* Etapa 221 */}
        <Link href="/habitos/semana" className="shrink-0 text-base px-4 py-2 rounded-full bg-base-800 border border-base-600 hover:border-habito/60 transition">
          📊 Sua semana
        </Link>
        <Link href="/habitos/rotina" className="shrink-0 text-base px-4 py-2 rounded-full bg-base-800 border border-base-600 hover:border-habito/60 transition">
          ☀️ Rotinas
        </Link>
        <Link href="/retrospectiva" className="shrink-0 text-base px-4 py-2 rounded-full bg-base-800 border border-base-600 hover:border-financa/60 transition">
          🎉 Retrospectiva do ano
        </Link>
      </div>
      {snapshot && <SugestoesLembrete snapshot={snapshot} hojeISO={hojeISO()} />}
      {snapshot && <PadroesSemana snapshot={snapshot} hojeISO={hojeISO()} />}

      {habitos.length > 0 && (
        <div className="bg-base-800 border border-base-600 rounded-2xl p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">Resumo da semana</h2>
          <div className="flex items-end gap-6 mb-4">
            <div>
              <p className="text-3xl font-display font-bold">{resumoAtual.percentual}%</p>
              <p className="text-xs text-ink-400">Essa semana</p>
            </div>
            <div>
              <p className="text-lg font-mono text-ink-400">{resumoAnterior.percentual}%</p>
              <p className="text-xs text-ink-400">Semana passada</p>
            </div>
            {resumoAnterior.aplicaveis > 0 && diferencaSemanas !== 0 && (
              <span className={`text-sm font-medium ${diferencaSemanas > 0 ? "text-habito" : "text-red-400"}`}>
                {diferencaSemanas > 0 ? "↑" : "↓"} {Math.abs(diferencaSemanas)} pts
              </span>
            )}
          </div>
          {melhorSequenciaGeral.dias > 0 && (
            <p className="text-xs text-ink-400 mb-3 flex items-center gap-1.5">
              🔥 Sua melhor sequência agora: <span className="text-ink-100 font-medium">{melhorSequenciaGeral.nome}</span>, há{" "}
              <span className="text-habito font-medium">{melhorSequenciaGeral.dias} dias</span>
            </p>
          )}
          <div className="space-y-1.5">
            {dicas.map((dica, i) => (
              <p key={i} className="text-xs text-ink-400 flex items-start gap-1.5">
                <span className="shrink-0">💡</span> {dica}
              </p>
            ))}
          </div>
        </div>
      )}

      {habitos.length > 0 && (
        <div className="bg-base-800 border border-base-600 rounded-2xl p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">Mapa de contribuições · último ano</h2>
          <MapaContribuicoes pontos={mapaContribuicoes} />
        </div>
      )}

      {comparacaoOrdenada.length > 1 && (
        <div className="bg-base-800 border border-base-600 rounded-2xl p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">Comparação entre hábitos · essa semana</h2>
          <div className="space-y-3">
            {comparacaoOrdenada.map((c) => (
              <div key={c.habito.id}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm truncate">{c.habito.nome}</span>
                  <span className="text-xs font-mono text-ink-400 shrink-0">{c.pct}%</span>
                </div>
                <div className="h-1.5 bg-base-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.pct >= 70 ? "bg-habito" : c.pct >= 40 ? "bg-financa" : "bg-red-400"}`}
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {habitos.length === 0 ? (
        <p className="text-ink-400 text-sm">Crie um hábito para ver as estatísticas aqui.</p>
      ) : (
        <div className="space-y-6">
          {habitos.map((habito: any) => {
            const mapaDatas = checkinsPorHabito.get(habito.id) ?? new Map();
            const meta = habito.meta_diaria ?? 1;

            const diasAplicaveis = janela.filter((d) =>
              habitoDevidoNoDia(habito, d)
            );

            const dadosGrafico = janela.map((d) => ({
              dia: d.slice(8, 10),
              feito:
                habitoDevidoNoDia(habito, d) &&
                (mapaDatas.get(d) ?? 0) >= meta
                  ? 1
                  : 0,
            }));

            const feitosNoPeriodo = diasAplicaveis.filter((d) => (mapaDatas.get(d) ?? 0) >= meta).length;
            const percentual = diasAplicaveis.length ? Math.round((feitosNoPeriodo / diasAplicaveis.length) * 100) : 0;

            return (
              <div key={habito.id} className="bg-base-800 border border-base-600 rounded-xl2 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg"><IconeHabito icone={habito.icone} /></span>
                    <p className="font-medium">{habito.nome}</p>
                  </div>
                  <p className="text-sm font-mono text-ink-400">
                    {percentual}% <span className="text-xs">últimos 30 dias</span>
                  </p>
                </div>
                <GraficoConsistencia dados={dadosGrafico} cor={hexDaCor(habito.cor)} />
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
