"use client";

// Etapa 311 — zoom e arrastar pra mapas (Mundo): pinça com dois dedos,
// duplo toque, rodinha com Ctrl (ou pinça no trackpad) e botões + / −.
// Arrastou? O toque não vira clique (pra não entrar num lugar sem querer).
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { limitarZoom, zoomNoPonto, type Vista } from "@/lib/app/zoom";

export function ZoomPan({ children, max = 3.5, className = "" }: { children: ReactNode; max?: number; className?: string }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [v, setV] = useState<Vista>({ s: 1, x: 0, y: 0 });
  const vRef = useRef(v);
  vRef.current = v;
  const dedos = useRef(new Map<number, { x: number; y: number }>());
  const pinca = useRef<{ dist: number; v: Vista; cx: number; cy: number } | null>(null);
  const arraste = useRef<{ x: number; y: number; v: Vista } | null>(null);
  const moveu = useRef(false);
  const [suave, setSuave] = useState(false);

  const tam = () => {
    const r = caixa.current?.getBoundingClientRect();
    return { w: r?.width ?? 1, h: r?.height ?? 1, left: r?.left ?? 0, top: r?.top ?? 0 };
  };
  const aplicar = useCallback(
    (nv: Vista, animar = false) => {
      const { w, h } = tam();
      setSuave(animar);
      setV(limitarZoom(nv, w, h, max));
    },
    [max]
  );
  const zoomEm = useCallback(
    (fator: number, px?: number, py?: number, animar = true) => {
      const { w, h } = tam();
      aplicar(zoomNoPonto(vRef.current, vRef.current.s * fator, px ?? w / 2, py ?? h / 2), animar);
    },
    [aplicar]
  );

  // rodinha: só com Ctrl (pinça do trackpad manda ctrlKey) — sem prender a rolagem da página
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const roda = (e: WheelEvent) => {
      if (!e.ctrlKey && vRef.current.s === 1) return;
      e.preventDefault();
      const { left, top } = tam();
      zoomEm(Math.exp(-e.deltaY * 0.004), e.clientX - left, e.clientY - top, false);
    };
    el.addEventListener("wheel", roda, { passive: false });
    return () => el.removeEventListener("wheel", roda);
  }, [zoomEm]);

  const ponto = (e: React.PointerEvent) => {
    const { left, top } = tam();
    return { x: e.clientX - left, y: e.clientY - top };
  };

  function down(e: React.PointerEvent) {
    dedos.current.set(e.pointerId, ponto(e));
    moveu.current = false;
    if (dedos.current.size === 2) {
      const [a, b] = [...dedos.current.values()];
      pinca.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, v: vRef.current, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      arraste.current = null;
    } else if (dedos.current.size === 1) {
      const p = ponto(e);
      arraste.current = { x: p.x, y: p.y, v: vRef.current };
    }
  }
  function move(e: React.PointerEvent) {
    if (!dedos.current.has(e.pointerId)) return;
    dedos.current.set(e.pointerId, ponto(e));
    if (pinca.current && dedos.current.size >= 2) {
      const [a, b] = [...dedos.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const p0 = pinca.current;
      const nv = zoomNoPonto(p0.v, p0.v.s * (dist / p0.dist), p0.cx, p0.cy);
      // e acompanha o meio dos dedos
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      moveu.current = true;
      aplicar({ ...nv, x: nv.x + cx - p0.cx, y: nv.y + cy - p0.cy });
      return;
    }
    const ar = arraste.current;
    if (ar && vRef.current.s > 1) {
      const p = ponto(e);
      const dx = p.x - ar.x;
      const dy = p.y - ar.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) moveu.current = true;
      if (moveu.current) aplicar({ s: ar.v.s, x: ar.v.x + dx, y: ar.v.y + dy });
    }
  }
  function up(e: React.PointerEvent) {
    dedos.current.delete(e.pointerId);
    if (dedos.current.size < 2) pinca.current = null;
    if (dedos.current.size === 1) {
      const [p] = [...dedos.current.values()];
      arraste.current = { x: p.x, y: p.y, v: vRef.current };
    } else if (!dedos.current.size) arraste.current = null;
  }

  const zoom = v.s > 1.01;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        ref={caixa}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
        onClickCapture={(e) => {
          if (moveu.current) {
            e.stopPropagation();
            e.preventDefault();
            moveu.current = false;
          }
        }}
        onDoubleClick={(e) => {
          const { left, top } = tam();
          if (zoom) aplicar({ s: 1, x: 0, y: 0 }, true);
          else zoomEm(2.2, e.clientX - left, e.clientY - top);
        }}
        style={{ touchAction: zoom ? "none" : "pan-y" }}
        className={zoom ? "cursor-grab active:cursor-grabbing" : ""}
      >
        <div
          style={{
            transform: `translate(${v.x}px, ${v.y}px) scale(${v.s})`,
            transformOrigin: "0 0",
            transition: suave ? "transform 0.25s ease-out" : undefined,
          }}
        >
          {children}
        </div>
      </div>
      <div className="absolute right-2 bottom-2 flex flex-col gap-1.5">
        <BotaoZoom rotulo="Aproximar" onClick={() => zoomEm(1.6)} desativado={v.s >= max - 0.01}>
          +
        </BotaoZoom>
        <BotaoZoom rotulo="Afastar" onClick={() => zoomEm(1 / 1.6)} desativado={!zoom}>
          −
        </BotaoZoom>
        {zoom && (
          <BotaoZoom rotulo="Ver tudo" onClick={() => aplicar({ s: 1, x: 0, y: 0 }, true)}>
            ⤢
          </BotaoZoom>
        )}
      </div>
      {!zoom && <span className="pointer-events-none absolute left-2 bottom-2 text-[10px] text-white/90 bg-black/30 rounded-full px-2 py-0.5">pinça ou + pra aproximar</span>}
    </div>
  );
}

function BotaoZoom({ children, onClick, rotulo, desativado }: { children: ReactNode; onClick: () => void; rotulo: string; desativado?: boolean }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      disabled={desativado}
      onClick={onClick}
      className="w-9 h-9 rounded-full bg-black/45 text-white text-lg font-bold leading-none flex items-center justify-center backdrop-blur active:scale-90 transition disabled:opacity-35"
    >
      {children}
    </button>
  );
}
