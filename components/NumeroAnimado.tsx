"use client";

// Etapa 230 — conta do valor anterior até o novo (~0,6s). Quem pediu
// "reduzir movimento" no aparelho vê o número direto.
import { useEffect, useRef, useState } from "react";
import { valorNaContagem } from "@/lib/app/contagem";

export function useContagem(alvo: number, duracao = 600): number {
  const [atual, setAtual] = useState(0);
  const anterior = useRef(0);

  useEffect(() => {
    const de = anterior.current;
    anterior.current = alvo;
    let semMovimento = false;
    try {
      semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {}
    if (semMovimento || !Number.isFinite(alvo) || de === alvo) {
      setAtual(alvo);
      return;
    }
    let quadro = 0;
    const inicio = performance.now();
    const passo = (agora: number) => {
      const v = valorNaContagem(de, alvo, agora - inicio, duracao);
      setAtual(v);
      if (v !== alvo) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo, duracao]);

  return atual;
}

/** número inteiro animado (%, dias, contagens) */
export function NumeroAnimado({ valor, sufixo = "" }: { valor: number; sufixo?: string }) {
  const v = useContagem(valor);
  return (
    <>
      {Math.round(v)}
      {sufixo}
    </>
  );
}
