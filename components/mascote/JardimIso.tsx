"use client";

// Etapa 306 — o jardim da dupla em visão isométrica (mesmo estilo da casa):
// cada hábito compartilhado é um canteiro com a planta no estágio dela, os
// mascotes de vocês passeiam pelo caminho de pedrinhas e quem já fez o
// hábito hoje aparece com o regador. Frutos maduros aparecem na planta.
import { useEffect, useMemo, useRef, useState } from "react";
import { Mascote, type Periodo } from "@/components/mascote/Mascote";
import type { CorMascote, Humor, Slot } from "@/lib/mascote/mascote";

export type PlantaIso = {
  id: string;
  nome: string;
  /** 0 semente … 6 árvore */
  estagio: number;
  /** 2 viçosa, 1 murchando, 0 murcha */
  saude: 0 | 1 | 2;
  frutos: number;
  fruta: string;
  regada: boolean;
};

export type MascoteIso = {
  chave: string;
  nome: string;
  cor: CorMascote;
  fase: number;
  equipados: Partial<Record<Slot, string>>;
  regou: boolean;
  /** sem mascote ainda: aparece um ovinho */
  ovo?: boolean;
};

const MW = 16;
const MH = 8;

/** Onde vai cada canteiro, conforme quantas plantas tem. */
export function lugaresDasPlantas(n: number): { tam: number; lugares: [number, number][] } {
  if (n <= 1) return { tam: 4, lugares: [[1, 1]] };
  if (n === 2) return { tam: 5, lugares: [[1, 1], [3, 2]] };
  if (n <= 4) return { tam: 6, lugares: ([[1, 1], [4, 1], [1, 4], [4, 4]] as [number, number][]).slice(0, n) };
  return { tam: 7, lugares: ([[1, 1], [3, 1], [5, 1], [1, 4], [3, 4], [5, 4], [1, 6], [5, 6]] as [number, number][]).slice(0, Math.min(8, n)) };
}

function tom(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, "0")).join("")}`;
}

const FOLHA = ["#B89B4A", "#9DB54A", "#4CAF50"]; // murcha, murchando, viçosa (índice = saúde)

export function JardimIso({
  plantas,
  mascotes,
  periodo,
  aoTocarPlanta,
  className = "",
}: {
  plantas: PlantaIso[];
  mascotes: MascoteIso[];
  periodo: Periodo;
  aoTocarPlanta?: (id: string) => void;
  className?: string;
}) {
  const { tam, lugares } = lugaresDasPlantas(plantas.length);
  const OX = MW * tam + 12;
  const OY = 56;
  const LARG = MW * 2 * tam + 24;
  const ALT = OY + MH * 2 * tam + 22;
  const P = (gx: number, gy: number, z = 0): [number, number] => [OX + (gx - gy) * MW, OY + (gx + gy) * MH - z];
  const pts = (l: [number, number][]) => l.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");
  const Bloco = ({ x, y, w, d, h, z = 0, cor }: { x: number; y: number; w: number; d: number; h: number; z?: number; cor: string }) => (
    <g>
      <polygon points={pts([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)])} fill={tom(cor, -0.08)} />
      <polygon points={pts([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)])} fill={tom(cor, -0.24)} />
      <polygon points={pts([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)])} fill={tom(cor, 0.12)} />
    </g>
  );
  const noite = periodo === "noite";

  // caminho livre pros mascotes
  const ocupado = useMemo(() => new Set(lugares.slice(0, plantas.length).map(([x, y]) => `${x},${y}`)), [lugares, plantas.length]);
  const livres = useMemo(() => {
    const l: [number, number][] = [];
    for (let i = 0; i < tam; i++) for (let j = 0; j < tam; j++) if (!ocupado.has(`${i},${j}`)) l.push([i, j]);
    return l;
  }, [tam, ocupado]);

  // cada mascote começa ao lado de uma planta e passeia
  const [pos, setPos] = useState<[number, number][]>(() =>
    mascotes.map((_, k) => {
      const [px, py] = lugares[k % Math.max(1, lugares.length)] ?? [0, 0];
      const p: [number, number] = k % 2 ? [Math.min(tam - 1, px + 1), py] : [Math.max(0, px - 1), py];
      return ocupado.has(`${p[0]},${p[1]}`) ? livres[k % livres.length] : p;
    })
  );
  const posRef = useRef(pos);
  posRef.current = pos;
  useEffect(() => {
    if (!livres.length) return;
    const ok = new Set(livres.map(([a, b]) => `${a},${b}`));
    const t = setInterval(() => {
      setPos((atual) => {
        const usados = new Set(atual.map(([a, b]) => `${a},${b}`));
        return atual.map(([a, b], k) => {
          if (Math.random() < 0.45) return [a, b];
          const viz = ([[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]] as [number, number][]).filter((p) => ok.has(`${p[0]},${p[1]}`) && !usados.has(`${p[0]},${p[1]}`));
          if (!viz.length) return [a, b];
          const novo = viz[Math.floor(Math.random() * viz.length)];
          usados.add(`${novo[0]},${novo[1]}`);
          return novo;
        });
      });
    }, 2400 + Math.random() * 600);
    return () => clearInterval(t);
  }, [livres]);
  useEffect(() => {
    if (pos.length !== mascotes.length) setPos(mascotes.map((_, k) => livres[k % Math.max(1, livres.length)] ?? [0, 0]));
  }, [mascotes.length, pos.length, livres]);

  // ordem de desenho
  type Ent = { chave: number; el: React.ReactNode };
  const ents: Ent[] = [];
  plantas.forEach((pl, k) => {
    const [x, y] = lugares[k] ?? [0, 0];
    ents.push({
      chave: x + y + 2,
      el: (
        <g key={pl.id} onClick={aoTocarPlanta ? () => aoTocarPlanta(pl.id) : undefined} style={aoTocarPlanta ? { cursor: "pointer" } : undefined}>
          <Canteiro x={x} y={y} pl={pl} P={P} Bloco={Bloco} />
        </g>
      ),
    });
  });
  mascotes.forEach((m, k) => {
    const [mx, my] = pos[k] ?? [0, 0];
    const [px, py] = P(mx + 0.5, my + 0.5);
    const tm = tam <= 4 ? 46 : tam <= 6 ? 40 : 34; // jardim maior, bichinho menor
    ents.push({
      chave: mx + my + 2.001 + k * 0.0001,
      el: (
        <g key={m.chave} style={{ transform: `translate(${px - tm / 2}px, ${py - tm * 0.87}px)`, transition: "transform 0.9s ease-in-out" }}>
          <Mascote
            cor={m.cor}
            fase={m.ovo ? 0 : Math.max(1, m.fase)}
            humor={m.regou ? "feliz" : "neutro"}
            equipados={m.ovo ? {} : { ...m.equipados, mao: m.regou ? "regador" : m.equipados.mao, fundo: undefined, amigo: undefined }}
            tamanho={tm}
            volume={false}
          />
          <text x={tm / 2} y={tm + 3} textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#fff" stroke="#000" strokeOpacity="0.35" strokeWidth="1.6" paintOrder="stroke" fontFamily="sans-serif">
            {m.nome}
          </text>
        </g>
      ),
    });
  });
  ents.sort((a, b) => a.chave - b.chave);

  return (
    <svg viewBox={`0 0 ${LARG} ${ALT}`} className={`w-full h-auto select-none ${className}`} role="img" aria-label="Jardim de vocês">
      {/* laje de terra */}
      <polygon points={pts([P(0, tam), P(tam, tam), P(tam, tam, -10), P(0, tam, -10)])} fill="#7A5236" />
      <polygon points={pts([P(tam, 0), P(tam, tam), P(tam, tam, -10), P(tam, 0, -10)])} fill="#5E3F29" />
      {/* grama + caminho de pedrinhas */}
      {Array.from({ length: tam }, (_, i) =>
        Array.from({ length: tam }, (_, j) => {
          const caminho = (i + j) % 3 === 0 && !ocupado.has(`${i},${j}`);
          return (
            <g key={`${i}-${j}`}>
              <polygon points={pts([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)])} fill={(i + j) % 2 ? "#86C77A" : "#7BBE6F"} stroke="#6FAE63" strokeWidth="0.35" />
              {caminho && (
                <polygon points={pts([P(i + 0.28, j + 0.28), P(i + 0.72, j + 0.28), P(i + 0.72, j + 0.72), P(i + 0.28, j + 0.72)])} fill="#D6CFC0" opacity="0.85" />
              )}
            </g>
          );
        })
      )}
      {/* tufinhos e florzinhas soltas */}
      {Array.from({ length: tam }, (_, i) => {
        const [fx, fy] = P(((i * 7) % tam) + 0.3, ((i * 5 + 2) % tam) + 0.7);
        return ocupado.has(`${(i * 7) % tam},${(i * 5 + 2) % tam}`) ? null : (
          <g key={i}>
            <path d={`M${fx} ${fy} l-1.5 -4 M${fx} ${fy} l0 -5 M${fx} ${fy} l1.5 -4`} stroke="#4E9E5A" strokeWidth="0.9" />
            {i % 2 === 0 && <circle cx={fx + 3} cy={fy - 2} r="1.4" fill={["#F472B6", "#FBBF24", "#FFFFFF"][i % 3]} />}
          </g>
        );
      })}
      {/* cerquinha do fundo */}
      {Array.from({ length: tam + 1 }, (_, k) => (
        <g key={k}>
          {Bloco({ x: -0.1, y: k - 0.05, w: 0.1, d: 0.1, h: 14, cor: "#F1E6D2" })}
          {Bloco({ x: k - 0.05, y: -0.1, w: 0.1, d: 0.1, h: 14, cor: "#F1E6D2" })}
        </g>
      ))}
      <polygon points={pts([P(-0.05, 0, 9), P(-0.05, tam, 9), P(-0.05, tam, 11.5), P(-0.05, 0, 11.5)])} fill="#E7DCC8" />
      <polygon points={pts([P(0, -0.05, 9), P(tam, -0.05, 9), P(tam, -0.05, 11.5), P(0, -0.05, 11.5)])} fill="#F1E6D2" />

      {ents.map((e) => e.el)}

      {/* noite: escurece e aparecem vaga-lumes */}
      {(noite || periodo === "entardecer") && <rect width={LARG} height={ALT} fill={noite ? "#0B1026" : "#7C2D12"} opacity={noite ? 0.36 : 0.1} pointerEvents="none" />}
      {noite &&
        Array.from({ length: 6 }, (_, i) => {
          const [vx, vy] = P(((i * 3) % tam) + 0.5, ((i * 2 + 1) % tam) + 0.3, 14 + (i % 3) * 6);
          return <circle key={i} cx={vx} cy={vy} r="1.5" fill="#F7FF8A" className="vtm-brilha" style={{ animationDelay: `${i * 0.4}s` }} pointerEvents="none" />;
        })}
    </svg>
  );
}

/** Um canteiro com a planta do hábito (desenhada conforme o estágio). */
function Canteiro({
  x,
  y,
  pl,
  P,
  Bloco,
}: {
  x: number;
  y: number;
  pl: PlantaIso;
  P: (gx: number, gy: number, z?: number) => [number, number];
  Bloco: (p: { x: number; y: number; w: number; d: number; h: number; z?: number; cor: string }) => React.ReactNode;
}) {
  const folha = FOLHA[pl.saude];
  const caule = pl.saude === 0 ? "#8D7A45" : "#3E8E41";
  const [cx, cy] = P(x + 0.5, y + 0.5, 6);
  const murcha = 2 - pl.saude;
  const inclina = murcha * 8;
  const altura = [0, 8, 14, 22, 28, 32, 0][pl.estagio] ?? 0;
  const topo = cy - altura;
  const F = (dx: number, dy: number, lado: number, t: number) => (
    <ellipse cx={cx + dx} cy={dy} rx={t} ry={t * 0.45} fill={folha} transform={`rotate(${lado * (-30 + murcha * 30)} ${cx + dx} ${dy})`} />
  );
  return (
    <g>
      {/* canteiro de madeira com terra */}
      {Bloco({ x: x + 0.06, y: y + 0.06, w: 0.88, d: 0.88, h: 6, cor: "#9A6B47" })}
      <polygon points={[P(x + 0.14, y + 0.14, 6), P(x + 0.86, y + 0.14, 6), P(x + 0.86, y + 0.86, 6), P(x + 0.14, y + 0.86, 6)].map((p) => p.join(",")).join(" ")} fill="#5B3A1E" />

      {pl.estagio === 0 && (
        <g>
          <ellipse cx={cx} cy={cy - 1} rx="4" ry="2.4" fill="#A0673A" />
          <path d={`M${cx} ${cy - 3} q1.5 -3 3.5 -2.5`} stroke="#6DBE6B" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>
      )}
      {pl.estagio >= 1 && pl.estagio <= 5 && (
        <g transform={`rotate(${inclina} ${cx} ${cy})`}>
          <path d={`M${cx} ${cy} Q${cx + 1.5} ${cy - altura / 2} ${cx} ${topo}`} stroke={caule} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {F(-4, topo + 2, -1, pl.estagio === 1 ? 3.5 : 5)}
          {F(4, topo + 2, 1, pl.estagio === 1 ? 3.5 : 5)}
          {pl.estagio >= 3 && (
            <>
              {F(-5, topo + 11, -1, 6)}
              {F(5, topo + 10, 1, 6)}
            </>
          )}
          {pl.estagio >= 5 && (
            <>
              {F(-5.5, topo + 19, -1, 6.5)}
              {F(5.5, topo + 18, 1, 6.5)}
            </>
          )}
          {pl.estagio === 4 && <ellipse cx={cx} cy={topo - 3} rx="2.4" ry="3.4" fill={pl.saude === 0 ? "#B08A6A" : "#FF7FA0"} />}
          {pl.estagio === 5 &&
            [0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx={cx} cy={topo - 6.5} rx="2.4" ry="3.6" fill={pl.saude === 0 ? "#C9A38A" : "#FF7FA0"} transform={`rotate(${a} ${cx} ${topo - 3})`} />
            ))}
          {pl.estagio === 5 && <circle cx={cx} cy={topo - 3} r="2.3" fill="#FFD24D" />}
        </g>
      )}
      {pl.estagio >= 6 && (
        <g>
          <path d={`M${cx - 2} ${cy} L${cx - 1.5} ${cy - 20} L${cx + 1.5} ${cy - 20} L${cx + 2} ${cy} Z`} fill="#8B5A2B" />
          <circle cx={cx} cy={cy - 30} r="13" fill={folha} />
          <circle cx={cx - 8} cy={cy - 24} r="8.5" fill={tom(folha, -0.08)} />
          <circle cx={cx + 8} cy={cy - 25} r="8.5" fill={tom(folha, 0.06)} />
          <circle cx={cx - 3} cy={cy - 37} r="5" fill={tom(folha, 0.2)} opacity="0.7" />
        </g>
      )}

      {/* frutos maduros */}
      {pl.frutos > 0 &&
        Array.from({ length: Math.min(5, pl.frutos) }, (_, i) => {
          const pos = pl.estagio >= 6 ? [[-7, -28], [6, -32], [0, -22], [-10, -20], [9, -22]][i] : [[-6, -altura + 4], [6, -altura + 6], [0, -altura - 2], [-8, -altura + 12], [8, -altura + 12]][i];
          return (
            <text key={i} x={cx + pos[0]} y={cy + pos[1]} fontSize="7" textAnchor="middle" className="animate-quicar" style={{ animationDelay: `${i * 0.15}s` }}>
              {pl.fruta}
            </text>
          );
        })}

      {/* regada hoje: gotinhas */}
      {pl.regada && (
        <g fill="#7DD3FC">
          {[-4, 0, 4].map((dx, i) => (
            <ellipse key={dx} cx={cx + dx} cy={cy - altura - 12} rx="1" ry="1.6" className="vtm-gota" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
        </g>
      )}

      {/* plaquinha com o nome */}
      {pl.nome && (() => {
        const [sx, sy] = P(x + 0.95, y + 0.95, 0);
        return (
          <g>
            <line x1={sx} y1={sy} x2={sx} y2={sy - 9} stroke="#7A4E2E" strokeWidth="1.2" />
            <rect x={sx - 15} y={sy - 15} width="30" height="7.5" rx="1.5" fill="#F1E6D2" stroke="#9A6B47" strokeWidth="0.6" />
            <text x={sx} y={sy - 9.6} fontSize="4.6" textAnchor="middle" fill="#5B3A1E" fontWeight="700" fontFamily="sans-serif">
              {pl.nome.length > 12 ? `${pl.nome.slice(0, 11)}…` : pl.nome}
            </text>
          </g>
        );
      })()}
    </g>
  );
}
