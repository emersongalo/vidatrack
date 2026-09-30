"use client";

// Etapa 230 — dia 100% concluído: uma comemoração curta na tela.
import { useEffect } from "react";

const EMOJIS = ["🎉", "✨", "🔥", "💚", "⭐", "🎊"];

export function ComemoracaoDia({ aoFechar }: { aoFechar: () => void }) {
  useEffect(() => {
    const t = setTimeout(aoFechar, 2600);
    return () => clearTimeout(t);
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center" aria-live="polite">
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="absolute bottom-0 text-3xl animate-subir"
          style={{ left: `${(i * 53) % 100}%`, animationDelay: `${(i % 6) * 0.12}s` }}
        >
          {EMOJIS[i % EMOJIS.length]}
        </span>
      ))}
      <div className="animate-surgir bg-base-800/95 border border-habito/50 rounded-3xl px-7 py-5 text-center shadow-2xl">
        <p className="text-4xl mb-1">🏆</p>
        <p className="text-xl font-display font-bold">Dia completo!</p>
        <p className="text-sm text-ink-400">Tudo feito por hoje. Mandou bem.</p>
      </div>
    </div>
  );
}
