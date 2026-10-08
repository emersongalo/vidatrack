"use client";

// Etapa 276 — resumo do dia (aberto pela notificação das 21:30 ou pelo Início)
import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { resumoDoPeriodo } from "@/lib/geral/resumoPeriodo";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";
import { CarregandoTela } from "@/components/Esqueleto";
import { AnelProgresso } from "@/components/AnelProgresso";
import { IconeHabito } from "@/components/IconeHabito";
import { IconeCategoria } from "@/components/IconeCategoria";
import { chuvaDeConfete } from "@/lib/app/festa";
import { emojiDoHumor } from "@/lib/habitos/diario";

export default function ResumoDiaPage() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

function Conteudo() {
  const params = useSearchParams();
  const { snapshot } = useSnapshotOffline();
  const ocultos = useValoresOcultos();
  const hoje = hojeISO();
  const diaParam = params.get("dia");
  const dia = diaParam && /^\d{4}-\d{2}-\d{2}$/.test(diaParam) && diaParam <= hoje ? diaParam : hoje;
  const r = useMemo(() => (snapshot ? resumoDoPeriodo(snapshot, dia, dia, hoje) : null), [snapshot, dia, hoje]);
  const completo = !!r && r.habitos.devidos > 0 && r.habitos.feitos >= r.habitos.devidos;

  useEffect(() => {
    if (completo) chuvaDeConfete({ quantidade: 60 });
  }, [completo]);

  if (snapshot === undefined) return <CarregandoTela cartoes={3} linhas={2} />;
  if (!snapshot || !r) {
    return (
      <main className="pagina-curta px-6 pt-6">
        <p className="text-ink-400">Abra o app com internet uma vez pra montar seu resumo.</p>
      </main>
    );
  }

  const dinheiro = (v: number) => (ocultos ? "R$ ••••" : formatarMoeda(v));
  const titulo = new Date(dia + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  const pendentes = r.habitos.lista.filter((h) => h.devidos > 0 && h.feitos < h.devidos);
  const frase = completo
    ? "Dia completo. Você mandou muito bem! 🏆"
    : r.habitos.feitos > 0 || r.tarefas.concluidas > 0
      ? "Cada passo conta. Amanhã tem mais! 💪"
      : "Dia de descanso também faz parte. 🌙";
  const humorDoDia = (snapshot.diario ?? []).find((d) => d.data === dia);

  return (
    <main className="pagina-curta px-6 md:px-12 pt-4 pb-12">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-ink-400 text-base hover:text-ink-100 transition">
          ← Início
        </Link>
        <div className="flex gap-2 text-sm">
          <Link href={`/resumo-dia?dia=${somarDias(dia, -1)}`} className="rounded-full border border-base-600 px-3 py-1 text-ink-400 hover:text-ink-100">
            ‹ Dia anterior
          </Link>
          {dia < hoje && (
            <Link href={`/resumo-dia?dia=${somarDias(dia, 1)}`} className="rounded-full border border-base-600 px-3 py-1 text-ink-400 hover:text-ink-100">
              Próximo ›
            </Link>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-3xl p-6 border border-habito/30 animate-quicar" style={{ background: "linear-gradient(135deg, rgba(127,184,148,0.22), rgba(156,143,217,0.12))" }}>
        <p className="text-sm text-ink-400 capitalize">{dia === hoje ? "Hoje · " : ""}{titulo}</p>
        <h1 className="text-2xl font-display font-bold mt-1">{frase}</h1>
        {humorDoDia && <p className="text-sm text-ink-400 mt-2">Humor do dia: {emojiDoHumor(humorDoDia.humor)}</p>}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 lista-entrar">
        <div className="bg-base-800 border border-base-600 rounded-2xl p-3 text-center">
          <p className="text-2xl">✅</p>
          <p className="text-lg font-semibold">{r.habitos.devidos ? `${r.habitos.feitos}/${r.habitos.devidos}` : "—"}</p>
          <p className="text-xs text-ink-400">hábitos</p>
        </div>
        <div className="bg-base-800 border border-base-600 rounded-2xl p-3 text-center">
          <p className="text-2xl">📋</p>
          <p className="text-lg font-semibold">{r.tarefas.concluidas}</p>
          <p className="text-xs text-ink-400">tarefas</p>
        </div>
        <div className="bg-base-800 border border-base-600 rounded-2xl p-3 text-center">
          <p className="text-2xl">💸</p>
          <p className="text-lg font-semibold font-mono break-words">{r.financas.despesas ? dinheiro(r.financas.despesas) : "R$ 0"}</p>
          <p className="text-xs text-ink-400">gastos</p>
        </div>
      </div>

      {r.habitos.lista.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center gap-4 mb-3">
            <AnelProgresso valor={r.habitos.feitos} total={Math.max(1, r.habitos.devidos)} tamanho={64} />
            <div>
              <h2 className="text-lg font-semibold">Hábitos</h2>
              <p className="text-sm text-ink-400">
                {pendentes.length === 0 ? "Todos feitos 🎉" : `${pendentes.length} ficaram pra amanhã`}
              </p>
            </div>
          </div>
          <ul className="bg-base-800 border border-base-600 rounded-2xl divide-y divide-base-600 overflow-hidden lista-entrar">
            {r.habitos.lista.map((h) => {
              const ok = h.feitos >= Math.max(1, h.devidos);
              return (
                <li key={h.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-9 h-9 rounded-full bg-base-700 flex items-center justify-center shrink-0">
                    <IconeHabito icone={h.icone} tamanho={17} />
                  </span>
                  <span className={`flex-1 min-w-0 truncate ${ok ? "" : "text-ink-400"}`}>{h.nome}</span>
                  <span className={`text-sm font-semibold ${ok ? "text-habito" : "text-ink-400"}`}>{ok ? "✓" : "—"}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {r.tarefas.titulos.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Tarefas concluídas</h2>
          <ul className="space-y-2 lista-entrar">
            {r.tarefas.titulos.slice(0, 10).map((t, i) => (
              <li key={i} className="flex items-center gap-2 bg-base-800 border border-base-600 rounded-2xl px-4 py-2.5 text-sm">
                <span className="text-nota">✓</span>
                <span className="truncate">{t}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Dinheiro</h2>
        {r.financas.gastos.length === 0 && r.financas.receitas === 0 ? (
          <p className="text-sm text-ink-400 bg-base-800 border border-base-600 rounded-2xl px-4 py-3">Nenhum gasto nesse dia 💚</p>
        ) : (
          <>
            {r.financas.receitas > 0 && (
              <p className="text-sm mb-2">
                Entrou <span className="text-habito font-mono">+{dinheiro(r.financas.receitas)}</span>
              </p>
            )}
            <ul className="bg-base-800 border border-base-600 rounded-2xl divide-y divide-base-600 overflow-hidden lista-entrar">
              {r.financas.gastos.slice(0, 8).map((g) => (
                <li key={g.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-9 h-9 rounded-full bg-base-700 flex items-center justify-center shrink-0">
                    {g.icone ? <IconeCategoria icone={g.icone} tamanho={16} /> : "💸"}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-sm">{g.descricao}</span>
                    {g.categoria && <span className="block text-xs text-ink-400">{g.categoria}</span>}
                  </span>
                  <span className="font-mono text-sm text-red-400">−{dinheiro(g.valor)}</span>
                </li>
              ))}
            </ul>
            <Link href={`/financas/extrato?dia=${dia}`} className="block text-center text-sm text-financa mt-3 hover:underline">
              Ver no extrato →
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
