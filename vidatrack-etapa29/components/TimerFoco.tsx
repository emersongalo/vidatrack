"use client";

import { useEffect, useRef, useState } from "react";

const PRESETS = [5, 10, 15, 25, 45];

export function TimerFoco() {
  const [minutosEscolhidos, setMinutosEscolhidos] = useState(25);
  const [segundosRestantes, setSegundosRestantes] = useState(25 * 60);
  const [rodando, setRodando] = useState(false);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (rodando) {
      intervaloRef.current = setInterval(() => {
        setSegundosRestantes((s) => {
          if (s <= 1) {
            setRodando(false);
            if (intervaloRef.current) clearInterval(intervaloRef.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [rodando]);

  function escolherPreset(minutos: number) {
    setRodando(false);
    setMinutosEscolhidos(minutos);
    setSegundosRestantes(minutos * 60);
  }

  function reiniciar() {
    setRodando(false);
    setSegundosRestantes(minutosEscolhidos * 60);
  }

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const terminou = segundosRestantes === 0;

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-5 gap-2 mb-8 w-full">
        {PRESETS.map((min) => (
          <button
            key={min}
            onClick={() => escolherPreset(min)}
            className={`rounded-lg py-2 text-sm border transition ${
              minutosEscolhidos === min && !rodando
                ? "bg-ink-100 text-base-900 border-ink-100"
                : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            {min}m
          </button>
        ))}
      </div>

      <div
        className={`font-mono font-semibold text-6xl mb-8 tabular-nums ${
          terminou ? "text-habito" : ""
        }`}
      >
        {String(minutos).padStart(2, "0")}:{String(segundos).padStart(2, "0")}
      </div>

      {terminou && <p className="text-habito text-sm mb-6">Tempo de foco concluído 🎉</p>}

      <div className="flex gap-3 w-full">
        <button
          onClick={() => setRodando((r) => !r)}
          disabled={terminou}
          className="flex-1 bg-ink-100 text-base-900 font-medium rounded-lg py-3 hover:opacity-90 transition disabled:opacity-40"
        >
          {rodando ? "Pausar" : "Iniciar"}
        </button>
        <button
          onClick={reiniciar}
          className="flex-1 border border-base-600 rounded-lg py-3 hover:bg-base-800 transition"
        >
          Reiniciar
        </button>
      </div>
    </div>
  );
}
