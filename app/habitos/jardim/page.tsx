"use client";

// Etapa 282 — jardim dos hábitos: cada hábito é uma planta que cresce
// com os dias feitos (Semente → Lenda). Feito hoje = planta regada 💧.
import Link from "next/link";
import { useMemo } from "react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { montarJardim, resumoJardim } from "@/lib/habitos/jardim";
import { NIVEIS } from "@/lib/habitos/nivel";
import { CarregandoTela } from "@/components/Esqueleto";
import { CabecalhoPagina } from "@/components/CabecalhoPagina";
import { EstadoVazio } from "@/components/EstadoVazio";

export default function JardimPage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const plantas = useMemo(
    () => (snapshot ? montarJardim(snapshot.habitos as any[], snapshot.habitoCheckins as any[], hoje, snapshot.perfil.id) : []),
    [snapshot, hoje]
  );
  const r = resumoJardim(plantas);

  if (snapshot === undefined) return <CarregandoTela cartoes={3} linhas={2} />;

  return (
    <main className="pagina px-6 md:px-12 pt-4 pb-12">
      <CabecalhoPagina voltarHref="/habitos/lista" voltarTexto="Hábitos" emoji="🌳" titulo="Seu jardim" subtitulo="Cada hábito é uma planta. Quanto mais dias feitos, mais ela cresce." />

      {plantas.length === 0 ? (
        <EstadoVazio tom="habito" emoji="🌱" titulo="Jardim vazio" texto="Crie um hábito e plante a primeira semente." acao={{ rotulo: "+ Novo hábito", href: "/habitos/novo" }} />
      ) : (
        <>
          {/* resumo */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-base-800 border border-base-600 rounded-2xl p-3 text-center">
              <p className="text-2xl font-display font-bold">{r.plantas}</p>
              <p className="text-xs text-ink-400">plantas</p>
            </div>
            <div className="bg-base-800 border border-base-600 rounded-2xl p-3 text-center">
              <p className="text-2xl font-display font-bold">
                {r.regadas}
                <span className="text-sm text-ink-400">/{r.plantas}</span>
              </p>
              <p className="text-xs text-ink-400">regadas hoje 💧</p>
            </div>
            <div className="bg-base-800 border border-base-600 rounded-2xl p-3 text-center">
              <p className="text-2xl font-display font-bold">{r.dias}</p>
              <p className="text-xs text-ink-400">dias cuidados</p>
            </div>
          </div>

          {/* o canteiro */}
          <div
            className="relative rounded-3xl overflow-hidden border border-habito/30 px-3 pt-6 pb-4"
            style={{ background: "linear-gradient(180deg, rgb(var(--c-habito) / 0.10), rgb(var(--c-habito) / 0.02) 70%, rgba(120,80,40,0.18))" }}
          >
            <span aria-hidden className="absolute right-5 top-3 text-2xl opacity-70 animate-boiar">☀️</span>
            <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-2 gap-y-5 lista-entrar">
              {plantas.map((p) => {
                const tam = 26 + p.nivel.atual.numero * 4;
                return (
                  <li key={p.id}>
                    <Link href={`/habitos/${p.id}`} className="flex flex-col items-center text-center group">
                      <span className="relative flex items-end justify-center h-20">
                        <span
                          className={`leading-none transition-transform group-active:scale-110 ${p.regadaHoje ? "" : "grayscale-[40%] opacity-80"}`}
                          style={{ fontSize: tam }}
                        >
                          {p.nivel.atual.emoji}
                        </span>
                        {p.regadaHoje && <span className="absolute -right-2 top-1 text-sm animate-cintilar">💧</span>}
                      </span>
                      {/* vasinho / terra */}
                      <span aria-hidden className="block w-12 h-2 rounded-full bg-[rgba(120,80,40,0.35)] -mt-0.5" />
                      <span className="text-sm font-medium mt-1.5 line-clamp-2 leading-tight">{p.nome}</span>
                      <span className="text-[11px] text-habito">
                        Nv {p.nivel.atual.numero} · {p.nivel.atual.nome}
                      </span>
                      {p.nivel.proximo ? (
                        <>
                          <span className="w-14 h-1 rounded-full bg-base-700 overflow-hidden mt-1">
                            <span className="block h-full bg-habito rounded-full" style={{ width: `${Math.round(p.nivel.progresso * 100)}%` }} />
                          </span>
                          <span className="text-[10px] text-ink-400 mt-0.5">
                            faltam {p.nivel.faltam} {p.nivel.faltam === 1 ? "dia" : "dias"}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-financa mt-1">nível máximo 👑</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* legenda dos níveis */}
          <h2 className="text-sm font-semibold mt-8 mb-2">Como as plantas crescem</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
            {NIVEIS.map((n) => (
              <div key={n.numero} className="shrink-0 bg-base-800 border border-base-600 rounded-2xl px-3 py-2 text-center min-w-[5.5rem]">
                <p className="text-2xl">{n.emoji}</p>
                <p className="text-xs font-medium">{n.nome}</p>
                <p className="text-[10px] text-ink-400">{n.minimo === 0 ? "início" : `${n.minimo} dias`}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-400 mt-3">Hábitos de "parar de fazer" não entram no jardim.</p>
        </>
      )}
    </main>
  );
}
