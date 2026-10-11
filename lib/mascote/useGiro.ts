"use client";

// Etapa 301 — o "girar com o dedo" do mascote, num gancho só (usado no
// palco da aba Hábitos e na página do mascote). Arrasta pro lado: gira
// com embalo; solta: vai parando e volta de frente com uma molinha.
// Toque sem arrastar chama aoTocar.
import { useEffect, useRef, useState } from "react";

/** Ângulo equivalente mais perto de "de frente" (múltiplo de 360). */
export function frenteMaisPerto(angulo: number) {
  return Math.round(angulo / 360) * 360;
}

export function useGiro(aoTocar?: () => void, aoComecar?: () => void) {
  const [angulo, setAngulo] = useState(0);
  const ang = useRef(0);
  const vel = useRef(0);
  const arrasto = useRef<{ x: number; t: number; moveu: boolean } | null>(null);
  const quadro = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (quadro.current) cancelAnimationFrame(quadro.current);
    },
    []
  );

  function aplicar(a: number) {
    ang.current = a;
    setAngulo(a);
  }

  function animar() {
    if (quadro.current) cancelAnimationFrame(quadro.current);
    const passo = () => {
      if (Math.abs(vel.current) > 0.4) {
        vel.current *= 0.95;
        aplicar(ang.current + vel.current);
        quadro.current = requestAnimationFrame(passo);
        return;
      }
      const alvo = frenteMaisPerto(ang.current);
      const falta = alvo - ang.current;
      if (Math.abs(falta) < 0.5) {
        aplicar(0);
        quadro.current = null;
        return;
      }
      aplicar(ang.current + falta * 0.14);
      quadro.current = requestAnimationFrame(passo);
    };
    quadro.current = requestAnimationFrame(passo);
  }

  function girarCom(v: number) {
    vel.current = v;
    animar();
  }

  const eventos = {
    style: { touchAction: "pan-y" as const },
    onPointerDown(e: React.PointerEvent) {
      if (quadro.current) cancelAnimationFrame(quadro.current);
      quadro.current = null;
      vel.current = 0;
      arrasto.current = { x: e.clientX, t: performance.now(), moveu: false };
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    onPointerMove(e: React.PointerEvent) {
      const a = arrasto.current;
      if (!a) return;
      const dx = e.clientX - a.x;
      if (!a.moveu && Math.abs(dx) < 4) return;
      if (!a.moveu) {
        a.moveu = true;
        aoComecar?.();
      }
      const agora = performance.now();
      const graus = dx * 1.1;
      vel.current = (graus / Math.max(8, agora - a.t)) * 16;
      a.x = e.clientX;
      a.t = agora;
      aplicar(ang.current + graus);
    },
    onPointerUp() {
      const a = arrasto.current;
      arrasto.current = null;
      if (!a) return;
      if (!a.moveu) {
        aoTocar?.();
        return;
      }
      if (performance.now() - a.t > 120) vel.current = 0;
      vel.current = Math.max(-40, Math.min(40, vel.current));
      animar();
    },
    onPointerCancel() {
      arrasto.current = null;
      animar();
    },
  };

  return { angulo, girarCom, eventos };
}
