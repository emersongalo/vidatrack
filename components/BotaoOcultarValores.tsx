"use client";

import { alternarValoresOcultos } from "@/lib/preferencias/valoresOcultos";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";

export function BotaoOcultarValores() {
  const ocultos = useValoresOcultos();

  return (
    <button
      type="button"
      onClick={alternarValoresOcultos}
      aria-label={ocultos ? "Mostrar valores" : "Ocultar valores"}
      title={ocultos ? "Mostrar valores" : "Ocultar valores"}
      className="w-9 h-9 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-800 transition shrink-0"
    >
      {ocultos ? (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 3L21 21M10.584 10.587A2 2 0 0012 14A2 2 0 0013.42 13.42M9.363 5.365A9.466 9.466 0 0112 5C17 5 20.5 8.5 22 12C21.393 13.32 20.605 14.478 19.68 15.45M6.61 6.61C4.577 8.03 3.007 10.06 2 12C3.5 15.5 7 19 12 19C13.28 19 14.494 18.759 15.6 18.32"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 12C3.5 8.5 7 5 12 5C17 5 20.5 8.5 22 12C20.5 15.5 17 19 12 19C7 19 3.5 15.5 2 12Z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )}
    </button>
  );
}
