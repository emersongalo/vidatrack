"use client";

// Etapa 310 — conquistas: metas grandes do jogo dos hábitos, com moedas
// de prêmio pra resgatar.
import { useMemo, useRef } from "react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { useMascote } from "@/lib/mascote/useMascote";
import { conquistasProntas, listarConquistas, NOMES_CATEGORIA_CONQUISTA, resgatarConquista, type CategoriaConquista } from "@/lib/mascote/conquistas";
import { CarregandoTela } from "@/components/Esqueleto";
import { CabecalhoPagina } from "@/components/CabecalhoPagina";
import { vibrar } from "@/lib/app/vibrar";
import { chuvaDeConfete, textoFlutuante } from "@/lib/app/festa";

export default function ConquistasPage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const { mascote, feitos, salvar, salvando } = useMascote(snapshot, hoje);
  const lista = useMemo(() => (snapshot ? listarConquistas(snapshot, mascote, feitos) : []), [snapshot, mascote, feitos]);
  const ref = useRef<HTMLDivElement>(null);

  if (snapshot === undefined) return <CarregandoTela cartoes={2} linhas={3} />;

  const feitas = lista.filter((c) => c.resgatada).length;
  const prontas = conquistasProntas(lista);
  const cats = [...new Set(lista.map((c) => c.cat))] as CategoriaConquista[];

  return (
    <main ref={ref} className="pagina-curta px-6 md:px-12 pt-4 pb-12">
      <CabecalhoPagina voltarHref="/habitos/mundo" voltarTexto="Mundo" emoji="🏆" titulo="Conquistas" subtitulo={`${feitas} de ${lista.length} · cada uma põe um monumento na sua ilha`} />

      <div className="h-2 rounded-full bg-base-700 overflow-hidden mb-2">
        <div className="h-full rounded-full bg-financa transition-all duration-700" style={{ width: `${Math.round((feitas / Math.max(1, lista.length)) * 100)}%` }} />
      </div>
      {prontas > 0 && <p className="text-sm text-financa font-semibold mb-4 animate-surgir">🎉 {prontas} pra resgatar!</p>}
      {!mascote && <p className="text-sm text-ink-400 mb-4">Choque seu mascote pra guardar as moedas das conquistas 🐣</p>}

      {cats.map((cat) => (
        <section key={cat} className="mb-6">
          <h2 className="text-xs uppercase tracking-wide text-ink-400 mb-2">{NOMES_CATEGORIA_CONQUISTA[cat]}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {lista
              .filter((c) => c.cat === cat)
              .map((c) => (
                <div
                  key={c.id}
                  className={`rounded-2xl border p-3 flex flex-col items-center text-center ${
                    c.resgatada ? "border-financa/50 bg-financa/10" : c.alcancada ? "border-financa bg-financa/15" : "border-base-600 bg-base-800"
                  }`}
                >
                  <span className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${c.resgatada ? "bg-financa/25" : c.alcancada ? "bg-financa/30 animate-quicar" : "bg-base-700 grayscale opacity-60"}`}>
                    {c.emoji}
                  </span>
                  <p className="text-sm font-semibold mt-2 leading-tight">{c.titulo}</p>
                  <p className="text-[11px] text-ink-400 leading-tight mt-0.5 min-h-[28px]">{c.texto}</p>
                  {/* Etapa 311 — o que ganha na ilha */}
                  <p className={`text-[10px] mt-1 ${c.resgatada ? "text-habito" : "text-ink-500"}`}>
                    {c.resgatada ? "✓ " : "🏝️ "}
                    {c.monumento.emoji} {c.monumento.nome}
                  </p>
                  {c.resgatada ? (
                    <p className="text-xs text-financa font-semibold mt-2">✓ +{c.premio} 🪙</p>
                  ) : c.alcancada ? (
                    <button
                      type="button"
                      disabled={!mascote || salvando}
                      onClick={async () => {
                        if (!mascote) return;
                        const novo = resgatarConquista(mascote, c);
                        if (!novo) return;
                        vibrar([15, 40, 25]);
                        chuvaDeConfete({ quantidade: 50 });
                        textoFlutuante(ref.current, `+${c.premio} 🪙`, "#F2C46D");
                        await salvar(novo);
                      }}
                      className="mt-2 w-full rounded-xl py-1.5 text-xs font-bold bg-financa text-base-900 disabled:opacity-50"
                    >
                      Resgatar +{c.premio} 🪙
                    </button>
                  ) : (
                    <>
                      <div className="w-full h-1.5 rounded-full bg-base-700 overflow-hidden mt-2">
                        <div className="h-full rounded-full bg-habito" style={{ width: `${Math.round((c.atual / c.meta) * 100)}%` }} />
                      </div>
                      <p className="text-[10px] text-ink-400 mt-1">
                        {c.atual}/{c.meta} · {c.premio} 🪙
                      </p>
                    </>
                  )}
                </div>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
