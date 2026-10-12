"use client";

// Etapa 310 — o mapa do "jogo dos hábitos": uma ilhazinha isométrica com a
// casa, a garagem, o seu jardim, o jardim da dupla, a lojinha, o mural de
// missões e o pódio das conquistas. O mascote passeia pelos caminhos e é
// só tocar num lugar pra entrar.
import { useEffect, useMemo, useRef, useState } from "react";
import { Mascote, type Periodo } from "@/components/mascote/Mascote";
import type { CorMascote, Slot } from "@/lib/mascote/mascote";

export type LugarMundo = "casa" | "garagem" | "jardim" | "juntos" | "lojinha" | "missoes" | "conquistas";

const N = 9;
const MW = 16;
const MH = 8;
const OX = MW * N + 14;
const OY = 64;
const LARG = MW * 2 * N + 28;
const ALT = OY + MH * 2 * N + 30;
const P = (gx: number, gy: number, z = 0): [number, number] => [OX + (gx - gy) * MW, OY + (gx + gy) * MH - z];
const pts = (l: [number, number][]) => l.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");

function tom(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, "0")).join("")}`;
}

function bloco(x: number, y: number, w: number, d: number, h: number, cor: string, z = 0) {
  return (
    <g>
      <polygon points={pts([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)])} fill={tom(cor, -0.08)} />
      <polygon points={pts([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)])} fill={tom(cor, -0.24)} />
      <polygon points={pts([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)])} fill={tom(cor, 0.12)} />
    </g>
  );
}

/** Telhado de quatro águas sobre um retângulo. */
function telhado(x: number, y: number, w: number, d: number, z: number, alto: number, cor: string) {
  const topo = P(x + w / 2, y + d / 2, z + alto);
  return (
    <g>
      <polygon points={pts([P(x, y + d, z), P(x + w, y + d, z), topo])} fill={tom(cor, -0.05)} />
      <polygon points={pts([P(x + w, y, z), P(x + w, y + d, z), topo])} fill={tom(cor, -0.22)} />
    </g>
  );
}

// onde fica cada lugar (x, y, largura, fundo)
const LUGARES: Record<LugarMundo, [number, number, number, number]> = {
  casa: [1, 1, 2, 2],
  garagem: [4, 1, 2, 1],
  jardim: [6, 1, 2, 2],
  lojinha: [1, 5, 2, 1],
  missoes: [4, 5, 1, 1],
  conquistas: [5, 6, 1, 1],
  juntos: [6, 5, 2, 2],
};

const NOMES: Record<LugarMundo, string> = {
  casa: "Casa",
  garagem: "Garagem",
  jardim: "Seu jardim",
  juntos: "Juntos",
  lojinha: "Lojinha",
  missoes: "Missões",
  conquistas: "Conquistas",
};

// caminhos de pedrinha
const CAMINHO = new Set<string>();
for (let i = 0; i < N; i++) {
  CAMINHO.add(`${i},4`);
  CAMINHO.add(`3,${i}`);
}
for (const k of ["2,3", "1,3", "4,3", "5,2", "6,3", "7,3", "4,6", "5,5", "2,6", "6,4"]) CAMINHO.add(k);

export function MundoIso({
  periodo,
  mascote,
  garagem,
  plantas,
  selos,
  aoTocar,
}: {
  periodo: Periodo;
  mascote: { cor: CorMascote; fase: number; equipados: Partial<Record<Slot, string>>; nome: string } | null;
  garagem: boolean;
  plantas: number;
  /** avisos em cima dos lugares (ex.: missões pra resgatar) */
  selos: Partial<Record<LugarMundo, number>>;
  aoTocar: (l: LugarMundo) => void;
}) {
  const noite = periodo === "noite";
  const livres = useMemo(() => [...CAMINHO].map((k) => k.split(",").map(Number) as [number, number]), []);
  const [pos, setPos] = useState<[number, number]>([3, 4]);
  const posRef = useRef(pos);
  posRef.current = pos;
  useEffect(() => {
    const t = setInterval(() => {
      const [a, b] = posRef.current;
      const viz = ([[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]] as [number, number][]).filter((p) => CAMINHO.has(`${p[0]},${p[1]}`));
      if (viz.length && Math.random() < 0.75) setPos(viz[Math.floor(Math.random() * viz.length)]);
    }, 1900);
    return () => clearInterval(t);
  }, [livres]);

  const lugar = (l: LugarMundo, desenho: React.ReactNode, alturaRotulo: number) => {
    const [x, y, w, d] = LUGARES[l];
    const [rx, ry] = P(x + w / 2, y + d / 2, alturaRotulo);
    const selo = selos[l] ?? 0;
    return {
      chave: x + w + y + d,
      el: (
        <g key={l} onClick={() => aoTocar(l)} style={{ cursor: "pointer" }}>
          {desenho}
          <g pointerEvents="none">
            <rect x={rx - 24} y={ry - 9} width="48" height="11" rx="5.5" fill="#000" opacity="0.45" />
            <text x={rx} y={ry - 1.4} textAnchor="middle" fontSize="6.6" fontWeight="700" fill="#fff" fontFamily="sans-serif">
              {NOMES[l]}
            </text>
            {selo > 0 && (
              <g className="animate-quicar">
                <circle cx={rx + 24} cy={ry - 9} r="5.5" fill="#F59E0B" stroke="#fff" strokeWidth="1" />
                <text x={rx + 24} y={ry - 6.8} textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#1F2421" fontFamily="sans-serif">
                  {selo}
                </text>
              </g>
            )}
          </g>
        </g>
      ),
    };
  };

  const ents: { chave: number; el: React.ReactNode }[] = [];

  // casa
  ents.push(
    lugar(
      "casa",
      <g>
        {bloco(1.1, 1.1, 1.8, 1.8, 26, "#F1E6D2")}
        {telhado(1, 1, 2, 2, 26, 20, "#D9734E")}
        <polygon points={pts([P(1.75, 2.9, 0), P(2.25, 2.9, 0), P(2.25, 2.9, 14), P(1.75, 2.9, 14)])} fill="#9A6B47" />
        {[1.3, 2.45].map((u) => (
          <polygon key={u} points={pts([P(u, 2.9, 15), P(u + 0.3, 2.9, 15), P(u + 0.3, 2.9, 22), P(u, 2.9, 22)])} fill={noite ? "#FDE68A" : "#BFE3F5"} />
        ))}
        <polygon points={pts([P(2.9, 1.5, 15), P(2.9, 1.9, 15), P(2.9, 1.9, 22), P(2.9, 1.5, 22)])} fill={noite ? "#FDE68A" : "#BFE3F5"} />
      </g>,
      54
    )
  );
  // garagem
  ents.push(
    lugar(
      "garagem",
      garagem ? (
        <g>
          {bloco(4.1, 1.1, 1.8, 0.8, 20, "#CBD5E1")}
          {bloco(4, 1, 2, 1, 2, "#94A3B8", 20)}
          <polygon points={pts([P(4.4, 1.9, 0), P(5.6, 1.9, 0), P(5.6, 1.9, 14), P(4.4, 1.9, 14)])} fill="#64748B" />
          {[3, 6, 9, 12].map((z) => (
            <polyline key={z} points={pts([P(4.4, 1.9, z), P(5.6, 1.9, z)])} stroke="#94A3B8" strokeWidth="0.8" fill="none" />
          ))}
        </g>
      ) : (
        <g opacity="0.7">
          <polygon points={pts([P(4.1, 1.1), P(5.9, 1.1), P(5.9, 1.9), P(4.1, 1.9)])} fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="3 2" />
          {bloco(4.9, 1.45, 0.08, 0.08, 14, "#7A4E2E")}
          <polygon points={pts([P(4.65, 1.5, 10), P(5.35, 1.5, 10), P(5.35, 1.5, 17), P(4.65, 1.5, 17)])} fill="#F1E6D2" />
        </g>
      ),
      30
    )
  );
  // jardim pessoal
  ents.push(
    lugar(
      "jardim",
      <g>
        {[
          [6.1, 1.1],
          [7.1, 1.1],
          [6.1, 2.1],
          [7.1, 2.1],
        ].map(([x, y], i) => (
          <g key={i}>
            {bloco(x, y, 0.8, 0.8, 4, "#8B5A2B")}
            {i < Math.max(1, Math.min(4, plantas)) &&
              (() => {
                const [cx, cy] = P(x + 0.4, y + 0.4, 4);
                return (
                  <g>
                    <line x1={cx} y1={cy} x2={cx} y2={cy - 8} stroke="#3E8E41" strokeWidth="1.4" />
                    <circle cx={cx} cy={cy - 10} r="4.5" fill={["#4CAF50", "#F472B6", "#5CC27A", "#FBBF24"][i]} />
                  </g>
                );
              })()}
          </g>
        ))}
      </g>,
      26
    )
  );
  // lojinha
  ents.push(
    lugar(
      "lojinha",
      <g>
        {bloco(1.15, 5.2, 1.7, 0.6, 12, "#B07D52")}
        {[1.15, 2.75].map((u) => (
          <g key={u}>{bloco(u, 5.2, 0.1, 0.1, 26, "#7A4E2E")}</g>
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <polygon
            key={i}
            points={pts([P(1.05 + i * 0.3, 5.1, 30), P(1.35 + i * 0.3, 5.1, 30), P(1.35 + i * 0.3, 6.0, 24), P(1.05 + i * 0.3, 6.0, 24)])}
            fill={i % 2 ? "#FFFFFF" : "#EF4444"}
          />
        ))}
        {[1.4, 1.9, 2.4].map((u, i) => {
          const [cx, cy] = P(u, 5.5, 14);
          return (
            <text key={u} x={cx} y={cy} fontSize="7" textAnchor="middle">
              {["🎩", "🍎", "🕶️"][i]}
            </text>
          );
        })}
      </g>,
      38
    )
  );
  // mural de missões
  ents.push(
    lugar(
      "missoes",
      <g>
        {bloco(4.15, 5.4, 0.08, 0.08, 22, "#7A4E2E")}
        {bloco(4.77, 5.4, 0.08, 0.08, 22, "#7A4E2E")}
        <polygon points={pts([P(4.1, 5.45, 10), P(4.9, 5.45, 10), P(4.9, 5.45, 24), P(4.1, 5.45, 24)])} fill="#C9A27A" stroke="#7A4E2E" strokeWidth="0.8" />
        {[0, 1, 2].map((i) => (
          <polygon key={i} points={pts([P(4.2 + i * 0.22, 5.44, 13), P(4.38 + i * 0.22, 5.44, 13), P(4.38 + i * 0.22, 5.44, 21), P(4.2 + i * 0.22, 5.44, 21)])} fill={["#FEF3C7", "#DBEAFE", "#FCE7F3"][i]} />
        ))}
      </g>,
      34
    )
  );
  // pódio das conquistas
  ents.push(
    lugar(
      "conquistas",
      <g>
        {bloco(5.2, 6.2, 0.6, 0.6, 9, "#E7E5E4")}
        {(() => {
          const [cx, cy] = P(5.5, 6.5, 18);
          return (
            <g>
              <path d={`M${cx - 6} ${cy - 5} L${cx + 6} ${cy - 5} L${cx + 4} ${cy + 3} Q${cx} ${cy + 6} ${cx - 4} ${cy + 3} Z`} fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
              <rect x={cx - 1.5} y={cy + 4} width="3" height="4" fill="#D97706" />
              <circle cx={cx + 7} cy={cy - 7} r="1.3" fill="#FEF3C7" className="vtm-brilha" />
            </g>
          );
        })()}
      </g>,
      34
    )
  );
  // jardim da dupla
  ents.push(
    lugar(
      "juntos",
      <g>
        {bloco(6.1, 5.1, 1.8, 1.8, 4, "#8B5A2B")}
        <polygon points={pts([P(6.2, 5.2, 4), P(7.8, 5.2, 4), P(7.8, 6.8, 4), P(6.2, 6.8, 4)])} fill="#5B3A1E" />
        {(() => {
          const [cx, cy] = P(7, 6, 4);
          return (
            <g>
              <circle cx={cx - 5} cy={cy - 14} r="7" fill="#F472B6" />
              <circle cx={cx + 5} cy={cy - 14} r="7" fill="#F472B6" />
              <path d={`M${cx - 11.5} ${cy - 11} L${cx} ${cy + 1} L${cx + 11.5} ${cy - 11} Z`} fill="#F472B6" />
              <line x1={cx} y1={cy} x2={cx} y2={cy + 2} stroke="#3E8E41" strokeWidth="2" />
            </g>
          );
        })()}
      </g>,
      30
    )
  );
  // mascote
  if (mascote) {
    const [px, py] = P(pos[0] + 0.5, pos[1] + 0.5);
    ents.push({
      chave: pos[0] + pos[1] + 2.001,
      el: (
        <g key="mascote" style={{ transform: `translate(${px - 16}px, ${py - 28}px)`, transition: "transform 0.8s ease-in-out" }} pointerEvents="none">
          <Mascote cor={mascote.cor} fase={Math.max(1, mascote.fase)} humor="feliz" equipados={{ ...mascote.equipados, fundo: undefined, amigo: undefined }} tamanho={32} volume={false} />
        </g>
      ),
    });
  }
  ents.sort((a, b) => a.chave - b.chave);

  return (
    <svg viewBox={`0 0 ${LARG} ${ALT}`} className="w-full h-auto select-none" role="img" aria-label="Mapa do seu mundo">
      {/* água em volta */}
      <polygon points={pts([P(-1.5, -1.5), P(N + 1.5, -1.5), P(N + 1.5, N + 1.5), P(-1.5, N + 1.5)])} fill={noite ? "#1E3A8A" : "#60A5FA"} opacity="0.85" />
      <g className="vtm-onda" opacity="0.5">
        {[-0.8, N + 0.6].map((k) => (
          <g key={k}>
            <polyline points={pts([P(-1, k), P(N + 1, k)])} stroke="#BFDBFE" strokeWidth="1" strokeDasharray="6 8" fill="none" />
            <polyline points={pts([P(k, -1), P(k, N + 1)])} stroke="#BFDBFE" strokeWidth="1" strokeDasharray="6 8" fill="none" />
          </g>
        ))}
      </g>
      {/* ilha: areia + terra */}
      <polygon points={pts([P(-0.4, -0.4), P(N + 0.4, -0.4), P(N + 0.4, N + 0.4), P(-0.4, N + 0.4)])} fill="#F3D9A4" />
      <polygon points={pts([P(0, N), P(N, N), P(N, N, -10), P(0, N, -10)])} fill="#7A5236" />
      <polygon points={pts([P(N, 0), P(N, N), P(N, N, -10), P(N, 0, -10)])} fill="#5E3F29" />
      {Array.from({ length: N }, (_, i) =>
        Array.from({ length: N }, (_, j) => (
          <polygon
            key={`${i}-${j}`}
            points={pts([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)])}
            fill={CAMINHO.has(`${i},${j}`) ? ((i + j) % 2 ? "#D6CFC0" : "#CFC7B6") : (i + j) % 2 ? "#86C77A" : "#7BBE6F"}
            stroke={CAMINHO.has(`${i},${j}`) ? "#BFB6A3" : "#6FAE63"}
            strokeWidth="0.35"
          />
        ))
      )}
      {/* arvorezinhas de enfeite */}
      {[
        [0.5, 7.5],
        [8.4, 8.3],
        [8.5, 3.5],
        [0.4, 0.4],
        [2.4, 7.6],
      ].map(([x, y], i) => {
        const [cx, cy] = P(x, y);
        return (
          <g key={i}>
            <rect x={cx - 1.2} y={cy - 9} width="2.4" height="9" fill="#8B5A2B" />
            <circle cx={cx} cy={cy - 14} r="7" fill="#3F9D5A" />
            <circle cx={cx - 3} cy={cy - 17} r="3.5" fill="#5CC27A" />
          </g>
        );
      })}

      {ents.map((e) => e.el)}

      {(noite || periodo === "entardecer") && <rect width={LARG} height={ALT} fill={noite ? "#0B1026" : "#7C2D12"} opacity={noite ? 0.32 : 0.1} pointerEvents="none" />}
    </svg>
  );
}
