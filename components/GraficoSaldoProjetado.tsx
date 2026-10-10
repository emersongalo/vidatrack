"use client";

// Etapa 276 — linha do saldo projetado até o fim do mês. Toque/passe o
// dedo pra ver o saldo de cada dia e o que entra/sai nele.
import { useMemo, useRef, useState } from "react";
import { curvaDoSaldo } from "@/lib/financas/curvaSaldo";
import { ultimoDiaISO, type ItemPrevisto } from "@/lib/financas/previsao";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";

const L = 320;
const A = 120;
const M = { topo: 14, base: 18, esq: 4, dir: 4 };
const COR = "#D9A24C";

function ddmm(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

export function GraficoSaldoProjetado({ saldoHoje, itens, hoje }: { saldoHoje: number; itens: ItemPrevisto[]; hoje: string }) {
  const ocultos = useValoresOcultos();
  const pontos = useMemo(() => curvaDoSaldo(saldoHoje, itens, hoje, ultimoDiaISO(hoje)), [saldoHoje, itens, hoje]);
  const [sel, setSel] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  if (pontos.length < 2) return null;

  const valores = pontos.map((p) => p.saldo);
  let min = Math.min(0, ...valores);
  let max = Math.max(0, ...valores);
  if (max === min) max = min + 1;
  const folga = (max - min) * 0.08;
  min -= min < 0 ? folga : 0;
  max += folga;

  const x = (i: number) => M.esq + (i / (pontos.length - 1)) * (L - M.esq - M.dir);
  const y = (v: number) => M.topo + (1 - (v - min) / (max - min)) * (A - M.topo - M.base);
  const linha = pontos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.saldo).toFixed(1)}`).join(" ");
  const area = `${linha} L${x(pontos.length - 1).toFixed(1)},${y(Math.max(min, 0)).toFixed(1)} L${x(0).toFixed(1)},${y(Math.max(min, 0)).toFixed(1)} Z`;
  const temNegativo = valores.some((v) => v < 0);
  const fmt = (v: number) => (ocultos ? "R$ ••••" : formatarMoeda(v));

  function aoMover(clientX: number) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const frac = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setSel(Math.round(frac * (pontos.length - 1)));
  }

  const p = sel !== null ? pontos[sel] : null;
  const ultimo = pontos[pontos.length - 1];

  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between text-xs text-ink-400 mb-1">
        <span>Saldo dia a dia</span>
        {p ? (
          <span className="text-ink-100">
            {ddmm(p.dia)} · <span className="font-mono">{fmt(p.saldo)}</span>
          </span>
        ) : (
          <span>toque no gráfico</span>
        )}
      </div>
      <div className="relative">
        <svg
          ref={ref}
          viewBox={`0 0 ${L} ${A}`}
          className="w-full h-28 touch-none select-none"
          role="img"
          aria-label={`Saldo projetado: hoje ${fmt(saldoHoje)}, fim do mês ${fmt(ultimo.saldo)}`}
          onPointerDown={(e) => aoMover(e.clientX)}
          onPointerMove={(e) => (e.pointerType === "mouse" || e.buttons ? aoMover(e.clientX) : undefined)}
          onPointerLeave={() => setSel(null)}
        >
          <defs>
            <linearGradient id="vt-saldo-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={COR} stopOpacity="0.28" />
              <stop offset="100%" stopColor={COR} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* linha do zero */}
          <line
            x1={M.esq}
            x2={L - M.dir}
            y1={y(0)}
            y2={y(0)}
            strokeWidth="1"
            strokeDasharray="3 3"
            className={temNegativo ? "stroke-red-400" : "stroke-base-600"}
            vectorEffect="non-scaling-stroke"
          />
          <path d={area} fill="url(#vt-saldo-area)" className="aparecer-depois" />
          {/* Etapa 286 — a linha se desenha da esquerda pra direita */}
          <path d={linha} pathLength={1} fill="none" stroke={COR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="desenhar-linha" />
          {/* dias com movimento */}
          {pontos.map((pt, i) =>
            pt.entrou || pt.saiu ? (
              <circle
                key={pt.dia}
                cx={x(i)}
                cy={y(pt.saldo)}
                r="3"
                fill={pt.saldo < 0 ? "#F87171" : COR}
                className="stroke-base-800 aparecer-depois"
                strokeWidth="1.5"
                style={{ animationDelay: `${0.25 + (i / pontos.length) * 1.0}s` }}
              />
            ) : null
          )}
          {p && sel !== null && (
            <>
              <line x1={x(sel)} x2={x(sel)} y1={M.topo - 6} y2={A - M.base} className="stroke-ink-400" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <circle cx={x(sel)} cy={y(p.saldo)} r="4.5" fill={COR} className="stroke-base-800" strokeWidth="2" />
            </>
          )}
          <text x={M.esq} y={A - 4} className="fill-ink-400" fontSize="9">
            hoje
          </text>
          <text x={L - M.dir} y={A - 4} textAnchor="end" className="fill-ink-400" fontSize="9">
            {ddmm(ultimo.dia)}
          </text>
        </svg>
      </div>
      {p && (p.entrou > 0 || p.saiu > 0) && (
        <p className="text-xs text-ink-400 mt-1">
          Nesse dia:
          {p.entrou > 0 && <span className="text-habito"> +{fmt(p.entrou)}</span>}
          {p.saiu > 0 && <span className="text-red-400"> −{fmt(p.saiu)}</span>}
        </p>
      )}
    </div>
  );
}
