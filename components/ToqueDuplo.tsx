"use client";

// Etapa 233 — "toque duplo": quando os dois completam o hábito no mesmo
// dia, duas mãos entram dos lados e batem no meio 🙌
import { useEffect, useRef } from "react";

export function ToqueDuplo({ habito, parceiro, sequencia, aoFechar }: { habito: string; parceiro: string; sequencia?: number; aoFechar: () => void }) {
  const fechar = useRef(aoFechar);
  fechar.current = aoFechar;
  useEffect(() => {
    const t1 = setTimeout(() => {
      try {
        (navigator as any).vibrate?.([30, 40, 80]);
      } catch {}
    }, 600);
    const t2 = setTimeout(() => fechar.current(), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="animate-fundo fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/65 px-6" onClick={aoFechar} role="dialog" aria-label="Vocês dois fizeram">
      <div className="relative h-40 w-full max-w-xs flex items-center justify-center">
        <span className="absolute text-7xl animate-mao-esq" style={{ right: "50%" }}>
          🤚
        </span>
        <span className="absolute text-7xl animate-mao-dir" style={{ left: "50%" }}>
          🤚
        </span>
        <span className="absolute w-24 h-24 rounded-full border-4 border-yellow-300 opacity-0 animate-estouro" style={{ animationDelay: "0.55s" }} />
        <span className="absolute w-24 h-24 rounded-full border-4 border-pink-300 opacity-0 animate-estouro" style={{ animationDelay: "0.7s" }} />
      </div>
      <div className="animate-surgir bg-base-800 border border-base-600 rounded-3xl px-6 py-5 text-center shadow-2xl" style={{ animationDelay: "0.6s", animationFillMode: "both" }}>
        <p className="text-2xl font-display font-bold">Toque duplo! 🙌</p>
        <p className="text-base text-ink-400 mt-1">
          Você e {parceiro} fizeram <span className="text-ink-100 font-medium">{habito}</span> hoje
        </p>
        {!!sequencia && sequencia > 1 && <p className="text-lg font-semibold mt-2">🔥 {sequencia} dias seguidos juntos</p>}
      </div>
    </div>
  );
}

/** Chuva de emojis subindo pela tela (reação recebida/enviada) */
export function ChuvaEmoji({ emoji, aoFechar }: { emoji: string; aoFechar: () => void }) {
  const fechar = useRef(aoFechar);
  fechar.current = aoFechar;
  useEffect(() => {
    const t = setTimeout(() => fechar.current(), 2400);
    return () => clearTimeout(t);
  }, [emoji]);
  return (
    <div className="fixed inset-0 z-[65] pointer-events-none overflow-hidden" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="absolute bottom-0 text-4xl animate-subir"
          style={{ left: `${(i * 37) % 92 + 2}%`, animationDelay: `${(i % 7) * 0.12}s`, fontSize: `${1.8 + (i % 3) * 0.7}rem` }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}
