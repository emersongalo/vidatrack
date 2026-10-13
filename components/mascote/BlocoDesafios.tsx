"use client";

// Etapa 314 — os desafios de 7/21/30 dias aparecem direto na aba Hábitos:
// "Ler: dia 5 de 7", com os quadradinhos e o botão de pegar a medalha.
// Sem desafio em andamento, o bloco não aparece.
import { useMemo, useRef } from "react";
import Link from "next/link";
import { useMascote } from "@/lib/mascote/useMascote";
import { estadoDoDesafio, infoDesafio, pegarMedalha, recomecarDesafio } from "@/lib/habitos/trilhas";
import { vibrar } from "@/lib/app/vibrar";
import { chuvaDeConfete, textoFlutuante } from "@/lib/app/festa";

export function BlocoDesafios({ snapshot, hoje }: { snapshot: any; hoje: string }) {
  const { mascote, salvar, salvando } = useMascote(snapshot, hoje);
  const ref = useRef<HTMLDivElement>(null);
  const lista = useMemo(() => {
    const habitos = (snapshot?.habitos ?? []) as any[];
    const checkins = (snapshot?.habitoCheckins ?? []) as any[];
    return (mascote?.desafios ?? [])
      .filter((d) => !d.resultado)
      .map((d) => {
        const h = habitos.find((x) => x.id === d.habitoId && !x.arquivado) ?? null;
        return { d, h, e: estadoDoDesafio(d, h, checkins, hoje) };
      })
      .filter((x) => x.h);
  }, [snapshot, mascote, hoje]);

  if (!snapshot || !mascote || !lista.length) return null;

  return (
    <section ref={ref} className="relative mb-4 rounded-3xl border border-base-600/70 bg-base-800 px-4 py-3 animate-entrar">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold">🥇 Desafios</p>
        <Link href="/habitos/trilhas" className="text-xs text-ink-400 hover:text-ink-100">
          Ver todos ›
        </Link>
      </div>
      <ul className="space-y-2.5">
        {lista.map(({ d, h, e }) => {
          const info = infoDesafio(d.dias);
          const diaAtual = Math.min(e.grade.filter((g) => g !== "futuro").length, e.grade.length);
          return (
            <li key={d.id}>
              <div className="flex items-center gap-2">
                <span className={`text-xl shrink-0 ${e.status === "pronto" ? "animate-quicar" : ""}`}>{info.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-tight truncate">
                    <span className="font-semibold">{h.nome}</span>
                    <span className="text-ink-400">
                      {" "}
                      ·{" "}
                      {e.status === "pronto"
                        ? "cumprido! 🎉"
                        : e.status === "perdido"
                          ? "passou da folga"
                          : `${e.feitos} de ${e.dias}${h.eh_negativo ? " limpos" : ""} · dia ${diaAtual}`}
                    </span>
                  </p>
                  <div className="h-1.5 rounded-full bg-base-700 overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${e.status === "perdido" ? "bg-red-400/60" : "bg-habito"}`}
                      style={{ width: `${Math.round((e.feitos / e.dias) * 100)}%` }}
                    />
                  </div>
                </div>
                {e.status === "pronto" ? (
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={async () => {
                      const novo = pegarMedalha(mascote, d, e, hoje);
                      if (!novo) return;
                      vibrar([20, 50, 30]);
                      chuvaDeConfete({ quantidade: 80 });
                      textoFlutuante(ref.current, `${info.emoji} +${info.premio} 🪙`, "#F2C46D");
                      await salvar(novo);
                    }}
                    className="shrink-0 text-xs font-bold rounded-full bg-financa text-base-900 px-3 py-1.5"
                  >
                    +{info.premio} 🪙
                  </button>
                ) : e.status === "perdido" ? (
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={() => void salvar(recomecarDesafio(mascote, d, hoje))}
                    className="shrink-0 text-xs font-semibold rounded-full border border-habito/60 text-habito px-3 py-1.5"
                  >
                    Recomeçar
                  </button>
                ) : (
                  <span className={`shrink-0 text-[11px] ${!h.eh_negativo && e.grade.includes("hoje") ? "text-amber-300" : "text-habito"}`}>
                    {h.eh_negativo ? "firme 💪" : e.grade.includes("hoje") ? "falta hoje" : "hoje ✓"}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
