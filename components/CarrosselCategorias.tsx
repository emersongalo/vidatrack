"use client";

// Etapa 237 — "Saiu" e "Entrou" lado a lado: arraste pro lado (ou toque
// na aba) pra trocar entre as despesas e as receitas por categoria.
import { useRef, useState } from "react";
import { GraficoDespesasCategoriaLazy as Grafico } from "@/components/GraficoDespesasCategoriaLazy";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";

type Dado = { nome: string; valor: number; href?: string };

const PALETA_RECEITAS = ["#4FBF8A", "#6BA3C7", "#8BD17C", "#3E9C9A", "#A3C76B", "#5C8FD9", "#7FD1B9"];

export function CarrosselCategorias({
  despesas,
  receitas,
  mapaCategoriaInfo,
}: {
  despesas: Dado[];
  receitas: Dado[];
  mapaCategoriaInfo?: Map<string, any>;
}) {
  const [aba, setAba] = useState(0);
  const trilho = useRef<HTMLDivElement>(null);
  const ocultos = useValoresOcultos();
  const total = (l: Dado[]) => l.reduce((s, d) => s + d.valor, 0);

  function irPara(i: number) {
    setAba(i);
    const el = trilho.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  const abas = [
    { rotulo: "Saiu", valor: total(despesas), cor: "text-red-400", ativo: "bg-red-400/15 text-red-400" },
    { rotulo: "Entrou", valor: total(receitas), cor: "text-habito", ativo: "bg-habito/15 text-habito" },
  ];

  return (
    <div className="bg-base-800 border border-base-600 rounded-3xl p-5">
      <div className="grid grid-cols-2 gap-1 bg-base-900/60 rounded-2xl p-1 mb-3">
        {abas.map((a, i) => (
          <button
            key={a.rotulo}
            type="button"
            onClick={() => irPara(i)}
            className={`rounded-xl py-2 transition ${aba === i ? `${a.ativo} font-semibold` : "text-ink-400"}`}
          >
            <span className="block text-sm">{a.rotulo}</span>
            <span className="block text-base font-mono">{ocultos ? "R$ •••" : formatarMoeda(a.valor)}</span>
          </button>
        ))}
      </div>

      <div
        ref={trilho}
        data-gesto-proprio="1"
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
          if (i !== aba) setAba(i);
        }}
        className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="w-full shrink-0 snap-start">
          {despesas.length ? (
            <Grafico dados={despesas} mapaCategoriaInfo={mapaCategoriaInfo} semCaixa />
          ) : (
            <p className="text-base text-ink-400 py-10 text-center">Nenhuma despesa com categoria neste mês.</p>
          )}
        </div>
        <div className="w-full shrink-0 snap-start">
          {receitas.length ? (
            <Grafico dados={receitas} mapaCategoriaInfo={mapaCategoriaInfo} paleta={PALETA_RECEITAS} semCaixa />
          ) : (
            <p className="text-base text-ink-400 py-10 text-center">Nenhuma receita neste mês ainda.</p>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-1.5 mt-3" aria-hidden>
        {[0, 1].map((i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${aba === i ? "w-5 bg-ink-100" : "w-1.5 bg-base-600"}`} />
        ))}
      </div>
    </div>
  );
}
