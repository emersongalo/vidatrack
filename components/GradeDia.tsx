"use client";

import { useEffect, useRef, useState } from "react";
import { BlocoTempo, Bloco } from "./BlocoTempo";
import { CORES_DISPONIVEIS } from "@/lib/agenda/estilo";
import { criarBloco } from "@/app/habitos/planejador/actions";
import {
  HORA_INICIO_GRADE,
  HORA_FIM_GRADE,
  ALTURA_TOTAL_GRADE,
  PX_POR_MINUTO,
  minutosDoDiaParaY,
  yParaMinutosDoDia,
  arredondarPara15Min,
  minutosParaHora,
  horarioAtualEmMinutos,
} from "@/lib/planejador/tempo";

const HORAS = Array.from(
  { length: HORA_FIM_GRADE - HORA_INICIO_GRADE + 1 },
  (_, i) => HORA_INICIO_GRADE + i
);

export function GradeDia({ blocos, dataISO, ehHoje }: { blocos: Bloco[]; dataISO: string; ehHoje: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [criando, setCriando] = useState<{ y1: number; y2: number } | null>(null);
  const [minutoAgora, setMinutoAgora] = useState(horarioAtualEmMinutos());
  const arrasteInicioRef = useRef<number | null>(null);

  useEffect(() => {
    const intervalo = setInterval(() => setMinutoAgora(horarioAtualEmMinutos()), 60000);
    return () => clearInterval(intervalo);
  }, []);

  function yRelativoAoContainer(clientY: number): number {
    const rect = containerRef.current?.getBoundingClientRect();
    return clientY - (rect?.top ?? 0);
  }

  function aoIniciarCriacao(e: React.PointerEvent) {
    if (e.target !== e.currentTarget) return; // clicou num bloco existente, ignora
    const y = yRelativoAoContainer(e.clientY);
    arrasteInicioRef.current = y;
    setCriando({ y1: y, y2: y });
  }

  function aoMoverCriacao(e: React.PointerEvent) {
    if (arrasteInicioRef.current === null) return;
    const y = yRelativoAoContainer(e.clientY);
    setCriando({ y1: arrasteInicioRef.current, y2: y });
  }

  async function aoSoltarCriacao() {
    if (arrasteInicioRef.current === null || !criando) return;
    const yTopo = Math.min(criando.y1, criando.y2);
    const yBase = Math.max(criando.y1, criando.y2);
    arrasteInicioRef.current = null;
    setCriando(null);

    const minutoInicio = arredondarPara15Min(yParaMinutosDoDia(yTopo));
    const minutoFimBruto = arredondarPara15Min(yParaMinutosDoDia(yBase));
    const minutoFim = Math.max(minutoInicio + 15, minutoFimBruto);

    await criarBloco({
      data: dataISO,
      horaInicio: minutosParaHora(minutoInicio),
      horaFim: minutosParaHora(minutoFim),
      titulo: "Novo bloco",
      cor: CORES_DISPONIVEIS[0].valor,
    });
  }

  return (
    <div className="relative border border-base-600 rounded-xl2 overflow-hidden">
      <div className="flex">
        {/* Coluna de horas */}
        <div className="w-12 shrink-0 relative" style={{ height: ALTURA_TOTAL_GRADE }}>
          {HORAS.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 text-[10px] text-ink-400 -translate-y-1/2 text-right pr-2"
              style={{ top: minutosDoDiaParaY(h * 60) }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Grade + blocos */}
        <div
          ref={containerRef}
          className="relative flex-1 bg-base-800 cursor-crosshair touch-none"
          style={{ height: ALTURA_TOTAL_GRADE }}
          onPointerDown={aoIniciarCriacao}
          onPointerMove={aoMoverCriacao}
          onPointerUp={aoSoltarCriacao}
        >
          {HORAS.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-base-600"
              style={{ top: minutosDoDiaParaY(h * 60) }}
            />
          ))}

          {ehHoje && minutoAgora >= HORA_INICIO_GRADE * 60 && minutoAgora <= HORA_FIM_GRADE * 60 && (
            <div
              className="absolute left-0 right-0 h-px bg-red-400 z-10"
              style={{ top: minutosDoDiaParaY(minutoAgora) }}
            >
              <span className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-400" />
            </div>
          )}

          {criando && (
            <div
              className="absolute left-1 right-1 rounded-lg border-2 border-dashed border-ink-400 bg-ink-100/10 pointer-events-none"
              style={{
                top: Math.min(criando.y1, criando.y2),
                height: Math.abs(criando.y2 - criando.y1),
              }}
            />
          )}

          {blocos.map((bloco) => (
            <BlocoTempo key={bloco.id} bloco={bloco} />
          ))}
        </div>
      </div>
    </div>
  );
}
