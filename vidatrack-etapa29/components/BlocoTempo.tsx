"use client";

import { useRef, useState } from "react";
import {
  horaParaMinutosDoDia,
  minutosParaHora,
  minutosDoDiaParaY,
  yParaMinutosDoDia,
  arredondarPara15Min,
  PX_POR_MINUTO,
} from "@/lib/planejador/tempo";
import { moverOuRedimensionarBloco, removerBloco, renomearBloco } from "@/app/habitos/planejador/actions";

const CLASSES_COR: Record<string, string> = {
  habito: "bg-habito/25 border-habito text-ink-100",
  nota: "bg-nota/25 border-nota text-ink-100",
  financa: "bg-financa/25 border-financa text-ink-100",
  neutro: "bg-ink-400/20 border-ink-400 text-ink-100",
};

export type Bloco = {
  id: string;
  titulo: string;
  hora_inicio: string;
  hora_fim: string;
  cor: string;
};

export function BlocoTempo({ bloco }: { bloco: Bloco }) {
  const [inicioMin, setInicioMin] = useState(horaParaMinutosDoDia(bloco.hora_inicio));
  const [fimMin, setFimMin] = useState(horaParaMinutosDoDia(bloco.hora_fim));
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(bloco.titulo);
  const arrastandoRef = useRef<null | { modo: "mover" | "redimensionar"; yInicial: number; inicioOrig: number; fimOrig: number }>(null);

  const top = minutosDoDiaParaY(inicioMin);
  const altura = Math.max(24, (fimMin - inicioMin) * PX_POR_MINUTO);

  function iniciarArraste(e: React.PointerEvent, modo: "mover" | "redimensionar") {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    arrastandoRef.current = { modo, yInicial: e.clientY, inicioOrig: inicioMin, fimOrig: fimMin };
  }

  function duranteArraste(e: React.PointerEvent) {
    const estado = arrastandoRef.current;
    if (!estado) return;

    const deltaY = e.clientY - estado.yInicial;
    const deltaMin = arredondarPara15Min(deltaY / PX_POR_MINUTO);

    if (estado.modo === "mover") {
      const duracao = estado.fimOrig - estado.inicioOrig;
      const novoInicio = Math.max(0, estado.inicioOrig + deltaMin);
      setInicioMin(novoInicio);
      setFimMin(novoInicio + duracao);
    } else {
      const novoFim = Math.max(estado.inicioOrig + 15, estado.fimOrig + deltaMin);
      setFimMin(novoFim);
    }
  }

  async function finalizarArraste() {
    if (!arrastandoRef.current) return;
    arrastandoRef.current = null;
    await moverOuRedimensionarBloco(bloco.id, minutosParaHora(inicioMin), minutosParaHora(fimMin));
  }

  async function salvarTitulo() {
    setEditando(false);
    if (titulo !== bloco.titulo) await renomearBloco(bloco.id, titulo);
  }

  return (
    <div
      className={`absolute left-1 right-1 rounded-lg border px-2 py-1 overflow-hidden select-none group ${CLASSES_COR[bloco.cor] ?? CLASSES_COR.neutro}`}
      style={{ top, height: altura }}
      onPointerDown={(e) => iniciarArraste(e, "mover")}
      onPointerMove={duranteArraste}
      onPointerUp={finalizarArraste}
    >
      {editando ? (
        <input
          autoFocus
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onBlur={salvarTitulo}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          onPointerDown={(e) => e.stopPropagation()}
          className="bg-transparent text-xs font-medium outline-none w-full"
        />
      ) : (
        <p
          className="text-xs font-medium truncate cursor-text"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditando(true);
          }}
        >
          {titulo}
        </p>
      )}
      {altura > 32 && (
        <p className="text-[10px] opacity-70">
          {minutosParaHora(inicioMin)} – {minutosParaHora(fimMin)}
        </p>
      )}

      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => removerBloco(bloco.id)}
        className="absolute top-0.5 right-1 text-xs opacity-0 group-hover:opacity-70 hover:!opacity-100 transition"
        aria-label="Remover bloco"
      >
        ✕
      </button>

      <div
        onPointerDown={(e) => iniciarArraste(e, "redimensionar")}
        onPointerMove={duranteArraste}
        onPointerUp={finalizarArraste}
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
      />
    </div>
  );
}
