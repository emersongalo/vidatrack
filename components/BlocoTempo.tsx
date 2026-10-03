"use client";

// Etapa 245 — toque abre o editor (celular). No computador, com o mouse,
// ainda dá pra arrastar pra mover e puxar a base pra mudar o tamanho.
import { useEffect, useRef, useState } from "react";
import {
  horaParaMinutosDoDia,
  minutosParaHora,
  minutosDoDiaParaY,
  arredondarPara15Min,
  PX_POR_MINUTO,
} from "@/lib/planejador/tempo";
import { moverOuRedimensionarBloco } from "@/app/habitos/planejador/actions";
import { hexDaCor } from "@/lib/agenda/estilo";

export type Bloco = {
  id: string;
  titulo: string;
  hora_inicio: string;
  hora_fim: string;
  cor: string;
};

export function BlocoTempo({ bloco, aoAbrir, aoMudar }: { bloco: Bloco; aoAbrir: (b: Bloco) => void; aoMudar: () => void }) {
  const [inicioMin, setInicioMin] = useState(horaParaMinutosDoDia(bloco.hora_inicio));
  const [fimMin, setFimMin] = useState(horaParaMinutosDoDia(bloco.hora_fim));
  useEffect(() => {
    setInicioMin(horaParaMinutosDoDia(bloco.hora_inicio));
    setFimMin(horaParaMinutosDoDia(bloco.hora_fim));
  }, [bloco.hora_inicio, bloco.hora_fim]);
  const arrastandoRef = useRef<null | { modo: "mover" | "redimensionar"; yInicial: number; inicioOrig: number; fimOrig: number; mexeu: boolean }>(null);
  const ignorarClique = useRef(false);

  const top = minutosDoDiaParaY(inicioMin);
  const altura = Math.max(28, (fimMin - inicioMin) * PX_POR_MINUTO);
  const cor = hexDaCor(bloco.cor);

  function iniciarArraste(e: React.PointerEvent, modo: "mover" | "redimensionar") {
    e.stopPropagation();
    if (e.pointerType !== "mouse") return; // no toque, é só tocar pra editar
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    arrastandoRef.current = { modo, yInicial: e.clientY, inicioOrig: inicioMin, fimOrig: fimMin, mexeu: false };
  }

  function duranteArraste(e: React.PointerEvent) {
    const estado = arrastandoRef.current;
    if (!estado) return;
    const deltaY = e.clientY - estado.yInicial;
    if (Math.abs(deltaY) > 4) estado.mexeu = true;
    const deltaMin = arredondarPara15Min(deltaY / PX_POR_MINUTO);
    if (estado.modo === "mover") {
      const duracao = estado.fimOrig - estado.inicioOrig;
      const novoInicio = Math.max(0, estado.inicioOrig + deltaMin);
      setInicioMin(novoInicio);
      setFimMin(novoInicio + duracao);
    } else {
      setFimMin(Math.max(estado.inicioOrig + 15, estado.fimOrig + deltaMin));
    }
  }

  async function finalizarArraste() {
    const estado = arrastandoRef.current;
    if (!estado) return;
    arrastandoRef.current = null;
    if (!estado.mexeu) return; // foi só um clique: o onClick abre
    ignorarClique.current = true;
    await moverOuRedimensionarBloco(bloco.id, minutosParaHora(inicioMin), minutosParaHora(fimMin));
    aoMudar();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        if (ignorarClique.current) {
          ignorarClique.current = false;
          return;
        }
        aoAbrir(bloco);
      }}
      className="absolute left-1 right-1 rounded-xl border-l-4 px-3 py-1.5 overflow-hidden select-none cursor-pointer shadow-sm"
      style={{ top, height: altura, background: `${cor}33`, borderColor: cor }}
      onPointerDown={(e) => iniciarArraste(e, "mover")}
      onPointerMove={duranteArraste}
      onPointerUp={finalizarArraste}
    >
      <p className="text-sm font-semibold truncate">{bloco.titulo}</p>
      {altura > 40 && (
        <p className="text-xs opacity-75">
          {minutosParaHora(inicioMin)} – {minutosParaHora(fimMin)}
        </p>
      )}
      <div
        onPointerDown={(e) => iniciarArraste(e, "redimensionar")}
        onPointerMove={duranteArraste}
        onPointerUp={finalizarArraste}
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
      />
    </div>
  );
}
