"use client";

// Etapa 368 — número que "conta" até o valor (0 → R$ 3.000) ao aparecer
// ou quando muda. Quem pediu menos movimento no celular vê o valor direto.
import { useEffect, useRef, useState } from "react";

export function semAnimacao(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function useContagem(alvo: number, duracaoMs = 900): number {
  const [valor, setValor] = useState(alvo);
  const anterior = useRef(0);
  useEffect(() => {
    if (semAnimacao() || !Number.isFinite(alvo)) {
      setValor(alvo);
      anterior.current = alvo;
      return;
    }
    const de = anterior.current;
    const inicio = performance.now();
    let quadro = 0;
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracaoMs);
      const suave = 1 - Math.pow(1 - t, 3); // desacelera no fim
      setValor(de + (alvo - de) * suave);
      if (t < 1) quadro = requestAnimationFrame(passo);
      else anterior.current = alvo;
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo, duracaoMs]);
  return valor;
}
