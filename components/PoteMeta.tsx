"use client";

// Etapa 286 — o pote da meta: enche até a % guardada (com uma ondinha) e,
// quando você guarda dinheiro com a tela aberta, caem moedas dentro.
import { useEffect, useId, useRef, useState } from "react";
import { useContagem } from "@/components/NumeroAnimado";

export function PoteMeta({ percentual, tamanho = 88, concluida = false }: { percentual: number; tamanho?: number; concluida?: boolean }) {
  const alvo = Math.max(0, Math.min(100, percentual));
  const pct = useContagem(alvo, 900);
  const id = useId().replace(/:/g, "");
  const anterior = useRef(alvo);
  const [chuva, setChuva] = useState(0);
  useEffect(() => {
    if (alvo > anterior.current) setChuva((n) => n + 1);
    anterior.current = alvo;
  }, [alvo]);

  // corpo do pote: y de 22 (topo) a 90 (fundo) → 68 de altura
  const alturaLiquido = (68 * pct) / 100;
  const topoLiquido = 90 - alturaLiquido;
  const cor = concluida ? "rgb(var(--c-habito))" : "rgb(var(--c-financa))";

  return (
    <div className="relative shrink-0" style={{ width: tamanho * 0.84, height: tamanho }} aria-label={`${Math.round(alvo)}% guardado`}>
      <svg viewBox="0 0 80 96" className="w-full h-full overflow-visible">
        <defs>
          <clipPath id={`pote-${id}`}>
            <path d="M14 26 Q14 22 18 22 H62 Q66 22 66 26 V82 Q66 90 58 90 H22 Q14 90 14 82 Z" />
          </clipPath>
        </defs>
        {/* vidro */}
        <path d="M14 26 Q14 22 18 22 H62 Q66 22 66 26 V82 Q66 90 58 90 H22 Q14 90 14 82 Z" fill="rgb(var(--c-base-700))" />
        {/* dinheiro dentro, com a superfície ondulando */}
        <g clipPath={`url(#pote-${id})`}>
          <rect x="0" y={topoLiquido + 3} width="80" height={alturaLiquido + 4} fill={cor} opacity="0.9" />
          {pct > 0.5 && (
            <path
              className="onda-pote"
              d={`M-40 ${topoLiquido + 3} q10 -5 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V96 H-40 Z`}
              fill={cor}
            />
          )}
          {/* moedinhas paradas no fundo */}
          {pct > 12 && <circle cx="30" cy="84" r="4" fill="#0F1013" opacity="0.15" />}
          {pct > 25 && <circle cx="48" cy="82" r="4" fill="#0F1013" opacity="0.12" />}
        </g>
        {/* brilho do vidro */}
        <path d="M20 32 V70" stroke="white" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />
        <path d="M14 26 Q14 22 18 22 H62 Q66 22 66 26 V82 Q66 90 58 90 H22 Q14 90 14 82 Z" fill="none" stroke="rgb(var(--c-base-600))" strokeWidth="2" />
        {/* tampa */}
        <rect x="18" y="12" width="44" height="10" rx="3" fill={cor} opacity="0.75" />
        <rect x="35" y="14" width="10" height="2.5" rx="1.2" fill="#0F1013" opacity="0.35" />
      </svg>
      <span className="absolute inset-x-0 bottom-[14%] text-center text-sm font-mono font-bold text-ink-100 drop-shadow">
        {Math.round(pct)}%
      </span>
      {/* moedas caindo ao guardar */}
      {chuva > 0 &&
        [0, 1, 2].map((k) => (
          <span
            key={`${chuva}-${k}`}
            className="moeda-cair absolute text-base pointer-events-none"
            style={{ left: `${30 + k * 18}%`, top: "18%", animationDelay: `${k * 0.14}s` }}
            aria-hidden
          >
            🪙
          </span>
        ))}
    </div>
  );
}
