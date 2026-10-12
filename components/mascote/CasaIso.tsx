"use client";

// Etapa 305 — um cômodo da casa do mascote em visão isométrica (estilo
// jogo de tabuleiro): piso quadriculado, paredes do fundo, móveis em
// blocos com volume e o mascote andando sozinho pelos quadradinhos livres.
// Tudo em SVG; à noite escurece e as luminárias acendem.
// Etapa 308 — veículos, lazer e bichinhos; garagem.
import { useEffect, useMemo, useRef, useState } from "react";
import { Mascote, type Periodo } from "@/components/mascote/Mascote";
import { COMODOS, estilo, movel, ocupados, tamanhoNoChao, TAM, type Colocado, type Comodo, type ComodoId, type Movel } from "@/lib/mascote/casa";
import type { CorMascote, Humor, Slot } from "@/lib/mascote/mascote";

const MW = 16; // meia largura do quadradinho
const MH = 8; // meia altura
const PAREDE = 66;
const OX = MW * TAM + 10;
const OY = PAREDE + 16;
export const LARGURA = MW * 2 * TAM + 20;
export const ALTURA = OY + MH * 2 * TAM + 26;

/** Ponto na tela de uma posição do chão (gx, gy) a uma altura z. */
export function P(gx: number, gy: number, z = 0): [number, number] {
  return [OX + (gx - gy) * MW, OY + (gx + gy) * MH - z];
}
const pts = (l: [number, number][]) => l.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");

function tom(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Bloco isométrico (o tijolinho de tudo). */
function Bloco({ x, y, w, d, h, z = 0, cor, op }: { x: number; y: number; w: number; d: number; h: number; z?: number; cor: string; op?: number }) {
  return (
    <g opacity={op}>
      <polygon points={pts([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)])} fill={tom(cor, -0.08)} />
      <polygon points={pts([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)])} fill={tom(cor, -0.24)} />
      <polygon points={pts([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)])} fill={tom(cor, 0.12)} />
    </g>
  );
}

/** Desenho de cada móvel em coordenadas "locais" (u = comprimento, v = fundo); girar troca os eixos. */
function DesenhoMovel({ it, mv, periodo }: { it: Colocado; mv: Movel; periodo: Periodo }) {
  const { x, y, r } = it;
  const B = (u: number, v: number, lu: number, lv: number, h: number, z: number, cor: string, op?: number) =>
    r ? <Bloco x={x + v} y={y + u} w={lv} d={lu} h={h} z={z} cor={cor} op={op} /> : <Bloco x={x + u} y={y + v} w={lu} d={lv} h={h} z={z} cor={cor} op={op} />;
  const C = (u: number, v: number, z: number) => (r ? P(x + v, y + u, z) : P(x + u, y + v, z));
  const pernas = (u: number, v: number, lu: number, lv: number, h: number, cor: string) => (
    <>
      {B(u, v, 0.08, 0.08, h, 0, cor)}
      {B(u + lu - 0.08, v, 0.08, 0.08, h, 0, cor)}
      {B(u, v + lv - 0.08, 0.08, 0.08, h, 0, cor)}
      {B(u + lu - 0.08, v + lv - 0.08, 0.08, 0.08, h, 0, cor)}
    </>
  );
  const noite = periodo === "noite" || periodo === "entardecer";
  switch (mv.id) {
    case "cama":
    case "camacasal": {
      const D = mv.id === "cama" ? 1 : 2;
      return (
        <g>
          {B(0, 0, 0.14, D, 22, 0, "#7A4E2E")}
          {B(0.08, 0.05, 1.9, D - 0.1, 6, 0, "#8B5E3C")}
          {B(0.12, 0.08, 1.82, D - 0.16, 5, 6, "#F4F1EA")}
          {B(0.7, 0.08, 1.24, D - 0.16, 5.5, 6.5, "#9C8FD9")}
          {Array.from({ length: D }, (_, i) => (
            <g key={i}>{B(0.2, 0.18 + i, 0.4, 0.64, 3.5, 11, "#FFFFFF")}</g>
          ))}
        </g>
      );
    }
    case "criado":
      return (
        <g>
          {B(0.15, 0.15, 0.7, 0.7, 14, 0, "#A0714A")}
          {B(0.42, 0.42, 0.16, 0.16, 5, 14, "#E7DCC8")}
          {B(0.36, 0.36, 0.28, 0.28, 5, 19, noite ? "#FDE68A" : "#F5E6C4")}
        </g>
      );
    case "guardaroupa":
      return (
        <g>
          {B(0.05, 0.08, 1.9, 0.8, 50, 0, "#B07D52")}
          {B(0.9, 0.86, 0.04, 0.04, 8, 22, "#F3E3C3")}
          {B(1.06, 0.86, 0.04, 0.04, 8, 22, "#F3E3C3")}
        </g>
      );
    case "escrivaninha":
      return (
        <g>
          {pernas(0.05, 0.15, 1.9, 0.75, 17, "#6B4A30")}
          {B(0, 0.1, 2, 0.85, 3, 17, "#C9A27A")}
          {B(0.65, 0.18, 0.7, 0.08, 15, 20, "#1F2937")}
          {B(0.68, 0.17, 0.64, 0.06, 12, 22, periodo === "noite" ? "#93C5FD" : "#60A5FA")}
          {B(1.5, 0.5, 0.25, 0.3, 4, 20, "#E5E7EB")}
        </g>
      );
    case "cadeira":
    case "banqueta":
      return (
        <g>
          {pernas(0.25, 0.25, 0.5, 0.5, mv.id === "banqueta" ? 16 : 10, "#6B4A30")}
          {B(0.22, 0.22, 0.56, 0.56, 3, mv.id === "banqueta" ? 16 : 10, mv.id === "banqueta" ? "#E9875B" : "#C0874F")}
          {mv.id === "cadeira" && B(0.22, 0.2, 0.56, 0.08, 16, 13, "#A06A3A")}
        </g>
      );
    case "luminaria":
    case "abajur":
      return (
        <g>
          {B(0.35, 0.35, 0.3, 0.3, 2, 0, "#4B5563")}
          {B(0.46, 0.46, 0.08, 0.08, mv.id === "abajur" ? 36 : 28, 2, "#6B7280")}
          {B(0.28, 0.28, 0.44, 0.44, 9, mv.id === "abajur" ? 36 : 28, noite ? "#FDE68A" : "#F5E6C4")}
        </g>
      );
    case "sofa":
    case "poltrona": {
      const L = mv.id === "sofa" ? 2 : 1;
      const cor = mv.id === "sofa" ? "#6D8BD6" : "#E9875B";
      return (
        <g>
          {B(0.05, 0.05, L - 0.1, 0.24, 22, 0, tom(cor, -0.1))}
          {B(0.05, 0.2, L - 0.1, 0.72, 10, 0, cor)}
          {B(0.05, 0.2, 0.18, 0.72, 15, 0, tom(cor, -0.05))}
          {B(L - 0.23, 0.2, 0.18, 0.72, 15, 0, tom(cor, -0.05))}
          {Array.from({ length: L }, (_, i) => (
            <g key={i}>{B(0.26 + i * 0.75, 0.3, L === 1 ? 0.5 : 0.7, 0.55, 3, 10, tom(cor, 0.15))}</g>
          ))}
        </g>
      );
    }
    case "mesinha":
      return (
        <g>
          {pernas(0.2, 0.2, 0.6, 0.6, 8, "#6B4A30")}
          {B(0.15, 0.15, 0.7, 0.7, 3, 8, "#8B5E3C")}
          {B(0.42, 0.4, 0.16, 0.16, 4, 11, "#F87171")}
        </g>
      );
    case "tv":
      return (
        <g>
          {B(0.05, 0.25, 1.9, 0.6, 11, 0, "#5B4636")}
          {B(0.3, 0.32, 1.4, 0.1, 24, 11, "#111827")}
          {B(0.36, 0.31, 1.28, 0.06, 19, 14, periodo === "noite" ? "#A5B4FC" : "#334155")}
        </g>
      );
    case "estante":
      return (
        <g>
          {B(0.05, 0.05, 1.9, 0.5, 44, 0, "#9A6B47")}
          {[6, 20, 34].map((z, k) =>
            ["#EF4444", "#3B82F6", "#22C55E", "#F59E0B", "#A855F7", "#14B8A6"].map((c, i) => (
              <g key={`${k}-${i}`}>{(i + k) % 3 !== 2 && B(0.15 + i * 0.28, 0.5, 0.18, 0.06, 9, z, c)}</g>
            ))
          )}
        </g>
      );
    case "tapete":
      return (
        <g>
          {B(0.1, 0.1, 1.8, 1.8, 1, 0, "#B98AD9")}
          <polygon points={pts([C(0.3, 0.3, 1.2), C(1.7, 0.3, 1.2), C(1.7, 1.7, 1.2), C(0.3, 1.7, 1.2)])} fill="none" stroke="#F3E8FF" strokeWidth="1.2" />
        </g>
      );
    case "geladeira":
      return (
        <g>
          {B(0.1, 0.1, 0.8, 0.8, 46, 0, "#E5E7EB")}
          {B(0.5, 0.88, 0.04, 0.04, 12, 26, "#9CA3AF")}
          {B(0.5, 0.88, 0.04, 0.04, 8, 10, "#9CA3AF")}
        </g>
      );
    case "fogao":
      return (
        <g>
          {B(0.1, 0.1, 0.8, 0.8, 18, 0, "#D1D5DB")}
          {[
            [0.3, 0.3],
            [0.62, 0.3],
            [0.3, 0.62],
            [0.62, 0.62],
          ].map(([u, v], i) => {
            const [cx, cy] = C(u + 0.04, v + 0.04, 18.2);
            return <ellipse key={i} cx={cx} cy={cy} rx="3.4" ry="1.7" fill="#374151" />;
          })}
          {B(0.25, 0.88, 0.5, 0.03, 8, 4, "#1F2937")}
        </g>
      );
    case "bancada":
      return (
        <g>
          {B(0, 0.1, 2, 0.85, 17, 0, "#E7DCC8")}
          {B(0, 0.1, 2, 0.85, 2, 17, "#9CA3AF")}
          {(() => {
            const [cx, cy] = C(0.62, 0.52, 19);
            return <ellipse cx={cx} cy={cy} rx="7" ry="3.4" fill="#64748B" />;
          })()}
          {B(0.6, 0.15, 0.06, 0.06, 9, 19, "#CBD5E1")}
          {B(1.3, 0.3, 0.3, 0.3, 6, 19, "#86EFAC")}
        </g>
      );
    case "mesajantar":
      return (
        <g>
          {pernas(0.25, 0.25, 1.5, 1.5, 15, "#6B4A30")}
          {B(0.2, 0.2, 1.6, 1.6, 3, 15, "#A0714A")}
          {[
            [0.6, 0.6],
            [1.2, 1.2],
          ].map(([u, v], i) => {
            const [cx, cy] = C(u + 0.1, v + 0.1, 18.2);
            return <ellipse key={i} cx={cx} cy={cy} rx="4.5" ry="2.2" fill="#F8FAFC" />;
          })}
        </g>
      );
    case "arvore": {
      const [cx, cy] = C(0.5, 0.5, 34);
      return (
        <g>
          {B(0.4, 0.4, 0.2, 0.2, 22, 0, "#8B5A2B")}
          <circle cx={cx} cy={cy} r="15" fill="#3F9D5A" />
          <circle cx={cx - 7} cy={cy + 4} r="10" fill="#4FB26A" />
          <circle cx={cx + 6} cy={cy - 6} r="9" fill="#5CC27A" />
          <circle cx={cx - 3} cy={cy - 8} r="5" fill="#7AD493" opacity="0.7" />
        </g>
      );
    }
    case "canteiro":
      return (
        <g>
          {B(0.1, 0.1, 0.8, 0.8, 5, 0, "#8B5A2B")}
          {B(0.14, 0.14, 0.72, 0.72, 1, 5, "#5B3A1E")}
          {[
            [0.3, 0.3, "#F472B6"],
            [0.65, 0.3, "#FBBF24"],
            [0.3, 0.65, "#F87171"],
            [0.65, 0.65, "#A78BFA"],
          ].map(([u, v, c], i) => {
            const [fx, fy] = C(u as number, v as number, 12);
            return (
              <g key={i}>
                <line x1={fx} y1={fy} x2={fx} y2={fy + 6} stroke="#3F7D55" strokeWidth="1.2" />
                <circle cx={fx} cy={fy} r="2.8" fill={c as string} />
                <circle cx={fx} cy={fy} r="1" fill="#FEF3C7" />
              </g>
            );
          })}
        </g>
      );
    case "banco":
      return (
        <g>
          {pernas(0.15, 0.35, 1.7, 0.4, 9, "#374151")}
          {B(0.1, 0.3, 1.8, 0.48, 3, 9, "#B07D52")}
          {B(0.1, 0.22, 1.8, 0.08, 14, 12, "#9A6B47")}
        </g>
      );
    case "fonte": {
      const [cx, cy] = C(1, 1, 30);
      return (
        <g>
          {B(0.1, 0.1, 1.8, 1.8, 8, 0, "#CBD5E1")}
          {B(0.22, 0.22, 1.56, 1.56, 1, 7.5, "#60A5FA")}
          {B(0.86, 0.86, 0.28, 0.28, 20, 8, "#E2E8F0")}
          <g fill="#BAE6FD">
            {[-6, 0, 6].map((dx, i) => (
              <circle key={dx} cx={cx + dx} cy={cy} r="1.6" className="vtm-gota" style={{ animationDelay: `${i * 0.3}s` }} />
            ))}
          </g>
        </g>
      );
    }
    case "churrasqueira": {
      const [cx, cy] = C(0.5, 0.5, 22);
      return (
        <g>
          {B(0.15, 0.15, 0.7, 0.7, 16, 0, "#B45309")}
          {B(0.2, 0.2, 0.6, 0.6, 1, 16, "#1F2937")}
          <g fill="#E5E7EB" opacity="0.8">
            <circle cx={cx} cy={cy} r="2.5" className="vtm-fumaca" />
            <circle cx={cx + 2} cy={cy} r="3" className="vtm-fumaca" style={{ animationDelay: "1s" }} />
          </g>
        </g>
      );
    }
    case "piscina":
      return (
        <g>
          {B(0, 0, 2, 2, 3, 0, "#E2E8F0")}
          <polygon points={pts([C(0.18, 0.18, 3.2), C(1.82, 0.18, 3.2), C(1.82, 1.82, 3.2), C(0.18, 1.82, 3.2)])} fill="#38BDF8" />
          <polygon points={pts([C(0.4, 0.5, 3.4), C(1.2, 0.5, 3.4), C(1.2, 0.62, 3.4), C(0.4, 0.62, 3.4)])} fill="#E0F2FE" opacity="0.6" className="vtm-onda" />
        </g>
      );
    // Etapa 312 — área de lazer
    case "piscinaG":
      return (
        <g>
          {B(0, 0, 3, 2, 4, 0, "#E2E8F0")}
          <polygon points={pts([C(0.16, 0.16, 4.2), C(2.84, 0.16, 4.2), C(2.84, 1.84, 4.2), C(0.16, 1.84, 4.2)])} fill="#0EA5E9" />
          <polygon points={pts([C(0.3, 0.3, 4.3), C(2.7, 0.3, 4.3), C(2.7, 1.7, 4.3), C(0.3, 1.7, 4.3)])} fill="#38BDF8" />
          {[0.6, 1.2].map((v) => (
            <polygon key={v} points={pts([C(0.6, v, 4.4), C(2.2, v, 4.4), C(2.2, v + 0.1, 4.4), C(0.6, v + 0.1, 4.4)])} fill="#E0F2FE" opacity="0.6" className="vtm-onda" />
          ))}
          {(() => {
            const [bx, by] = C(2.1, 1.1, 5);
            return (
              <g className="vtm-onda">
                <ellipse cx={bx} cy={by} rx="6" ry="3" fill="#F472B6" />
                <ellipse cx={bx} cy={by} rx="2.6" ry="1.2" fill="#38BDF8" />
              </g>
            );
          })()}
          {B(2.7, 0.2, 0.06, 0.06, 14, 0, "#CBD5E1")}
          {B(2.7, 0.5, 0.06, 0.06, 14, 0, "#CBD5E1")}
        </g>
      );
    case "espreguicadeira":
      return (
        <g>
          {pernas(0.2, 0.1, 0.6, 1.8, 5, "#E5E7EB")}
          {B(0.18, 0.5, 0.64, 1.4, 2, 5, "#60A5FA")}
          {B(0.18, 0.1, 0.64, 0.45, 2, 9, "#3B82F6")}
          {B(0.18, 0.1, 0.64, 0.08, 10, 5, "#3B82F6")}
        </g>
      );
    case "guardasol": {
      const [cx, cy] = C(0.5, 0.5, 34);
      return (
        <g>
          {B(0.38, 0.38, 0.24, 0.24, 2, 0, "#94A3B8")}
          {B(0.47, 0.47, 0.06, 0.06, 34, 2, "#F8FAFC")}
          <path d={`M${cx - 18} ${cy + 6} Q${cx} ${cy - 10} ${cx + 18} ${cy + 6} Z`} fill="#EF4444" />
          <path d={`M${cx - 6} ${cy + 1} Q${cx} ${cy - 9} ${cx + 6} ${cy + 1} L${cx + 5} ${cy + 4} L${cx - 5} ${cy + 4} Z`} fill="#FFFFFF" />
        </g>
      );
    }
    case "piquenique":
      return (
        <g>
          {B(0.05, 0.05, 1.9, 0.18, 7, 0, "#8B5A2B")}
          {B(0.05, 0.77, 1.9, 0.18, 7, 0, "#8B5A2B")}
          {pernas(0.2, 0.3, 1.6, 0.4, 13, "#7A4E2E")}
          {B(0.1, 0.25, 1.8, 0.5, 2, 13, "#C0874F")}
          {B(0.3, 0.3, 0.6, 0.4, 0.5, 15, "#EF4444")}
          {B(1.3, 0.35, 0.25, 0.25, 5, 15, "#FBBF24")}
        </g>
      );
    case "chuveirao": {
      const [cx, cy] = C(0.5, 0.25, 38);
      return (
        <g>
          {B(0.2, 0.2, 0.6, 0.6, 1, 0, "#CBD5E1")}
          {B(0.45, 0.15, 0.08, 0.08, 40, 0, "#94A3B8")}
          {B(0.4, 0.15, 0.2, 0.3, 3, 38, "#64748B")}
          {[-3, 0, 3].map((dx, i) => (
            <circle key={dx} cx={cx + dx + 4} cy={cy + 6} r="1" fill="#7DD3FC" className="vtm-gota" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
        </g>
      );
    }
    case "escorregador":
      return (
        <g>
          {B(0.05, 0.2, 0.5, 0.6, 30, 0, "#F59E0B")}
          {B(0, 0.15, 0.6, 0.7, 2, 30, "#FBBF24")}
          <polygon points={pts([C(0.55, 0.25, 30), C(0.55, 0.75, 30), C(1.95, 0.75, 2), C(1.95, 0.25, 2)])} fill="#38BDF8" />
          <polygon points={pts([C(0.55, 0.75, 30), C(1.95, 0.75, 2), C(1.95, 0.75, 6), C(0.55, 0.75, 34)])} fill="#0284C7" />
        </g>
      );
    case "fogueiraL": {
      const [cx, cy] = C(0.5, 0.5, 2);
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx="10" ry="5" fill="#57534E" />
          <rect x={cx - 8} y={cy - 2.5} width="16" height="3" rx="1.5" fill="#7A4E2E" transform={`rotate(18 ${cx} ${cy})`} />
          <rect x={cx - 8} y={cy - 2.5} width="16" height="3" rx="1.5" fill="#8B5A2B" transform={`rotate(-18 ${cx} ${cy})`} />
          <g className="vtm-fogo" style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
            <path d={`M${cx - 6} ${cy - 2} Q${cx - 7} ${cy - 12} ${cx} ${cy - 20} Q${cx + 7} ${cy - 12} ${cx + 6} ${cy - 2} Z`} fill="#F97316" />
            <path d={`M${cx - 3} ${cy - 2} Q${cx - 3} ${cy - 8} ${cx} ${cy - 13} Q${cx + 3} ${cy - 8} ${cx + 3} ${cy - 2} Z`} fill="#FDE047" />
          </g>
          {noite && <circle cx={cx} cy={cy - 6} r="20" fill="#F97316" opacity="0.18" />}
        </g>
      );
    }
    case "poste":
      return (
        <g>
          {B(0.42, 0.42, 0.16, 0.16, 44, 0, "#374151")}
          {B(0.34, 0.34, 0.32, 0.32, 7, 44, noite ? "#FDE68A" : "#F1F5F9")}
        </g>
      );
    case "vaso": {
      const [cx, cy] = C(0.5, 0.5, 18);
      return (
        <g>
          {B(0.3, 0.3, 0.4, 0.4, 9, 0, "#C8693B")}
          <ellipse cx={cx - 4} cy={cy + 2} rx="3" ry="7" fill="#3F9D5A" transform={`rotate(-25 ${cx - 4} ${cy + 2})`} />
          <ellipse cx={cx + 4} cy={cy + 2} rx="3" ry="7" fill="#4FB26A" transform={`rotate(25 ${cx + 4} ${cy + 2})`} />
          <ellipse cx={cx} cy={cy - 2} rx="3" ry="8" fill="#5CC27A" />
        </g>
      );
    }
    case "puff":
      return <g>{B(0.2, 0.2, 0.6, 0.6, 8, 0, "#FB923C")}</g>;
    case "aquario": {
      const [cx, cy] = C(0.5, 0.5, 18);
      return (
        <g>
          {B(0.1, 0.1, 0.8, 0.8, 10, 0, "#5B4636")}
          {B(0.12, 0.12, 0.76, 0.76, 16, 10, "#7DD3FC", 0.7)}
          <ellipse cx={cx} cy={cy} rx="3" ry="1.8" fill="#F97316" className="vtm-onda" />
        </g>
      );
    }
    case "bau":
      return (
        <g>
          {B(0.15, 0.2, 0.7, 0.6, 11, 0, "#92400E")}
          {B(0.15, 0.2, 0.7, 0.6, 4, 11, "#B45309")}
          {B(0.45, 0.78, 0.1, 0.03, 6, 6, "#FBBF24")}
        </g>
      );
    case "trofeuG": {
      const [cx, cy] = C(0.5, 0.5, 22);
      return (
        <g>
          {B(0.25, 0.25, 0.5, 0.5, 7, 0, "#78350F")}
          {B(0.44, 0.44, 0.12, 0.12, 6, 7, "#D97706")}
          <path d={`M${cx - 8} ${cy - 6} L${cx + 8} ${cy - 6} L${cx + 5} ${cy + 4} Q${cx} ${cy + 8} ${cx - 5} ${cy + 4} Z`} fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
          <path d={`M${cx - 8} ${cy - 4} q-5 0 -3 5 q2 2 5 1 M${cx + 8} ${cy - 4} q5 0 3 5 q-2 2 -5 1`} stroke="#D97706" strokeWidth="1.4" fill="none" />
        </g>
      );
    }
    // ---- Etapa 308 — veículos ----
    case "skate":
      return (
        <g>
          {[0.25, 0.65].map((u) => [0.38, 0.6].map((v) => <g key={`${u}${v}`}>{B(u, v, 0.08, 0.06, 3, 0, "#111827")}</g>))}
          {B(0.15, 0.36, 0.7, 0.3, 1.5, 3, "#F97316")}
        </g>
      );
    case "patinete":
      return (
        <g>
          {B(0.12, 0.42, 0.7, 0.16, 2, 2, "#3B82F6")}
          {B(0.14, 0.46, 0.06, 0.06, 26, 4, "#9CA3AF")}
          {B(0.14, 0.28, 0.06, 0.44, 2.5, 30, "#111827")}
        </g>
      );
    case "bicicleta":
    case "moto": {
      const moto = mv.id === "moto";
      const roda = (u: number) => {
        const [wx, wy] = C(u, 0.5, moto ? 8 : 9);
        return <ellipse key={u} cx={wx} cy={wy} rx={moto ? 7 : 7.5} ry={moto ? 8 : 9} fill="none" stroke="#111827" strokeWidth={moto ? 3.2 : 1.6} />;
      };
      const [a1, a2] = C(0.4, 0.5, 10);
      const [b1, b2] = C(1.6, 0.5, 10);
      const [s1, s2] = C(0.95, 0.5, 20);
      return (
        <g>
          {roda(0.35)}
          {moto ? (
            <>
              {B(0.45, 0.38, 1.1, 0.24, 9, 7, "#DC2626")}
              {B(0.6, 0.38, 0.5, 0.24, 3, 16, "#111827")}
              {B(1.45, 0.4, 0.08, 0.2, 14, 12, "#6B7280")}
              {B(1.5, 0.42, 0.06, 0.16, 4, 14, noite ? "#FDE68A" : "#F1F5F9")}
            </>
          ) : (
            <>
              <path d={`M${a1} ${a2} L${s1} ${s2} L${b1} ${b2} M${s1} ${s2} L${(a1 + b1) / 2} ${(a2 + b2) / 2 + 4}`} stroke="#10B981" strokeWidth="1.8" fill="none" />
              <rect x={s1 - 3} y={s2 - 2} width="6" height="2" rx="1" fill="#111827" />
            </>
          )}
          {roda(1.65)}
        </g>
      );
    }
    case "kart":
      return (
        <g>
          {[0.2, 1.6].map((u) => [0.1, 0.75].map((v) => <g key={`${u}${v}`}>{B(u, v, 0.25, 0.15, 6, 0, "#111827")}</g>))}
          {B(0.15, 0.25, 1.7, 0.5, 5, 3, "#22C55E")}
          {B(0.5, 0.33, 0.4, 0.34, 9, 8, "#111827")}
          {B(1.2, 0.46, 0.06, 0.08, 8, 8, "#6B7280")}
          {B(1.65, 0.3, 0.2, 0.4, 3, 8, "#FDE047")}
        </g>
      );
    case "carro":
    case "jipe":
    case "esportivo": {
      const cor = mv.id === "carro" ? "#3B82F6" : mv.id === "jipe" ? "#65A30D" : "#EF4444";
      const alto = mv.id === "jipe" ? 4 : mv.id === "esportivo" ? -3 : 0;
      return (
        <g>
          {[0.3, 1.4].map((u) => [0.18, 1.72].map((v) => <g key={`${u}${v}`}>{B(u, v, 0.32, 0.1, 8 + alto / 2, 0, "#111827")}</g>))}
          {B(0.08, 0.25, 1.84, 1.5, 9 + alto, 4, cor)}
          {/* cabine com vidro */}
          {B(mv.id === "esportivo" ? 0.6 : 0.45, 0.35, mv.id === "esportivo" ? 0.8 : 1, 1.3, mv.id === "esportivo" ? 7 : 10 + alto, 13 + alto, "#93C5FD")}
          {B(mv.id === "esportivo" ? 0.62 : 0.48, 0.38, mv.id === "esportivo" ? 0.76 : 0.94, 1.24, 1.5, (mv.id === "esportivo" ? 20 : 23 + 2 * alto) + alto * 0, cor)}
          {/* faróis na frente */}
          {B(1.9, 0.4, 0.04, 0.25, 3, 8 + alto, noite ? "#FDE68A" : "#F8FAFC")}
          {B(1.9, 1.35, 0.04, 0.25, 3, 8 + alto, noite ? "#FDE68A" : "#F8FAFC")}
          {mv.id === "esportivo" && B(0.08, 0.3, 0.12, 1.4, 2, 17, "#111827")}
          {mv.id === "jipe" && B(0.0, 0.8, 0.08, 0.4, 9, 9, "#111827")}
        </g>
      );
    }
    case "foguete": {
      const [tx, ty] = C(0.5, 0.5, 66);
      const [jx, jy] = C(0.5, 0.82, 40);
      return (
        <g>
          {B(0.12, 0.12, 0.22, 0.22, 12, 0, "#DC2626")}
          {B(0.66, 0.66, 0.22, 0.22, 12, 0, "#DC2626")}
          {B(0.3, 0.3, 0.4, 0.4, 56, 6, "#E5E7EB")}
          <path d={`M${tx - 9} ${ty + 6} L${tx} ${ty - 12} L${tx + 9} ${ty + 6} Z`} fill="#DC2626" />
          <circle cx={jx} cy={jy} r="4" fill="#60A5FA" stroke="#94A3B8" strokeWidth="1.2" />
          {noite && <ellipse cx={C(0.5, 0.5, 2)[0]} cy={C(0.5, 0.5, 2)[1]} rx="6" ry="3" fill="#F97316" className="vtm-fogo" />}
        </g>
      );
    }
    // ---- lazer ----
    case "rede": {
      const [a1, a2] = C(0.15, 0.5, 18);
      const [b1, b2] = C(1.85, 0.5, 18);
      return (
        <g>
          {B(0.05, 0.45, 0.1, 0.1, 24, 0, "#8B5A2B")}
          <path d={`M${a1} ${a2} Q${(a1 + b1) / 2} ${(a2 + b2) / 2 + 16} ${b1} ${b2} Q${(a1 + b1) / 2} ${(a2 + b2) / 2 + 9} ${a1} ${a2} Z`} fill="#F59E0B" />
          <path d={`M${a1} ${a2} Q${(a1 + b1) / 2} ${(a2 + b2) / 2 + 13} ${b1} ${b2}`} stroke="#DC2626" strokeWidth="1.5" fill="none" />
          {B(1.85, 0.45, 0.1, 0.1, 24, 0, "#8B5A2B")}
        </g>
      );
    }
    case "violaoP": {
      const [gx, gy] = C(0.5, 0.5, 14);
      return (
        <g>
          {B(0.35, 0.35, 0.3, 0.3, 3, 0, "#374151")}
          <g transform={`translate(${gx} ${gy}) rotate(-10)`}>
            <rect x="-1.2" y="-22" width="2.4" height="16" fill="#7C4A21" />
            <circle cx="0" cy="-3" r="5" fill="#D97706" />
            <circle cx="0" cy="4" r="6.5" fill="#D97706" />
            <circle cx="0" cy="1" r="1.8" fill="#5B3416" />
          </g>
        </g>
      );
    }
    case "piano":
      return (
        <g>
          {B(0.05, 0.08, 1.9, 0.55, 32, 0, "#111827")}
          {B(0.1, 0.6, 1.8, 0.25, 2, 17, "#F8FAFC")}
          {Array.from({ length: 6 }, (_, i) => <g key={i}>{B(0.25 + i * 0.28, 0.6, 0.1, 0.13, 1.5, 19, "#111827")}</g>)}
          {B(0.5, 0.9, 1, 0.1, 9, 0, "#374151")}
        </g>
      );
    case "fliperama":
      return (
        <g>
          {B(0.15, 0.15, 0.7, 0.65, 42, 0, "#7C3AED")}
          {B(0.2, 0.76, 0.6, 0.06, 12, 24, noite ? "#67E8F9" : "#22D3EE")}
          {B(0.18, 0.7, 0.64, 0.2, 2, 17, "#111827")}
          {B(0.35, 0.78, 0.06, 0.06, 4, 19, "#EF4444")}
          {B(0.6, 0.78, 0.06, 0.06, 3, 19, "#FDE047")}
          {B(0.15, 0.15, 0.7, 0.65, 5, 42, "#A78BFA")}
        </g>
      );
    case "sinuca": {
      const bolas = [
        [0.6, 0.7, "#EF4444"],
        [1.2, 0.9, "#FDE047"],
        [1.0, 1.3, "#3B82F6"],
        [0.5, 1.4, "#F8FAFC"],
      ] as const;
      return (
        <g>
          {pernas(0.2, 0.3, 1.6, 1.4, 14, "#5B3416")}
          {B(0.1, 0.25, 1.8, 1.5, 4, 14, "#7C4A21")}
          {B(0.22, 0.37, 1.56, 1.26, 0.6, 18, "#15803D")}
          {bolas.map(([u, v, c], i) => {
            const [bx, by] = C(u, v, 20);
            return <circle key={i} cx={bx} cy={by} r="1.8" fill={c} />;
          })}
        </g>
      );
    }
    case "camaelastica": {
      const [mx, my] = C(1, 1, 12);
      return (
        <g>
          {pernas(0.25, 0.25, 1.5, 1.5, 11, "#334155")}
          <ellipse cx={mx} cy={my} rx="27" ry="13.5" fill="#3B82F6" />
          <ellipse cx={mx} cy={my} rx="22" ry="11" fill="#111827" />
        </g>
      );
    }
    case "telescopio": {
      const [px, py] = C(0.5, 0.5, 0);
      return (
        <g>
          <path d={`M${px} ${py - 18} L${px - 7} ${py} M${px} ${py - 18} L${px + 7} ${py} M${px} ${py - 18} L${px} ${py + 2}`} stroke="#374151" strokeWidth="1.5" />
          <g transform={`translate(${px} ${py - 20}) rotate(-35)`}>
            <rect x="-10" y="-3" width="22" height="6" rx="2" fill="#1E3A8A" />
            <rect x="10" y="-4" width="4" height="8" rx="1" fill="#93C5FD" />
          </g>
        </g>
      );
    }
    case "estatua": {
      const [ex, ey] = C(0.5, 0.5, 26);
      return (
        <g>
          {B(0.2, 0.2, 0.6, 0.6, 10, 0, "#E7E5E4")}
          <path d={`M${ex - 8} ${ey - 9} l3 -6 l3 5 Z M${ex + 8} ${ey - 9} l-3 -6 l-3 5 Z`} fill="#D4A017" />
          <ellipse cx={ex} cy={ey} rx="10" ry="11" fill="#F5C542" />
          <ellipse cx={ex - 3} cy={ey - 4} rx="3" ry="2" fill="#FEF3C7" opacity="0.8" />
          <circle cx={ex - 3.5} cy={ey - 1} r="1.2" fill="#8A6A10" />
          <circle cx={ex + 3.5} cy={ey - 1} r="1.2" fill="#8A6A10" />
          <circle cx={ex + 9} cy={ey - 12} r="1.4" fill="#FEF3C7" className="vtm-brilha" />
        </g>
      );
    }
    // ---- bichinhos ----
    case "cachorro": {
      const [cx2, cy2] = C(1.5, 0.55, 8);
      const [tx2, ty2] = C(0.5, 0.5, 30);
      return (
        <g>
          {B(0.05, 0.1, 0.9, 0.8, 18, 0, "#B45309")}
          <path d={`M${C(0.05, 0.9, 18)[0]} ${C(0.05, 0.9, 18)[1]} L${tx2} ${ty2} L${C(0.95, 0.1, 18)[0]} ${C(0.95, 0.1, 18)[1]}`} fill="#7C2D12" />
          {B(0.95, 0.38, 0.03, 0.3, 11, 0, "#3F1D0B")}
          <g className="vtm-gingar">
            <ellipse cx={cx2} cy={cy2} rx="7" ry="5" fill="#D6A26B" />
            <circle cx={cx2 + 6} cy={cy2 - 5} r="4.5" fill="#D6A26B" />
            <ellipse cx={cx2 + 4} cy={cy2 - 8} rx="1.8" ry="3" fill="#8B5A2B" />
            <circle cx={cx2 + 7.5} cy={cy2 - 5.5} r="0.9" fill="#111" />
            <path d={`M${cx2 - 7} ${cy2 - 2} q-3 -4 -1 -6`} stroke="#D6A26B" strokeWidth="1.8" fill="none" className="vtm-broto" />
          </g>
        </g>
      );
    }
    case "gato": {
      const [gx, gy] = C(0.5, 0.5, 7);
      return (
        <g>
          {B(0.15, 0.15, 0.7, 0.7, 4, 0, "#F472B6")}
          <g className="vtm-respira">
            <ellipse cx={gx} cy={gy} rx="7" ry="4.5" fill="#F59E0B" />
            <circle cx={gx + 5} cy={gy - 3} r="3.6" fill="#F59E0B" />
            <path d={`M${gx + 3} ${gy - 5.5} l0.8 -3 l1.5 2.4 M${gx + 6.3} ${gy - 5.5} l0.8 -3 l1.2 2.6`} fill="#F59E0B" stroke="#F59E0B" strokeWidth="0.8" />
            <path d={`M${gx + 3.6} ${gy - 3} q0.8 0.6 1.6 0 M${gx + 5.8} ${gy - 3} q0.8 0.6 1.6 0`} stroke="#7C2D12" strokeWidth="0.6" fill="none" />
            <path d={`M${gx - 7} ${gy} q-3 -1 -2 -5`} stroke="#F59E0B" strokeWidth="1.8" fill="none" />
          </g>
        </g>
      );
    }
    case "coelho": {
      const [rx, ry] = C(0.5, 0.5, 4);
      return (
        <g className="vtm-voa" style={{ animationDuration: "1.2s" }}>
          <ellipse cx={rx} cy={ry} rx="5.5" ry="4.5" fill="#F8FAFC" />
          <circle cx={rx + 4} cy={ry - 4} r="3.4" fill="#F8FAFC" />
          <ellipse cx={rx + 3} cy={ry - 10} rx="1.2" ry="4" fill="#F8FAFC" stroke="#F9A8D4" strokeWidth="0.6" />
          <ellipse cx={rx + 5.2} cy={ry - 10} rx="1.2" ry="4" fill="#F8FAFC" stroke="#F9A8D4" strokeWidth="0.6" />
          <circle cx={rx + 5} cy={ry - 4.5} r="0.8" fill="#111" />
        </g>
      );
    }
    case "passaro": {
      const [px, py] = C(0.5, 0.5, 0);
      return (
        <g>
          {B(0.44, 0.44, 0.12, 0.12, 22, 0, "#6B7280")}
          <path d={`M${px - 8} ${py - 22} Q${px} ${py - 40} ${px + 8} ${py - 22} Z`} fill="none" stroke="#D4A017" strokeWidth="1" />
          {[-5, -2, 1, 4].map((dx) => (
            <line key={dx} x1={px + dx} y1={py - 22} x2={px + dx * 0.6} y2={py - 35} stroke="#D4A017" strokeWidth="0.6" />
          ))}
          <ellipse cx={px - 8} cy={py - 22} rx="8" ry="1.5" fill="#D4A017" transform={`translate(8 0)`} />
          <g className="vtm-voa" style={{ animationDuration: "1.5s" }}>
            <ellipse cx={px} cy={py - 27} rx="3" ry="2.4" fill="#FDE047" />
            <path d={`M${px + 3} ${py - 28} l2 0.8 l-2 0.6 Z`} fill="#F97316" />
          </g>
        </g>
      );
    }
    default:
      return null;
  }
}

/** Enfeites de parede: x=0 → parede da esquerda; y=0 → da direita. */
function NaParede({ it, mv, periodo }: { it: Colocado; mv: Movel; periodo: Periodo }) {
  const esquerda = it.x === 0;
  const i = esquerda ? it.y : it.x;
  const W = (a: number, h: number): [number, number] => (esquerda ? P(0, i + a, h) : P(i + a, 0, h));
  const quad = (a0: number, a1: number, h0: number, h1: number) => pts([W(a0, h0), W(a1, h0), W(a1, h1), W(a0, h1)]);
  const ceu = periodo === "noite" ? "#1E2A5A" : periodo === "entardecer" ? "#F7A97C" : periodo === "manha" ? "#BDE3F7" : "#7EC8F2";
  switch (mv.id) {
    case "quadro":
      return (
        <g>
          <polygon points={quad(0.15, 0.85, 26, 46)} fill="#7A4E2E" />
          <polygon points={quad(0.22, 0.78, 29, 43)} fill="#FDE68A" />
          <polygon points={quad(0.3, 0.55, 30, 38)} fill="#86C77A" />
          <polygon points={quad(0.45, 0.72, 30, 36)} fill="#60A5FA" />
        </g>
      );
    case "janela":
      return (
        <g>
          <polygon points={quad(0.12, 0.88, 20, 52)} fill="#E7DCC8" />
          <polygon points={quad(0.18, 0.82, 23, 49)} fill={ceu} />
          {periodo === "noite" && <polygon points={quad(0.55, 0.65, 40, 45)} fill="#FDF3C4" />}
          <polygon points={quad(0.48, 0.52, 23, 49)} fill="#E7DCC8" />
          <polygon points={quad(0.18, 0.82, 35, 37)} fill="#E7DCC8" />
        </g>
      );
    case "relogio": {
      const [cx, cy] = W(0.5, 40);
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx="6" ry="7.5" fill="#7A4E2E" />
          <ellipse cx={cx} cy={cy} rx="4.6" ry="6" fill="#F8FAFC" />
          <line x1={cx} y1={cy} x2={cx} y2={cy - 4} stroke="#1F2937" strokeWidth="1" />
          <line x1={cx} y1={cy} x2={cx + (esquerda ? -2.5 : 2.5)} y2={cy + 1} stroke="#1F2937" strokeWidth="1" />
        </g>
      );
    }
    case "prateleira":
      return (
        <g>
          <polygon points={quad(0.1, 0.9, 30, 32.5)} fill="#9A6B47" />
          <polygon points={quad(0.2, 0.32, 32.5, 41)} fill="#EF4444" />
          <polygon points={quad(0.34, 0.44, 32.5, 39)} fill="#3B82F6" />
          <polygon points={quad(0.6, 0.8, 32.5, 37)} fill="#86EFAC" />
        </g>
      );
    default:
      return null;
  }
}

export type MascoteNaCasa = { cor: CorMascote; fase: number; humor: Humor; equipados: Partial<Record<Slot, string>> };

export function CasaIso({
  comodoId,
  comodo,
  periodo,
  mascote,
  selecionado,
  previa,
  aoTocarChao,
  aoTocarItem,
  aoTocarMascote,
  pulo = 0,
  className = "",
}: {
  comodoId: ComodoId;
  comodo: Comodo;
  periodo: Periodo;
  mascote?: MascoteNaCasa | null;
  selecionado?: string | null;
  previa?: { m: string; x: number; y: number; r: 0 | 1; valido: boolean } | null;
  aoTocarChao?: (x: number, y: number) => void;
  aoTocarItem?: (u: string) => void;
  aoTocarMascote?: () => void;
  pulo?: number;
  className?: string;
}) {
  const externo = !!COMODOS.find((c) => c.id === comodoId)?.externo;
  const piso = estilo(comodo.piso) ?? estilo(externo ? "grama" : "madeira")!;
  const parede = estilo(comodo.parede) ?? estilo("creme")!;
  const noite = periodo === "noite";

  // o mascote passeia pelos quadradinhos livres
  const livres = useMemo(() => {
    const occ = ocupados(comodo);
    const l: [number, number][] = [];
    for (let i = 0; i < TAM; i++) for (let j = 0; j < TAM; j++) if (!occ.has(`${i},${j}`)) l.push([i, j]);
    return l;
  }, [comodo]);
  const [pos, setPos] = useState<[number, number]>(() => [Math.floor(TAM / 2), Math.floor(TAM / 2)]);
  const posRef = useRef(pos);
  posRef.current = pos;
  useEffect(() => {
    if (!livres.length) return;
    const chave = (p: [number, number]) => `${p[0]},${p[1]}`;
    const conjunto = new Set(livres.map(chave));
    if (!conjunto.has(chave(posRef.current))) setPos(livres[Math.floor(livres.length / 2)]);
    const t = setInterval(() => {
      const [a, b] = posRef.current;
      const viz = ([[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]] as [number, number][]).filter((p) => conjunto.has(chave(p)));
      if (viz.length && Math.random() < 0.7) setPos(viz[Math.floor(Math.random() * viz.length)]);
    }, 2600);
    return () => clearInterval(t);
  }, [livres]);

  // ordem de desenho (o que está mais "na frente" por último)
  const itensChao = comodo.itens.filter((it) => movel(it.m)?.tipo === "chao");
  const itensParede = comodo.itens.filter((it) => movel(it.m)?.tipo === "parede");
  type Ent = { chave: number; el: React.ReactNode };
  const ents: Ent[] = [];
  for (const it of comodo.itens) {
    const mv = movel(it.m);
    if (!mv || mv.tipo === "chao" || mv.tipo === "parede") continue;
    const t = tamanhoNoChao(mv, it.r);
    ents.push({
      chave: it.x + t.w + it.y + t.d + (it.x + it.y) * 0.001,
      el: (
        <g key={it.u} onClick={aoTocarItem ? () => aoTocarItem(it.u) : undefined} style={aoTocarItem ? { cursor: "pointer" } : undefined}>
          <DesenhoMovel it={it} mv={mv} periodo={periodo} />
          {selecionado === it.u && <Marca it={it} mv={mv} />}
        </g>
      ),
    });
  }
  if (mascote) {
    const [px, py] = P(pos[0] + 0.5, pos[1] + 0.5);
    ents.push({
      chave: pos[0] + pos[1] + 2.0005,
      el: (
        <g key="mascote" style={{ transform: `translate(${px - 24}px, ${py - 42}px)`, transition: "transform 0.9s ease-in-out" }} onClick={aoTocarMascote}>
          <g key={pulo} className={pulo ? "vtm-pulo" : ""}>
            <Mascote cor={mascote.cor} fase={Math.max(1, mascote.fase)} humor={mascote.humor} equipados={{ ...mascote.equipados, fundo: undefined }} tamanho={48} volume={false} />
          </g>
        </g>
      ),
    });
  }
  if (previa) {
    const mv = movel(previa.m);
    if (mv && mv.tipo !== "chao" && mv.tipo !== "parede") {
      const t = tamanhoNoChao(mv, previa.r);
      ents.push({
        chave: previa.x + t.w + previa.y + t.d + 0.0009,
        el: (
          <g key="previa" opacity="0.75" pointerEvents="none">
            <DesenhoMovel it={{ u: "previa", m: previa.m, x: previa.x, y: previa.y, r: previa.r }} mv={mv} periodo={periodo} />
          </g>
        ),
      });
    }
  }
  ents.sort((a, b) => a.chave - b.chave);

  return (
    <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className={`w-full h-auto select-none ${className}`} role="img" aria-label="Casa do mascote">
      {/* laje (espessura do chão) */}
      <polygon points={pts([P(0, TAM), P(TAM, TAM), P(TAM, TAM, -9), P(0, TAM, -9)])} fill={tom(piso.b, -0.35)} />
      <polygon points={pts([P(TAM, 0), P(TAM, TAM), P(TAM, TAM, -9), P(TAM, 0, -9)])} fill={tom(piso.b, -0.5)} />

      {/* paredes do fundo (ou cerca, no quintal) */}
      {!externo ? (
        <g>
          <polygon points={pts([P(0, 0), P(0, TAM), P(0, TAM, PAREDE), P(0, 0, PAREDE)])} fill={tom(parede.a, -0.1)} />
          <polygon points={pts([P(0, 0), P(TAM, 0), P(TAM, 0, PAREDE), P(0, 0, PAREDE)])} fill={parede.a} />
          {parede.id === "listras" &&
            Array.from({ length: TAM * 2 }, (_, k) => (
              <g key={k}>
                <polygon points={pts([P(0, k / 2, 0), P(0, k / 2 + 0.22, 0), P(0, k / 2 + 0.22, PAREDE), P(0, k / 2, PAREDE)])} fill={parede.b} opacity="0.45" />
                <polygon points={pts([P(k / 2, 0, 0), P(k / 2 + 0.22, 0, 0), P(k / 2 + 0.22, 0, PAREDE), P(k / 2, 0, PAREDE)])} fill={parede.b} opacity="0.45" />
              </g>
            ))}
          {parede.id === "tijolo" &&
            Array.from({ length: 9 }, (_, k) => (
              <g key={k} stroke={parede.b} strokeWidth="0.8" opacity="0.7">
                <polyline points={pts([P(0, 0, 7 * k + 4), P(0, TAM, 7 * k + 4)])} fill="none" />
                <polyline points={pts([P(0, 0, 7 * k + 4), P(TAM, 0, 7 * k + 4)])} fill="none" />
              </g>
            ))}
          {/* rodapé e topo da parede */}
          <polygon points={pts([P(0, 0), P(0, TAM), P(0, TAM, 4), P(0, 0, 4)])} fill={parede.b} />
          <polygon points={pts([P(0, 0), P(TAM, 0), P(TAM, 0, 4), P(0, 0, 4)])} fill={tom(parede.b, 0.05)} />
          <polygon points={pts([P(0, 0, PAREDE), P(0, TAM, PAREDE), P(-0.25, TAM, PAREDE), P(-0.25, -0.25, PAREDE), P(TAM, -0.25, PAREDE), P(TAM, 0, PAREDE)])} fill={tom(parede.a, 0.25)} />
        </g>
      ) : (
        <g>
          {Array.from({ length: TAM + 1 }, (_, k) => (
            <g key={k}>
              <Bloco x={-0.12} y={k - 0.06} w={0.12} d={0.12} h={18} cor="#F8FAFC" />
              <Bloco x={k - 0.06} y={-0.12} w={0.12} d={0.12} h={18} cor="#F8FAFC" />
            </g>
          ))}
          <polygon points={pts([P(-0.06, 0, 12), P(-0.06, TAM, 12), P(-0.06, TAM, 15), P(-0.06, 0, 15)])} fill="#E2E8F0" />
          <polygon points={pts([P(0, -0.06, 12), P(TAM, -0.06, 12), P(TAM, -0.06, 15), P(0, -0.06, 15)])} fill="#F1F5F9" />
        </g>
      )}

      {/* chão quadriculado (cada quadradinho é tocável) */}
      {Array.from({ length: TAM }, (_, i) =>
        Array.from({ length: TAM }, (_, j) => (
          <polygon
            key={`${i}-${j}`}
            points={pts([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)])}
            fill={(i + j) % 2 ? piso.a : piso.b}
            stroke={tom(piso.b, -0.12)}
            strokeWidth="0.35"
            onClick={aoTocarChao ? () => aoTocarChao(i, j) : undefined}
          />
        ))
      )}
      {/* sombra das paredes no chão */}
      {!externo && <polygon points={pts([P(0, 0), P(TAM, 0), P(TAM, 0.5), P(0.5, 0.5), P(0.5, TAM), P(0, TAM)])} fill="#000" opacity="0.08" pointerEvents="none" />}

      {/* tapetes e piscinas (por baixo de tudo) */}
      {itensChao.map((it) => {
        const mv = movel(it.m)!;
        return (
          <g key={it.u} onClick={aoTocarItem ? () => aoTocarItem(it.u) : undefined}>
            <DesenhoMovel it={it} mv={mv} periodo={periodo} />
            {selecionado === it.u && <Marca it={it} mv={mv} />}
          </g>
        );
      })}
      {itensParede.map((it) => {
        const mv = movel(it.m)!;
        return (
          <g key={it.u} onClick={aoTocarItem ? () => aoTocarItem(it.u) : undefined}>
            <NaParede it={it} mv={mv} periodo={periodo} />
            {selecionado === it.u && <Marca it={it} mv={mv} />}
          </g>
        );
      })}

      {/* onde vai ficar (verde = dá, vermelho = não dá) */}
      {previa &&
        (() => {
          const mv = movel(previa.m);
          if (!mv) return null;
          const t = tamanhoNoChao(mv, previa.r);
          return (
            <g pointerEvents="none">
              <polygon
                points={pts([P(previa.x, previa.y), P(previa.x + t.w, previa.y), P(previa.x + t.w, previa.y + t.d), P(previa.x, previa.y + t.d)])}
                fill={previa.valido ? "#22C55E" : "#EF4444"}
                opacity="0.35"
                stroke={previa.valido ? "#16A34A" : "#DC2626"}
                strokeWidth="1"
              />
              {mv.tipo === "chao" && (
                <g opacity="0.75">
                  <DesenhoMovel it={{ u: "previa", m: previa.m, x: previa.x, y: previa.y, r: previa.r }} mv={mv} periodo={periodo} />
                </g>
              )}
              {mv.tipo === "parede" && (previa.x === 0 || previa.y === 0) && (
                <g opacity="0.75">
                  <NaParede it={{ u: "previa", m: previa.m, x: previa.x, y: previa.y, r: 0 }} mv={mv} periodo={periodo} />
                </g>
              )}
            </g>
          );
        })()}

      {ents.map((e) => e.el)}

      {/* noite: escurece e as luzes acendem */}
      {(noite || periodo === "entardecer") && (
        <g pointerEvents="none">
          <rect width={LARGURA} height={ALTURA} fill={noite ? "#0B1026" : "#7C2D12"} opacity={noite ? 0.38 : 0.1} />
          {noite &&
            comodo.itens
              .filter((it) => movel(it.m)?.luz || it.m === "janela" || it.m === "tv")
              .map((it) => {
                const [lx, ly] = it.m === "janela" ? (it.x === 0 ? P(0, it.y + 0.5, 36) : P(it.x + 0.5, 0, 36)) : P(it.x + 0.5, it.y + 0.5, 30);
                return <circle key={it.u} cx={lx} cy={ly} r={it.m === "janela" ? 14 : 30} fill="url(#vtc-luz)" />;
              })}
        </g>
      )}
      <defs>
        <radialGradient id="vtc-luz">
          <stop offset="0" stopColor="#FDE68A" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FDE68A" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/** Contorno de seleção no chão do móvel. */
function Marca({ it, mv }: { it: Colocado; mv: Movel }) {
  if (mv.tipo === "parede") {
    const esquerda = it.x === 0;
    const i = esquerda ? it.y : it.x;
    const W = (a: number, h: number): [number, number] => (esquerda ? P(0, i + a, h) : P(i + a, 0, h));
    return <polygon points={pts([W(0.05, 16), W(0.95, 16), W(0.95, 56), W(0.05, 56)])} fill="none" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="3 2" pointerEvents="none" />;
  }
  const t = tamanhoNoChao(mv, it.r);
  return (
    <polygon
      points={pts([P(it.x, it.y), P(it.x + t.w, it.y), P(it.x + t.w, it.y + t.d), P(it.x, it.y + t.d)])}
      fill="#FBBF24"
      opacity="0.3"
      stroke="#F59E0B"
      strokeWidth="1.2"
      pointerEvents="none"
    />
  );
}
