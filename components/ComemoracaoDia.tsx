"use client";

// Etapa 230 — dia 100% concluído: uma comemoração curta na tela.
// Etapa 273 — chuva de confete, troféu pulando e texto configurável
// (usado também quando as tarefas do dia acabam).
import { useEffect, useRef } from "react";
import { chuvaDeConfete } from "@/lib/app/festa";

const EMOJIS = ["🎉", "✨", "🔥", "💚", "⭐", "🎊"];

export function ComemoracaoDia({
  aoFechar,
  titulo = "Dia completo!",
  texto = "Tudo feito por hoje. Mandou bem.",
  emoji = "🏆",
  chuva,
}: {
  aoFechar: () => void;
  titulo?: string;
  texto?: string;
  emoji?: string;
  /** Etapa 286 — o que sobe na tela no lugar do confete (ex: folhinhas) */
  chuva?: string[];
}) {
  // a tela pai pode renderizar de novo no meio — guarda a função sem
  // reiniciar o confete nem o tempo
  const fechar = useRef(aoFechar);
  fechar.current = aoFechar;
  useEffect(() => {
    if (!chuva) chuvaDeConfete();
    const t = setTimeout(() => fechar.current(), 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center" aria-live="polite">
      {Array.from({ length: chuva ? 22 : 14 }).map((_, i) => (
        <span
          key={i}
          className="absolute bottom-0 text-3xl animate-subir"
          style={{
            left: `${(i * 53) % 100}%`,
            animationDelay: `${(i % 6) * 0.12}s`,
            ...(chuva ? { rotate: `${(i * 47) % 360}deg`, fontSize: `${1.2 + (i % 4) * 0.35}rem` } : {}),
          }}
        >
          {(chuva ?? EMOJIS)[i % (chuva ?? EMOJIS).length]}
        </span>
      ))}
      <div className="animate-quicar bg-base-800/95 border border-habito/50 rounded-3xl px-8 py-6 text-center shadow-2xl">
        <p className="text-5xl mb-2 inline-block animate-pular">{emoji}</p>
        <p className="text-xl font-display font-bold">{titulo}</p>
        <p className="text-sm text-ink-400">{texto}</p>
      </div>
    </div>
  );
}
