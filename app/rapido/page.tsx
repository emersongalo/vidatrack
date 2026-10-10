"use client";

// Etapa 282 — modo rápido: abre, toca, fecha. Os hábitos de hoje em
// quadrados grandes, as tarefas do dia com 1 toque e o gasto rápido.
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { useSnapshotOffline, atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { habitosDeHoje, tarefasDeHoje } from "@/lib/geral/modoRapido";
import { alternarCheckin, ajustarQuantidadeHabito } from "@/app/habitos/actions";
import { alternarConclusaoTarefa } from "@/app/habitos/tarefas/actions";
import { hexDaCor } from "@/lib/agenda/estilo";
import { explodirEm, chuvaDeConfete } from "@/lib/app/festa";
import { vibrar } from "@/lib/app/vibrar";
import { IconeHabito } from "@/components/IconeHabito";
import { GastosRapidos } from "@/components/GastosRapidos";
import { FolhaLancamento } from "@/components/BotaoNovoLancamento";
import { CarregandoTela } from "@/components/Esqueleto";
import { CabecalhoPagina } from "@/components/CabecalhoPagina";

export default function ModoRapidoPage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  // o que foi tocado nesta tela (aparece na hora, antes do servidor responder)
  const [extra, setExtra] = useState<Record<string, number>>({});
  const [tarefasTrocadas, setTarefasTrocadas] = useState<Record<string, boolean>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [folha, setFolha] = useState(false);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const habitos = useMemo(
    () => (snapshot ? habitosDeHoje(snapshot.habitos as any[], snapshot.habitoCheckins as any[], hoje, snapshot.perfil.id) : []),
    [snapshot, hoje]
  );
  const tarefas = useMemo(
    () => (snapshot ? tarefasDeHoje(snapshot.tarefas as any[], snapshot.conclusoesTarefas as any[], hoje) : []),
    [snapshot, hoje]
  );

  if (snapshot === undefined) return <CarregandoTela cartoes={2} linhas={3} />;
  if (!snapshot) return <main className="pagina px-6 pt-6 text-ink-400">Abra o app com internet uma vez pra usar o modo rápido.</main>;

  const atualDe = (id: string, base: number) => base + (extra[id] ?? 0);
  const feitos = habitos.filter((h) => atualDe(h.id, h.atual) >= h.meta).length;

  async function tocarHabito(h: (typeof habitos)[number]) {
    const atual = atualDe(h.id, h.atual);
    const numerico = h.meta > 1;
    const feito = atual >= h.meta;
    // simples: marca/desmarca · numérico: +1 até bater a meta
    const delta = numerico ? (feito ? 0 : 1) : feito ? -atual : 1;
    if (delta === 0) return;
    setErro(null);
    const vaiCompletar = !feito && atual + delta >= h.meta;
    if (delta > 0) {
      vibrar(vaiCompletar ? [15, 40, 25] : 10);
      if (vaiCompletar) {
        explodirEm(refs.current[h.id], { cor: hexDaCor(h.cor), emojis: ["✨", "⭐"] });
        if (feitos + 1 === habitos.length) setTimeout(() => chuvaDeConfete({ quantidade: 70 }), 250);
      }
    }
    setExtra((e) => ({ ...e, [h.id]: (e[h.id] ?? 0) + delta }));
    try {
      const r: any = numerico ? await ajustarQuantidadeHabito(h.id, hoje, delta) : await alternarCheckin(h.id, hoje);
      if (r?.erro) throw new Error(r.erro);
      void atualizarSnapshotEmTodasAsTelas().then(() => setExtra((e) => ({ ...e, [h.id]: 0 })));
    } catch {
      setExtra((e) => ({ ...e, [h.id]: (e[h.id] ?? 0) - delta }));
      setErro("Não salvou — confira a internet e tente de novo.");
    }
  }

  async function tocarTarefa(id: string, feitaAntes: boolean) {
    setErro(null);
    if (!feitaAntes) vibrar(12);
    setTarefasTrocadas((m) => ({ ...m, [id]: !feitaAntes }));
    try {
      await alternarConclusaoTarefa(id, hoje);
      void atualizarSnapshotEmTodasAsTelas().then(() =>
        setTarefasTrocadas((m) => {
          const n = { ...m };
          delete n[id];
          return n;
        })
      );
    } catch {
      setTarefasTrocadas((m) => ({ ...m, [id]: feitaAntes }));
      setErro("Não salvou — confira a internet e tente de novo.");
    }
  }

  return (
    <main className="pagina-curta px-6 md:px-12 pt-4 pb-12">
      <CabecalhoPagina voltarHref="/dashboard" voltarTexto="Início" emoji="⚡" titulo="Modo rápido" subtitulo="Toca e pronto. O resto do app fica pra depois." />

      {erro && <p className="text-sm text-red-400 mb-3">{erro}</p>}

      {/* hábitos */}
      <section className="mb-7">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-xs uppercase tracking-wide text-habito">Hábitos de hoje</h2>
          {habitos.length > 0 && (
            <span className="text-xs text-ink-400">
              {feitos}/{habitos.length}
            </span>
          )}
        </div>
        {habitos.length === 0 ? (
          <p className="text-sm text-ink-400">Nenhum hábito pra hoje. 🌤️</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {habitos.map((h) => {
              const atual = atualDe(h.id, h.atual);
              const feito = atual >= h.meta;
              const cor = hexDaCor(h.cor);
              return (
                <button
                  key={h.id}
                  ref={(el) => {
                    refs.current[h.id] = el;
                  }}
                  type="button"
                  onClick={() => tocarHabito(h)}
                  aria-pressed={feito}
                  className="relative aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1.5 px-1.5 transition active:scale-95"
                  style={
                    feito
                      ? { background: cor, borderColor: cor, color: "#0F1013" }
                      : { borderColor: `${cor}55`, background: `${cor}14` }
                  }
                >
                  {feito && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/15 flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                  <IconeHabito icone={h.icone} tamanho={26} />
                  <span className="text-xs font-medium leading-tight line-clamp-2 text-center">{h.nome}</span>
                  {h.meta > 1 && (
                    <span className={`text-[10px] font-mono ${feito ? "" : "text-ink-400"}`}>
                      {Math.min(atual, h.meta)}/{h.meta} {h.unidade ?? ""}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* tarefas */}
      <section className="mb-7">
        <h2 className="text-xs uppercase tracking-wide text-nota mb-2">Tarefas de hoje</h2>
        {tarefas.length === 0 ? (
          <p className="text-sm text-ink-400">Nada pra hoje. ✨</p>
        ) : (
          <ul className="bg-base-800 border border-base-600 rounded-2xl divide-y divide-base-600 overflow-hidden">
            {tarefas.slice(0, 12).map((t) => {
              const feita = tarefasTrocadas[t.id] ?? t.feita;
              return (
                <li key={t.id}>
                  <button type="button" onClick={() => tocarTarefa(t.id, feita)} className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-base-700">
                    <span
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                        feita ? "bg-nota border-nota text-base-900" : "border-base-600"
                      }`}
                    >
                      {feita && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span className={`flex-1 truncate text-sm ${feita ? "riscado text-ink-400" : ""}`}>{t.titulo}</span>
                    {t.atrasada && !feita && <span className="text-[11px] text-red-400">atrasada</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <Link href="/tarefas/nova" className="inline-flex items-center gap-1 text-sm text-nota mt-2">
          <Plus size={14} /> Nova tarefa
        </Link>
      </section>

      {/* dinheiro */}
      <section>
        <h2 className="text-xs uppercase tracking-wide text-financa mb-2">Gastei agora</h2>
        <GastosRapidos snapshot={snapshot} hojeISO={hoje} />
        <button
          type="button"
          onClick={() => setFolha(true)}
          className="w-full mt-2 rounded-2xl bg-financa text-base-900 font-semibold py-3.5 active:scale-[0.98] transition"
        >
          💸 Lançar um gasto
        </button>
      </section>

      {folha && <FolhaLancamento aoFechar={() => setFolha(false)} />}
    </main>
  );
}
