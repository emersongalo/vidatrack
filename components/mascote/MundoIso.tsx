"use client";

// Etapa 310 — o mapa do "jogo dos hábitos": uma ilhazinha isométrica com a
// casa, a garagem, o seu jardim, o jardim da dupla, a lojinha, o mural de
// missões e o pódio das conquistas. O mascote passeia pelos caminhos e é
// só tocar num lugar pra entrar.
// Etapa 311 — ilha maior (12×12) com os monumentos das conquistas.
// Etapa 315 — feirinha, visitas dos mascotes da dupla, clima do humor,
// toque no mascote (ele fala) e de madrugada todo mundo dorme.
import { useEffect, useMemo, useRef, useState } from "react";
import { climaDoHumor, Mascote, type Periodo } from "@/components/mascote/Mascote";
import { fraseDoHumor, type CorMascote, type Humor, type Slot } from "@/lib/mascote/mascote";
import { useDormindo } from "@/lib/mascote/useDormindo";
import { MONUMENTOS_NA_ILHA, type EstadoMonumento } from "@/lib/mascote/ilha";
import { temaIlha, type TemaIlha } from "@/lib/mascote/temasIlha";

export type LugarMundo = "casa" | "garagem" | "jardim" | "juntos" | "lojinha" | "missoes" | "conquistas" | "feira" | "pesca";

export type VisitanteMundo = { chave: string; nome: string; cor: CorMascote; fase: number; equipados: Partial<Record<Slot, string>> };

const N = 12;
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
  feira: [8, 5, 1, 1],
  pesca: [11, 3, 1, 1],
};

const NOMES: Record<LugarMundo, string> = {
  casa: "Casa",
  garagem: "Garagem",
  jardim: "Seu jardim",
  juntos: "Juntos",
  lojinha: "Lojinha",
  missoes: "Missões",
  conquistas: "Conquistas",
  feira: "Feirinha",
  pesca: "Pescaria",
};

// caminhos de pedrinha
const CAMINHO = new Set<string>();
for (let i = 0; i < N; i++) {
  CAMINHO.add(`${i},4`);
  CAMINHO.add(`3,${i}`);
  CAMINHO.add(`9,${i}`);
  CAMINHO.add(`${i},9`);
}
for (const k of ["2,3", "1,3", "4,3", "5,2", "6,3", "7,3", "4,6", "5,5", "2,6", "6,4"]) CAMINHO.add(k);

// ---------- Etapa 329 — mundo mais vivo: detalhes do chão, natureza, água e céu ----------
const h01 = (a: number, b: number, k = 0) => {
  let x = (a * 374761393 + b * 668265263 + k * 1442695041) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
const ARVORES_FIXAS: [number, number][] = [
  [0.4, 0.4],
  [11.5, 2.4],
  [2.5, 11.5],
  [8.5, 10.5],
  [11.5, 8.5],
  [8.5, 2.6],
];
/** quadrinhos ocupados (lugares, monumentos, caminhos e árvores fixas) */
const OCUPADO = (() => {
  const o = new Set<string>(CAMINHO);
  const marca = ([x, y, w, d]: [number, number, number, number]) => {
    for (let i = x; i < x + w; i++) for (let j = y; j < y + d; j++) o.add(`${i},${j}`);
  };
  Object.values(MONUMENTOS_NA_ILHA).forEach(marca);
  for (const [x, y] of ARVORES_FIXAS) o.add(`${Math.floor(x)},${Math.floor(y)}`);
  return o;
})();
type TipoEnfeite = "arvore" | "pinheiro" | "arbusto" | "flores" | "pedra" | "cogumelos" | "moinho" | "lampiao" | "correio" | "varal" | "piquenique" | "poco" | "banco";
/** enfeites nos quadrinhos livres (sempre os mesmos lugares) */
function enfeitesDoMundo(lugares: Record<string, [number, number, number, number]>) {
  const o = new Set(OCUPADO);
  Object.values(lugares).forEach(([x, y, w, d]) => {
    for (let i = x - 0; i < x + w; i++) for (let j = y; j < y + d; j++) o.add(`${i},${j}`);
  });
  const lista: { x: number; y: number; tipo: TipoEnfeite; v: number }[] = [];
  // moinho no primeiro canto livre
  const moinho = ([[11, 4], [0, 5], [11, 9], [0, 1]] as [number, number][]).find(([x, y]) => !o.has(`${x},${y}`));
  if (moinho) {
    lista.push({ x: moinho[0] + 0.5, y: moinho[1] + 0.5, tipo: "moinho", v: 0 });
    o.add(`${moinho[0]},${moinho[1]}`);
  }
  // Etapa 331 — cantinhos da vida na ilha (cada um no primeiro lugar livre)
  const fixos: [TipoEnfeite, [number, number][]][] = [
    ["correio", [[0, 3], [0, 2], [3, 0], [0, 4]]],
    ["varal", [[2, 0], [1, 0], [0, 2], [7, 0]]],
    ["piquenique", [[10, 6], [10, 7], [7, 7], [1, 7], [0, 7]]],
    ["poco", [[5, 7], [10, 1], [7, 0], [0, 10]]],
    ["banco", [[10, 10], [5, 10], [1, 10], [7, 8]]],
  ];
  for (const [tipo, cands] of fixos) {
    const c = cands.find(([x, y]) => !o.has(`${x},${y}`));
    if (!c) continue;
    lista.push({ x: c[0] + 0.5, y: c[1] + 0.5, tipo, v: 0 });
    o.add(`${c[0]},${c[1]}`);
  }
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      if (o.has(`${i},${j}`)) continue;
      const r = h01(i, j, 7);
      if (r > 0.62) continue;
      const t = h01(i, j, 11);
      const tipo: TipoEnfeite = t < 0.28 ? "arvore" : t < 0.4 ? "pinheiro" : t < 0.62 ? "arbusto" : t < 0.8 ? "flores" : t < 0.9 ? "pedra" : "cogumelos";
      lista.push({ x: i + 0.25 + h01(i, j, 3) * 0.5, y: j + 0.25 + h01(i, j, 4) * 0.5, tipo, v: Math.floor(h01(i, j, 5) * 3) });
    }
  // lampiões na beira dos caminhos (acendem de noite)
  for (const [x, y] of [[2.85, 3.85], [9.9, 3.85], [2.85, 9.9], [9.9, 9.9], [6.0, 3.85], [2.85, 7.0]] as [number, number][])
    lista.push({ x, y, tipo: "lampiao", v: 0 });
  return lista;
}

/** relógio só dos pedacinhos animados (o resto do mapa não redesenha) */
function useRelogio(intervalo = 90) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    let ultimo = 0;
    const passo = (agora: number) => {
      if (agora - ultimo > intervalo) {
        ultimo = agora;
        setT(agora / 1000);
      }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [intervalo]);
  return t;
}

function Espuma() {
  const t = useRelogio(120);
  return <polygon points={pts([P(-0.75, -0.75), P(N + 0.75, -0.75), P(N + 0.75, N + 0.75), P(-0.75, N + 0.75)])} fill="none" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="5 4" strokeDashoffset={(t * 6) % 9} pointerEvents="none" />;
}

function ArvoreRica({ cx, cy, copa, tronco, v = 0, escala = 1 }: { cx: number; cy: number; copa: [string, string]; tronco: string; v?: number; escala?: number }) {
  const k = escala;
  return (
    <g>
      <ellipse cx={cx + 3 * k} cy={cy + 1} rx={10 * k} ry={3.6 * k} fill="#000" opacity="0.16" />
      <path d={`M${cx - 1.6 * k} ${cy} L${cx - 1.1 * k} ${cy - 11 * k} L${cx + 1.1 * k} ${cy - 11 * k} L${cx + 1.6 * k} ${cy} Z`} fill={tronco} />
      <path d={`M${cx + 0.2 * k} ${cy} L${cx + 0.5 * k} ${cy - 11 * k} L${cx + 1.1 * k} ${cy - 11 * k} L${cx + 1.6 * k} ${cy} Z`} fill={tom(tronco, -0.25)} />
      <circle cx={cx - 4 * k} cy={cy - 13 * k} r={5.5 * k} fill={tom(copa[0], -0.12)} />
      <circle cx={cx + 4 * k} cy={cy - 12.5 * k} r={5.8 * k} fill={tom(copa[0], -0.18)} />
      <circle cx={cx} cy={cy - 17 * k} r={7.2 * k} fill={copa[0]} />
      <circle cx={cx - 2.4 * k} cy={cy - 19.5 * k} r={3.8 * k} fill={copa[1]} />
      <circle cx={cx + 2.5 * k} cy={cy - 15 * k} r={2.2 * k} fill={tom(copa[1], 0.15)} opacity="0.7" />
      {v === 1 && [[-3, -14], [3, -18], [1, -11], [-5, -18]].map(([dx, dy], i) => <circle key={i} cx={cx + dx * k} cy={cy + dy * k} r={1.1 * k} fill="#E5484D" />)}
      {v === 2 && [[-3, -15], [3, -19], [2, -12], [-1, -21]].map(([dx, dy], i) => <circle key={i} cx={cx + dx * k} cy={cy + dy * k} r={0.9 * k} fill="#FFF1F7" />)}
    </g>
  );
}

function EnfeiteMundo({ e, tema, noite }: { e: { x: number; y: number; tipo: TipoEnfeite; v: number }; tema: TemaIlha; noite: boolean }) {
  const [cx, cy] = P(e.x, e.y);
  switch (e.tipo) {
    case "arvore":
      if (tema.id === "inverno" || tema.id === "deserto") return null;
      return <ArvoreRica cx={cx} cy={cy} copa={tema.copa} tronco={tema.tronco} v={e.v} escala={0.85 + e.v * 0.08} />;
    case "pinheiro": {
      const c = tema.id === "inverno" ? ["#1F6F4A", "#2E8B57"] : [tom(tema.copa[0], -0.25), tom(tema.copa[0], -0.1)];
      return (
        <g>
          <ellipse cx={cx + 2} cy={cy + 1} rx="7" ry="2.6" fill="#000" opacity="0.15" />
          <rect x={cx - 1} y={cy - 6} width="2" height="6" fill={tema.tronco} />
          <polygon points={`${cx - 7},${cy - 5} ${cx + 7},${cy - 5} ${cx},${cy - 17}`} fill={c[0]} />
          <polygon points={`${cx - 5.5},${cy - 11} ${cx + 5.5},${cy - 11} ${cx},${cy - 22}`} fill={c[1]} />
          <polygon points={`${cx},${cy - 22} ${cx + 5.5},${cy - 11} ${cx + 1},${cy - 11}`} fill="#000" opacity="0.12" />
          {tema.id === "inverno" && <polygon points={`${cx - 2.5},${cy - 18} ${cx + 2.5},${cy - 18} ${cx},${cy - 22}`} fill="#F8FAFC" />}
        </g>
      );
    }
    case "arbusto":
      return (
        <g>
          <ellipse cx={cx + 1.5} cy={cy + 0.5} rx="6" ry="2" fill="#000" opacity="0.14" />
          <circle cx={cx - 3} cy={cy - 3} r="3.4" fill={tom(tema.copa[0], -0.1)} />
          <circle cx={cx + 3} cy={cy - 3} r="3.2" fill={tom(tema.copa[0], -0.2)} />
          <circle cx={cx} cy={cy - 5} r="3.8" fill={tema.copa[1]} />
          {e.v > 0 && [[-2, -5], [2, -3], [0, -7]].map(([dx, dy], i) => <circle key={i} cx={cx + dx} cy={cy + dy} r="0.8" fill={e.v === 1 ? "#E5484D" : "#7C5CE0"} />)}
        </g>
      );
    case "flores":
      return (
        <g>
          {[[-4, -1], [0, -2.5], [3.5, -0.5], [-1.5, 1.2], [2, 1.5]].map(([dx, dy], i) => (
            <g key={i}>
              <line x1={cx + dx} y1={cy + dy} x2={cx + dx} y2={cy + dy - 2.6} stroke="#3E8E41" strokeWidth="0.6" />
              <circle cx={cx + dx} cy={cy + dy - 3} r="1.15" fill={["#F472B6", "#FBBF24", "#FFFFFF", "#A78BFA", "#F87171"][(i + e.v) % 5]} />
              <circle cx={cx + dx} cy={cy + dy - 3} r="0.4" fill="#FDE047" />
            </g>
          ))}
        </g>
      );
    case "pedra":
      return (
        <g>
          <ellipse cx={cx + 1} cy={cy + 0.6} rx="5" ry="1.8" fill="#000" opacity="0.15" />
          <path d={`M${cx - 4.5} ${cy} Q${cx - 4} ${cy - 5} ${cx} ${cy - 5.5} Q${cx + 4.5} ${cy - 5} ${cx + 4.5} ${cy} Z`} fill="#9CA3AF" />
          <path d={`M${cx - 3} ${cy - 3.2} Q${cx - 1} ${cy - 5} ${cx + 1.5} ${cy - 4.6}`} stroke="#D1D5DB" strokeWidth="1" fill="none" strokeLinecap="round" />
          <path d={`M${cx + 1} ${cy} Q${cx + 4} ${cy - 2} ${cx + 4.5} ${cy}`} fill="#6B7280" />
          <ellipse cx={cx - 2} cy={cy - 4.6} rx="1.6" ry="0.6" fill="#5FA84C" opacity="0.8" />
        </g>
      );
    case "cogumelos":
      return (
        <g>
          {[[-2, 0, 1], [2, 1, 0.8]].map(([dx, dy, k], i) => (
            <g key={i}>
              <rect x={cx + dx - 0.7 * k} y={cy + dy - 3 * k} width={1.4 * k} height={3 * k} fill="#FEF3C7" />
              <path d={`M${cx + dx - 2.6 * k} ${cy + dy - 2.6 * k} Q${cx + dx} ${cy + dy - 6.5 * k} ${cx + dx + 2.6 * k} ${cy + dy - 2.6 * k} Z`} fill="#DC2626" />
              <circle cx={cx + dx - 0.8 * k} cy={cy + dy - 4 * k} r={0.5 * k} fill="#fff" />
              <circle cx={cx + dx + 1 * k} cy={cy + dy - 3.4 * k} r={0.4 * k} fill="#fff" />
            </g>
          ))}
        </g>
      );
    case "lampiao":
      return (
        <g pointerEvents="none">
          {noite && <circle cx={cx} cy={cy - 15} r="16" fill="url(#vtm-luz-lampiao)" />}
          <ellipse cx={cx + 1} cy={cy + 0.5} rx="2.5" ry="1" fill="#000" opacity="0.2" />
          <rect x={cx - 0.7} y={cy - 14} width="1.4" height="14" fill="#374151" />
          <rect x={cx - 2.3} y={cy - 18.5} width="4.6" height="5" rx="1" fill={noite ? "#FDE68A" : "#E5E7EB"} stroke="#374151" strokeWidth="0.8" />
          <path d={`M${cx - 3} ${cy - 18.5} L${cx} ${cy - 21} L${cx + 3} ${cy - 18.5} Z`} fill="#374151" />
        </g>
      );
    case "moinho":
      return <Moinho cx={cx} cy={cy} noite={noite} />;
    case "correio":
      return (
        <g>
          <ellipse cx={cx + 1} cy={cy + 0.6} rx="3" ry="1.1" fill="#000" opacity="0.18" />
          <rect x={cx - 0.6} y={cy - 9} width="1.2" height="9" fill="#7C4A21" />
          <path d={`M${cx - 3.5} ${cy - 9} L${cx - 3.5} ${cy - 13} Q${cx - 3.5} ${cy - 15.5} ${cx} ${cy - 15.5} Q${cx + 3.5} ${cy - 15.5} ${cx + 3.5} ${cy - 13} L${cx + 3.5} ${cy - 9} Z`} fill="#2563EB" />
          <path d={`M${cx + 0.5} ${cy - 9} L${cx + 0.5} ${cy - 15.4} Q${cx + 3.5} ${cy - 15} ${cx + 3.5} ${cy - 13} L${cx + 3.5} ${cy - 9} Z`} fill="#000" opacity="0.15" />
          <rect x={cx + 3.2} y={cy - 16.5} width="0.8" height="4.5" fill="#374151" />
          <rect x={cx + 3.6} y={cy - 16.5} width="2.6" height="1.8" fill="#EF4444" />
          <rect x={cx - 2.2} y={cy - 12.2} width="3" height="1.6" rx="0.4" fill="#FFFFFF" opacity="0.9" />
        </g>
      );
    case "varal":
      return <Varal cx={cx} cy={cy} />;
    case "piquenique":
      return (
        <g>
          <polygon points={pts([P(e.x - 0.42, e.y - 0.35), P(e.x + 0.42, e.y - 0.35), P(e.x + 0.42, e.y + 0.35), P(e.x - 0.42, e.y + 0.35)])} fill="#FFFFFF" />
          {[0, 1, 2, 3].map((k) => (
            <polygon key={k} points={pts([P(e.x - 0.42 + k * 0.21, e.y - 0.35), P(e.x - 0.31 + k * 0.21, e.y - 0.35), P(e.x - 0.31 + k * 0.21, e.y + 0.35), P(e.x - 0.42 + k * 0.21, e.y + 0.35)])} fill="#EF4444" opacity="0.85" />
          ))}
          {[0, 1, 2].map((k) => (
            <polygon key={`h${k}`} points={pts([P(e.x - 0.42, e.y - 0.35 + k * 0.25), P(e.x + 0.42, e.y - 0.35 + k * 0.25), P(e.x + 0.42, e.y - 0.25 + k * 0.25), P(e.x - 0.42, e.y - 0.25 + k * 0.25)])} fill="#EF4444" opacity="0.45" />
          ))}
          {/* cestinha, maçã e suco */}
          <rect x={cx - 4} y={cy - 4.5} width="6" height="4" rx="1" fill="#B45309" />
          <path d={`M${cx - 3.5} ${cy - 4.5} Q${cx - 1} ${cy - 9} ${cx + 1.5} ${cy - 4.5}`} stroke="#92400E" strokeWidth="0.8" fill="none" />
          <path d={`M${cx - 4} ${cy - 3} h6`} stroke="#92400E" strokeWidth="0.5" />
          <circle cx={cx + 4.5} cy={cy - 1.2} r="1.4" fill="#DC2626" />
          <rect x={cx + 4.3} y={cy - 3.2} width="0.4" height="0.9" fill="#3F6212" />
          <rect x={cx - 7.5} y={cy - 2.8} width="1.8" height="3" rx="0.3" fill="#FDE68A" stroke="#F59E0B" strokeWidth="0.4" />
        </g>
      );
    case "poco":
      return (
        <g>
          <ellipse cx={cx + 2} cy={cy + 1} rx="7" ry="2.6" fill="#000" opacity="0.16" />
          <ellipse cx={cx} cy={cy - 1} rx="5.5" ry="2.6" fill="#78716C" />
          <rect x={cx - 5.5} y={cy - 6} width="11" height="5" fill="#A8A29E" />
          <path d={`M${cx - 5.5} ${cy - 4} h11 M${cx - 3} ${cy - 6} v2 M${cx + 2} ${cy - 6} v2 M${cx - 1} ${cy - 4} v3 M${cx + 4} ${cy - 4} v3`} stroke="#78716C" strokeWidth="0.5" />
          <ellipse cx={cx} cy={cy - 6} rx="5.5" ry="2.6" fill="#D6D3D1" />
          <ellipse cx={cx} cy={cy - 6} rx="4" ry="1.8" fill="#1E3A5F" />
          <rect x={cx - 5} y={cy - 16} width="1" height="10" fill="#7C4A21" />
          <rect x={cx + 4} y={cy - 16} width="1" height="10" fill="#7C4A21" />
          <path d={`M${cx - 7} ${cy - 15} L${cx} ${cy - 20} L${cx + 7} ${cy - 15} Z`} fill="#B91C1C" />
          <path d={`M${cx} ${cy - 20} L${cx + 7} ${cy - 15} L${cx + 2} ${cy - 15} Z`} fill="#000" opacity="0.18" />
          <line x1={cx} y1={cy - 15} x2={cx} y2={cy - 10} stroke="#57534E" strokeWidth="0.5" />
          <rect x={cx - 1.2} y={cy - 10} width="2.4" height="2" fill="#92400E" />
        </g>
      );
    case "banco":
      return (
        <g>
          <ellipse cx={cx + 1} cy={cy + 1} rx="7" ry="2" fill="#000" opacity="0.15" />
          <path d={`M${cx - 6} ${cy - 1} v-4 M${cx + 6} ${cy - 1} v-4 M${cx - 5} ${cy + 1} v-4 M${cx + 5} ${cy + 1} v-4`} stroke="#374151" strokeWidth="1" />
          <path d={`M${cx - 7} ${cy - 4} L${cx + 6} ${cy - 5.5} L${cx + 7} ${cy - 3.5} L${cx - 6} ${cy - 2} Z`} fill="#B45309" />
          <path d={`M${cx - 7} ${cy - 4} L${cx + 6} ${cy - 5.5} L${cx + 6} ${cy - 10} L${cx - 7} ${cy - 8.5} Z`} fill="#D97706" />
          <path d={`M${cx - 7} ${cy - 6.3} L${cx + 6} ${cy - 7.8}`} stroke="#92400E" strokeWidth="0.5" />
        </g>
      );
  }
}

/** varal com roupinhas balançando no vento */
function Varal({ cx, cy }: { cx: number; cy: number }) {
  const t = useRelogio(110);
  const cores = ["#F472B6", "#60A5FA", "#FBBF24", "#FFFFFF"];
  return (
    <g>
      <ellipse cx={cx} cy={cy + 0.5} rx="9" ry="2" fill="#000" opacity="0.12" />
      <rect x={cx - 9} y={cy - 15} width="1" height="15" fill="#7C4A21" />
      <rect x={cx + 8} y={cy - 15} width="1" height="15" fill="#7C4A21" />
      <path d={`M${cx - 8.5} ${cy - 14} Q${cx} ${cy - 11.5} ${cx + 8.5} ${cy - 14}`} stroke="#E5E7EB" strokeWidth="0.5" fill="none" />
      {cores.map((c, i) => {
        const x = cx - 6 + i * 4;
        const y = cy - 13.3 + Math.sin((i / 3) * Math.PI) * 1.1;
        const giro = Math.sin(t * 2.2 + i) * 8;
        return (
          <g key={i} transform={`rotate(${giro} ${x} ${y})`}>
            {i % 2 === 0 ? (
              <path d={`M${x - 1.6} ${y} h3.2 l0.6 1.2 h-0.8 v3.4 h-2.8 v-3.4 h-0.8 Z`} fill={c} stroke="#000" strokeOpacity="0.12" strokeWidth="0.3" />
            ) : (
              <path d={`M${x - 1.4} ${y} h2.8 v4.2 h-1.1 v-2 h-0.6 v2 h-1.1 Z`} fill={c} stroke="#000" strokeOpacity="0.12" strokeWidth="0.3" />
            )}
            <rect x={x - 0.3} y={y - 0.6} width="0.6" height="1" fill="#92400E" />
          </g>
        );
      })}
    </g>
  );
}

/** Etapa 331 — farol na pedra do mar (a luz gira de noite) */
const POS_FAROL: [number, number] = [1.7, -1.05];
function Farol({ noite }: { noite: boolean }) {
  const [x, y] = P(POS_FAROL[0], POS_FAROL[1]);
  return (
    <g pointerEvents="none">
      <ellipse cx={x} cy={y + 1} rx="9" ry="3" fill="#fff" opacity="0.35" />
      <path d={`M${x - 8} ${y + 1} Q${x - 7} ${y - 5} ${x} ${y - 5} Q${x + 7} ${y - 5} ${x + 8} ${y + 1} Z`} fill="#6B7280" />
      <path d={`M${x - 4} ${y - 3} L${x - 3} ${y - 28} L${x + 3} ${y - 28} L${x + 4} ${y - 3} Z`} fill="#F8FAFC" />
      {[-9, -19].map((dy) => (
        <path key={dy} d={`M${x - 3.8 + (-dy - 3) * 0.04} ${y + dy} L${x + 3.8 - (-dy - 3) * 0.04} ${y + dy} L${x + 3.6 - (-dy - 3) * 0.04} ${y + dy - 4} L${x - 3.6 + (-dy - 3) * 0.04} ${y + dy - 4} Z`} fill="#DC2626" />
      ))}
      <path d={`M${x + 0.5} ${y - 3} L${x + 1} ${y - 28} L${x + 3} ${y - 28} L${x + 4} ${y - 3} Z`} fill="#000" opacity="0.12" />
      <rect x={x - 1} y={y - 7.5} width="2" height="4.5" rx="1" fill="#7C4A21" />
      <rect x={x - 4.2} y={y - 29} width="8.4" height="1.5" fill="#374151" />
      <rect x={x - 2.6} y={y - 33.5} width="5.2" height="4.5" fill={noite ? "#FDE68A" : "#BAE6FD"} stroke="#374151" strokeWidth="0.6" />
      <path d={`M${x - 3.4} ${y - 33.5} L${x} ${y - 37} L${x + 3.4} ${y - 33.5} Z`} fill="#DC2626" />
      {noite && <circle cx={x} cy={y - 31} r="7" fill="#FDE68A" opacity="0.45" />}
    </g>
  );
}
/** o facho do farol (desenhado por cima da noite, pra brilhar) */
function FachoFarol() {
  const t = useRelogio(60);
  const [x, y] = P(POS_FAROL[0], POS_FAROL[1]);
  const a = (t * 50) % 360;
  const cx = x;
  const cy = y - 31;
  const alcance = Math.abs(Math.cos((a * Math.PI) / 180));
  const dir = Math.sin((a * Math.PI) / 180) >= 0 ? 1 : -1;
  const comp = 30 + alcance * 90;
  return (
    <g pointerEvents="none" style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id="vtm-facho" x1={dir > 0 ? "0" : "1"} x2={dir > 0 ? "1" : "0"} y1="0" y2="0">
          <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M${cx} ${cy} L${cx + dir * comp} ${cy - 10 - alcance * 6} L${cx + dir * comp} ${cy + 10 + alcance * 6} Z`} fill="url(#vtm-facho)" opacity={0.25 + alcance * 0.6} />
      <circle cx={cx} cy={cy} r="3.5" fill="#FFFBEB" />
    </g>
  );
}

/** Etapa 331 — patinhos nadando, baleia que solta água e balão no céu */
function BichosDoMar() {
  const t = useRelogio(90);
  // patinhos: vão e voltam na beira de baixo
  const ida = (t * 0.05) % 2;
  const f = ida < 1 ? ida : 2 - ida;
  const virar = ida < 1 ? 1 : -1;
  // baleia: aparece de tempos em tempos
  const ciclo = (t * 0.09) % 1;
  const [wx, wy] = P(N + 1.05, 2.2);
  const visivel = ciclo < 0.45;
  const sobe = visivel ? Math.sin((ciclo / 0.45) * Math.PI) : 0;
  return (
    <g pointerEvents="none">
      {[0, 1, 2].map((i) => {
        const [x, y] = P(6.2 + f * 3.6 - i * 0.55 * virar, N + 0.95);
        const b = Math.sin(t * 3 + i) * 0.6;
        const k = i === 0 ? 1 : 0.75;
        return (
          <g key={i} transform={`translate(${x} ${y + b}) scale(${-virar * k} ${k})`}>
            <path d="M-9 1.5 q3 -1.5 6 0" stroke="#fff" strokeWidth="0.6" fill="none" opacity="0.6" />
            <ellipse cx="0" cy="0" rx="4" ry="2.2" fill={i === 0 ? "#FFFFFF" : "#FDE68A"} />
            <path d="M2.5 -1 q2 -0.5 2.2 -2.2" fill="none" />
            <circle cx="-2.6" cy="-2.6" r="1.7" fill={i === 0 ? "#FFFFFF" : "#FDE68A"} />
            <path d="M-4.2 -2.6 l-1.6 0.5 l1.6 0.4 Z" fill="#F97316" />
            <circle cx="-3" cy="-3" r="0.35" fill="#111" />
            <path d="M3.6 -0.8 l1.6 -1.6 l0 2 Z" fill={i === 0 ? "#E5E7EB" : "#FBBF24"} />
          </g>
        );
      })}
      {visivel && (
        <g>
          <ellipse cx={wx} cy={wy + 1} rx={9} ry={2.4} fill="#fff" opacity={0.3 * sobe} />
          <path d={`M${wx - 8} ${wy + 1} Q${wx - 6} ${wy - 5 * sobe} ${wx} ${wy - 5.5 * sobe} Q${wx + 6} ${wy - 5 * sobe} ${wx + 8} ${wy + 1} Z`} fill="#334E68" />
          <path d={`M${wx - 6} ${wy} Q${wx - 3} ${wy - 3.5 * sobe} ${wx + 1} ${wy - 4 * sobe}`} stroke="#5B7A99" strokeWidth="1" fill="none" />
          {sobe > 0.6 && (
            <g opacity={(sobe - 0.6) * 2.5}>
              {[-3, -1, 1, 3].map((dx, i) => (
                <path key={i} d={`M${wx - 1} ${wy - 5.5} q${dx} -6 ${dx * 2.2} -${8 + Math.abs(dx)}`} stroke="#E0F2FE" strokeWidth="1" fill="none" strokeLinecap="round" />
              ))}
            </g>
          )}
        </g>
      )}
    </g>
  );
}

function Balao({ noite }: { noite: boolean }) {
  const t = useRelogio(100);
  const f = (t * 0.012) % 1;
  const x = LARG + 30 - f * (LARG + 60);
  const y = 26 + Math.sin(t * 0.7) * 4;
  const cores = ["#EF4444", "#FBBF24", "#3B82F6", "#FBBF24", "#EF4444"];
  return (
    <g pointerEvents="none" transform={`translate(${x} ${y})`}>
      {cores.map((c, i) => (
        <path key={i} d={`M0 -14 C${-10 + i * 5} -14 ${-10 + i * 5} 0 ${-2.5 + i * 1.25} 6 L${-1.5 + i * 0.75} 6 C${-6 + i * 3} 0 ${-6 + i * 3} -14 0 -14 Z`} fill={c} opacity={noite ? 0.75 : 1} />
      ))}
      <ellipse cx="0" cy="-5" rx="9.6" ry="10.5" fill="none" stroke="#000" strokeOpacity="0.15" strokeWidth="0.6" />
      <ellipse cx="-3.5" cy="-9" rx="2" ry="3.5" fill="#fff" opacity="0.35" />
      <path d="M-2.5 6 L-2 10 M2.5 6 L2 10" stroke="#78350F" strokeWidth="0.5" />
      <rect x="-2.6" y="10" width="5.2" height="3.6" rx="0.6" fill="#92400E" />
      {noite && <circle cx="0" cy="7" r="3" fill="#FDBA74" opacity="0.8" />}
    </g>
  );
}

function Moinho({ cx, cy, noite }: { cx: number; cy: number; noite: boolean }) {
  const t = useRelogio(70);
  const ang = (t * 40) % 360;
  return (
        <g>
          <ellipse cx={cx + 3} cy={cy + 1} rx="9" ry="3" fill="#000" opacity="0.16" />
          <path d={`M${cx - 6} ${cy} L${cx - 3.5} ${cy - 24} L${cx + 3.5} ${cy - 24} L${cx + 6} ${cy} Z`} fill="#F5E6CC" />
          <path d={`M${cx} ${cy} L${cx + 0.5} ${cy - 24} L${cx + 3.5} ${cy - 24} L${cx + 6} ${cy} Z`} fill="#000" opacity="0.1" />
          <path d={`M${cx - 4.5} ${cy - 24} L${cx} ${cy - 30} L${cx + 4.5} ${cy - 24} Z`} fill="#B45309" />
          <rect x={cx - 1.6} y={cy - 7} width="3.2" height="7" rx="1.6" fill="#7C4A21" />
          <rect x={cx - 1.2} y={cy - 17} width="2.4" height="2.4" fill={noite ? "#FDE68A" : "#93C5FD"} />
          <g transform={`rotate(${ang} ${cx} ${cy - 25})`}>
            {[0, 90, 180, 270].map((a) => (
              <g key={a} transform={`rotate(${a} ${cx} ${cy - 25})`}>
                <rect x={cx - 0.6} y={cy - 39} width="1.2" height="14" fill="#7C4A21" />
                <rect x={cx + 0.6} y={cy - 38} width="4" height="11" fill="#FFFBEB" stroke="#D6C7A8" strokeWidth="0.5" />
              </g>
            ))}
            <circle cx={cx} cy={cy - 25} r="1.6" fill="#374151" />
          </g>
        </g>
      );
}

/** mar vivo: brilhos, pedras com espuma, barquinho e peixe pulando */
function MarVivo({ noite }: { noite: boolean }) {
  const t = useRelogio(90);
  const brilhos: [number, number][] = [];
  for (let k = 0; k < 18; k++) {
    const lado = k % 4;
    const u = -1 + h01(k, 1, 9) * (N + 2);
    const off = -0.8 - h01(k, 2, 9) * 0.6;
    const [gx, gy] = lado === 0 ? [u, off] : lado === 1 ? [off, u] : lado === 2 ? [N - off, u] : [u, N - off];
    brilhos.push(P(gx, gy));
  }
  const barcoX = ((t * 0.08) % 1) * (N + 3) - 1.5;
  const [bx, by] = P(-1.0, barcoX);
  const balanco = Math.sin(t * 1.6) * 3;
  const pulo = (t * 0.35) % 1;
  const [px, py] = P(N + 0.9, 6.5);
  return (
    <g pointerEvents="none">
      {brilhos.map(([x, y], i) => (
        <path key={i} d={`M${x - 3} ${y} h6`} stroke="#fff" strokeWidth="0.9" strokeLinecap="round" opacity={0.25 + 0.6 * Math.abs(Math.sin(t * 1.3 + i))} />
      ))}
      {[[-1.1, 2.5], [N + 0.8, 10], [4, N + 0.9]].map(([gx, gy], i) => {
        const [x, y] = P(gx, gy);
        return (
          <g key={i}>
            <ellipse cx={x} cy={y + 1} rx="6.5" ry="2" fill="#fff" opacity={0.35 + 0.25 * Math.sin(t * 2 + i)} />
            <path d={`M${x - 5} ${y} Q${x - 3} ${y - 6} ${x + 1} ${y - 6} Q${x + 5} ${y - 4} ${x + 5} ${y} Z`} fill="#6B7280" />
            <path d={`M${x - 3} ${y - 3} Q${x - 1} ${y - 5.5} ${x + 2} ${y - 5}`} stroke="#9CA3AF" strokeWidth="1" fill="none" />
          </g>
        );
      })}
      {/* barquinho a vela */}
      <g transform={`rotate(${balanco} ${bx} ${by})`}>
        <path d={`M${bx - 9} ${by - 3} L${bx + 9} ${by - 3} L${bx + 6} ${by + 2} L${bx - 6} ${by + 2} Z`} fill="#92400E" />
        <path d={`M${bx - 9} ${by - 3} L${bx + 9} ${by - 3}`} stroke="#B45309" strokeWidth="1" />
        <rect x={bx - 0.5} y={by - 22} width="1" height="19" fill="#78350F" />
        <path d={`M${bx + 0.5} ${by - 21} L${bx + 9} ${by - 6} L${bx + 0.5} ${by - 6} Z`} fill={noite ? "#CBD5E1" : "#FFFFFF"} />
        <path d={`M${bx - 0.5} ${by - 17} L${bx - 7} ${by - 6} L${bx - 0.5} ${by - 6} Z`} fill={noite ? "#94A3B8" : "#FDE68A"} />
        <path d={`M${bx + 0.5} ${by - 22} l4 1.2 l-4 1.2 Z`} fill="#EF4444" />
      </g>
      <path d={`M${bx - 12} ${by + 3} q4 -2 8 0 M${bx + 4} ${by + 3} q4 -2 8 0`} stroke="#fff" strokeWidth="0.8" fill="none" opacity="0.6" />
      {/* peixinho pulando */}
      {pulo < 0.35 && (
        <g transform={`translate(${px + pulo * 40} ${py - Math.sin((pulo / 0.35) * Math.PI) * 14}) rotate(${-40 + (pulo / 0.35) * 80})`}>
          <ellipse cx="0" cy="0" rx="3.4" ry="1.6" fill="#F59E0B" />
          <path d="M3 0 l3 -2 l0 4 Z" fill="#F59E0B" />
          <circle cx="-1.8" cy="-0.4" r="0.4" fill="#111" />
        </g>
      )}
      {pulo >= 0.33 && pulo < 0.45 && <ellipse cx={px + 14} cy={py} rx={(pulo - 0.33) * 60} ry={(pulo - 0.33) * 18} fill="none" stroke="#fff" strokeWidth="0.8" opacity={1 - (pulo - 0.33) * 8} />}
    </g>
  );
}

/** passarinhos de dia, vaga-lumes de noite, fumaça da chaminé */
function CeuVivo({ noite, chamine }: { noite: boolean; chamine: [number, number] }) {
  const t = useRelogio(90);
  if (noite)
    return (
      <g pointerEvents="none">
        {Array.from({ length: 14 }, (_, i) => {
          const [x, y] = P(1 + h01(i, 1, 21) * 10, 1 + h01(i, 2, 21) * 10);
          const brilho = Math.max(0, Math.sin(t * 1.7 + i * 1.3));
          return <circle key={i} cx={x + Math.sin(t * 0.6 + i) * 5} cy={y - 10 + Math.cos(t * 0.5 + i) * 4} r="1.2" fill="#FDE68A" opacity={brilho} />;
        })}
      </g>
    );
  const voo = (t * 0.045) % 1;
  return (
    <g pointerEvents="none">
      {[0, 1, 2].map((i) => {
        const x = -30 + voo * (LARG + 60) + i * 14;
        const y = 22 + i * 7 + Math.sin(t * 2 + i) * 2;
        const asa = Math.sin(t * 9 + i) * 2.5;
        return <path key={i} d={`M${x - 4} ${y - asa} Q${x - 2} ${y - 1} ${x} ${y} Q${x + 2} ${y - 1} ${x + 4} ${y - asa}`} stroke="#334155" strokeWidth="1.1" fill="none" strokeLinecap="round" />;
      })}
      {[0, 1, 2].map((i) => {
        const f = (t * 0.25 + i / 3) % 1;
        return <circle key={i} cx={chamine[0] + f * 6} cy={chamine[1] - f * 18} r={1.6 + f * 3} fill="#E5E7EB" opacity={0.7 * (1 - f)} />;
      })}
    </g>
  );
}

export function MundoIso({
  periodo,
  mascote,
  garagem,
  plantas,
  selos,
  aoTocar,
  monumentos = {},
  tema = temaIlha(null),
  humor = "feliz",
  visitantes = [],
  evento = null,
}: {
  periodo: Periodo;
  mascote: { cor: CorMascote; fase: number; equipados: Partial<Record<Slot, string>>; nome: string } | null;
  garagem: boolean;
  plantas: number;
  /** avisos em cima dos lugares (ex.: missões pra resgatar) */
  selos: Partial<Record<LugarMundo, number>>;
  aoTocar: (l: LugarMundo) => void;
  /** Etapa 311 — estado de cada monumento (id da conquista) */
  monumentos?: Record<string, EstadoMonumento>;
  /** Etapa 312 — cores e clima da ilha */
  tema?: TemaIlha;
  /** Etapa 315 — humor do dia (fala e clima) e quem está visitando */
  humor?: Humor;
  visitantes?: VisitanteMundo[];
  /** Etapa 316 — decoração do evento da estação */
  evento?: "halloween" | "natal" | null;
}) {
  const noite = periodo === "noite";
  const dormindo = useDormindo();
  const clima = climaDoHumor(humor);
  const enfeites = useMemo(() => enfeitesDoMundo(LUGARES), []);
  const [pulo, setPulo] = useState(0);
  const [fala, setFala] = useState<string | null>(null);
  const falaT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tocarMascote = () => {
    setPulo((p) => p + 1);
    setFala(fraseDoHumor(dormindo ? "dormindo" : humor, Date.now()));
    if (falaT.current) clearTimeout(falaT.current);
    falaT.current = setTimeout(() => setFala(null), 3200);
  };
  // visitas: cada uma anda pelo caminho também
  const chaveVisitas = visitantes.map((v) => v.chave).join("|");
  const [posVis, setPosVis] = useState<Record<string, [number, number]>>({});
  useEffect(() => {
    if (!visitantes.length || dormindo) return;
    const inicio: [number, number][] = [[9, 6], [6, 9], [9, 2], [1, 9], [9, 10]];
    setPosVis((a) => Object.fromEntries(visitantes.map((v, k) => [v.chave, a[v.chave] ?? inicio[k % inicio.length]])));
    const t = setInterval(() => {
      setPosVis((a) => {
        const r = { ...a };
        for (const [k, [x, y]] of Object.entries(a)) {
          if (Math.random() < 0.35) continue;
          const viz = ([[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as [number, number][]).filter((p) => CAMINHO.has(`${p[0]},${p[1]}`));
          if (viz.length) r[k] = viz[Math.floor(Math.random() * viz.length)];
        }
        return r;
      });
    }, 2300);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveVisitas, dormindo]);
  const livres = useMemo(() => [...CAMINHO].map((k) => k.split(",").map(Number) as [number, number]), []);
  const [pos, setPos] = useState<[number, number]>([3, 4]);
  const posRef = useRef(pos);
  posRef.current = pos;
  useEffect(() => {
    if (dormindo) return;
    const t = setInterval(() => {
      const [a, b] = posRef.current;
      const viz = ([[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]] as [number, number][]).filter((p) => CAMINHO.has(`${p[0]},${p[1]}`));
      if (viz.length && Math.random() < 0.75) setPos(viz[Math.floor(Math.random() * viz.length)]);
    }, 1900);
    return () => clearInterval(t);
  }, [livres, dormindo]);

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
            <rect x={rx - 27} y={ry - 10.5} width="54" height="13" rx="6.5" fill="#000" opacity="0.45" />
            <text x={rx} y={ry - 1.2} textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" fontFamily="sans-serif">
              {NOMES[l]}
            </text>
            {selo > 0 && (
              <g className="animate-quicar">
                <circle cx={rx + 27} cy={ry - 10} r="6.5" fill="#F59E0B" stroke="#fff" strokeWidth="1" />
                <text x={rx + 27} y={ry - 7.4} textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#1F2421" fontFamily="sans-serif">
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
        {/* Etapa 329 — chaminé */}
        {bloco(2.25, 1.35, 0.22, 0.22, 12, "#9A6B47", 32)}
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
      46
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
  // Etapa 315 — feirinha (carrinho com toldo)
  ents.push(
    lugar(
      "feira",
      <g>
        {bloco(8.15, 5.3, 0.7, 0.45, 10, "#C0874F", 3)}
        {(() => {
          const [r1x, r1y] = P(8.25, 5.75, 3);
          const [r2x, r2y] = P(8.75, 5.75, 3);
          return (
            <g>
              <circle cx={r1x} cy={r1y} r="3" fill="#374151" />
              <circle cx={r2x} cy={r2y} r="3" fill="#374151" />
            </g>
          );
        })()}
        {bloco(8.17, 5.32, 0.05, 0.05, 14, "#7A4E2E", 13)}
        {bloco(8.78, 5.32, 0.05, 0.05, 14, "#7A4E2E", 13)}
        {Array.from({ length: 4 }, (_, i) => (
          <polygon
            key={i}
            points={pts([P(8.1 + i * 0.2, 5.25, 29), P(8.3 + i * 0.2, 5.25, 29), P(8.3 + i * 0.2, 5.85, 25), P(8.1 + i * 0.2, 5.85, 25)])}
            fill={i % 2 ? "#FFFFFF" : "#8B5CF6"}
          />
        ))}
        {(() => {
          const [cx, cy] = P(8.5, 5.5, 15);
          return (
            <text x={cx} y={cy} fontSize="7" textAnchor="middle">
              🎁🧢
            </text>
          );
        })()}
      </g>,
      50
    )
  );
  // Etapa 316 — píer da pescaria
  ents.push(
    lugar(
      "pesca",
      <g>
        {[11.15, 11.75, 12.35].map((x) => (
          <g key={x}>
            {bloco(x, 3.25, 0.08, 0.08, 12, "#5B3A1E", -8)}
            {bloco(x, 3.67, 0.08, 0.08, 12, "#5B3A1E", -8)}
          </g>
        ))}
        {bloco(11.05, 3.2, 1.55, 0.6, 2, "#B98B5E", 3)}
        {Array.from({ length: 6 }, (_, i) => (
          <polyline key={i} points={pts([P(11.05 + i * 0.26, 3.2, 5), P(11.05 + i * 0.26, 3.8, 5)])} stroke="#8B5E3C" strokeWidth="0.5" fill="none" />
        ))}
        {bloco(11.2, 3.3, 0.3, 0.25, 5, "#3B82F6", 5)}
        {(() => {
          const [ax, ay] = P(12.4, 3.5, 6);
          const [bx, by] = P(13.1, 3.5, 0);
          return (
            <g>
              <line x1={ax} y1={ay} x2={ax + 10} y2={ay - 22} stroke="#7A4E2E" strokeWidth="1.4" />
              <path d={`M${ax + 10} ${ay - 22} Q${bx + 4} ${by - 20} ${bx} ${by - 2}`} stroke="#E5E7EB" strokeWidth="0.5" fill="none" />
              <g className="vtm-onda">
                <circle cx={bx} cy={by} r="2.2" fill="#EF4444" />
                <circle cx={bx} cy={by - 1} r="1.1" fill="#FFFFFF" />
              </g>
            </g>
          );
        })()}
      </g>,
      30
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
  // Etapa 311 — monumentos das conquistas
  const corEstatua = mascote?.cor ?? "verde";
  for (const [id, [x, y, w, d]] of Object.entries(MONUMENTOS_NA_ILHA)) {
    const estado = monumentos[id] ?? "travado";
    const naAgua = x >= N || y >= N;
    ents.push({
      chave: x + w + y + d - 0.5,
      el: (
        <g key={`mon-${id}`} onClick={() => aoTocar("conquistas")} style={{ cursor: "pointer" }}>
          {estado === "feito" ? (
            desenharMonumento(id, x, y, noite, corEstatua)
          ) : naAgua ? null : (
            <g>
              <polygon
                points={pts([P(x + 0.12, y + 0.12), P(x + w - 0.12, y + 0.12), P(x + w - 0.12, y + d - 0.12), P(x + 0.12, y + d - 0.12)])}
                fill={estado === "pronto" ? "#FDE68A" : "none"}
                fillOpacity={0.35}
                stroke="#fff"
                strokeOpacity={estado === "pronto" ? 0.9 : 0.4}
                strokeWidth="0.8"
                strokeDasharray="2.5 2"
              />
              {estado === "pronto" &&
                (() => {
                  const [cx, cy] = P(x + w / 2, y + d / 2);
                  return (
                    <text x={cx} y={cy - 4} fontSize="12" textAnchor="middle" className="animate-quicar">
                      🎁
                    </text>
                  );
                })()}
            </g>
          )}
        </g>
      ),
    });
  }

  // mascote
  if (mascote) {
    // de madrugada ele dorme na porta de casa
    const p0: [number, number] = dormindo ? [2, 3] : pos;
    const [px, py] = P(p0[0] + 0.5, p0[1] + 0.5);
    ents.push({
      chave: p0[0] + p0[1] + 2.001,
      el: (
        <g
          key="mascote"
          style={{ transform: `translate(${px - 16}px, ${py - 28}px)`, transition: "transform 0.8s ease-in-out", cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            tocarMascote();
          }}
        >
          <g key={pulo} className={pulo ? "vtm-pulo" : ""}>
            <Mascote
              cor={mascote.cor}
              fase={Math.max(1, mascote.fase)}
              humor={dormindo ? "dormindo" : humor === "dormindo" ? "feliz" : humor}
              equipados={{ ...mascote.equipados, fundo: undefined, amigo: undefined }}
              tamanho={32}
              volume={false}
            />
          </g>
          {fala && (
            <g pointerEvents="none">
              <rect x={-30} y={-22} width={92} height={18} rx={9} fill="#0B1026" opacity="0.82" />
              <text x={16} y={-10} textAnchor="middle" fontSize="6.4" fill="#fff" fontFamily="sans-serif">
                {fala.length > 30 ? fala.slice(0, 29) + "…" : fala}
              </text>
            </g>
          )}
        </g>
      ),
    });
  }
  // Etapa 315 — mascotes da dupla/família visitando (de madrugada foram pra casa)
  if (!dormindo)
    visitantes.forEach((v, k) => {
      const p0 = posVis[v.chave];
      if (!p0) return;
      const [px, py] = P(p0[0] + 0.5, p0[1] + 0.5);
      ents.push({
        chave: p0[0] + p0[1] + 2.0005 + k * 0.0001,
        el: (
          <g key={`vis-${v.chave}`} style={{ transform: `translate(${px - 14}px, ${py - 25}px)`, transition: "transform 0.9s ease-in-out" }} pointerEvents="none">
            <Mascote cor={v.cor} fase={Math.max(1, v.fase)} humor="feliz" equipados={{ ...v.equipados, fundo: undefined, amigo: undefined }} tamanho={28} volume={false} />
            <text x={14} y={31} textAnchor="middle" fontSize="6" fontWeight="700" fill="#fff" stroke="#000" strokeOpacity="0.35" strokeWidth="1.6" paintOrder="stroke" fontFamily="sans-serif">
              {v.nome}
            </text>
          </g>
        ),
      });
    });
  // Etapa 329 — árvores, flores, pedras, moinho e lampiões
  enfeites.forEach((e, i) => {
    ents.push({ chave: e.x + e.y + 0.5, el: <EnfeiteMundo key={`enf${i}`} e={e} tema={tema} noite={noite} /> });
  });
  ents.sort((a, b) => a.chave - b.chave);

  return (
    <svg viewBox={`0 0 ${LARG} ${ALT}`} className="w-full h-auto select-none" role="img" aria-label="Mapa do seu mundo">
      {/* água em volta */}
      <polygon points={pts([P(-1.5, -1.5), P(N + 1.5, -1.5), P(N + 1.5, N + 1.5), P(-1.5, N + 1.5)])} fill={noite ? tema.aguaNoite : tema.agua} opacity="0.85" />
      <g className="vtm-onda" opacity="0.5">
        {[-0.8, N + 0.6].map((k) => (
          <g key={k}>
            <polyline points={pts([P(-1, k), P(N + 1, k)])} stroke="#BFDBFE" strokeWidth="1" strokeDasharray="6 8" fill="none" />
            <polyline points={pts([P(k, -1), P(k, N + 1)])} stroke="#BFDBFE" strokeWidth="1" strokeDasharray="6 8" fill="none" />
          </g>
        ))}
      </g>
      <defs>
        <radialGradient id="vtm-luz-lampiao">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <MarVivo noite={noite} />
      {/* Etapa 331 — farol, patinhos e baleia */}
      <Farol noite={noite} />
      <BichosDoMar />
      {/* Etapa 329 — espuma batendo em volta da ilha */}
      <Espuma />
      {/* ilha: areia + terra */}
      <polygon points={pts([P(-0.4, -0.4), P(N + 0.4, -0.4), P(N + 0.4, N + 0.4), P(-0.4, N + 0.4)])} fill={tema.areia} />
      <polygon points={pts([P(0, N), P(N, N), P(N, N, -10), P(0, N, -10)])} fill="#7A5236" />
      <polygon points={pts([P(N, 0), P(N, N), P(N, N, -10), P(N, 0, -10)])} fill="#5E3F29" />
      {/* Etapa 329 — camadas de terra no barranco e pedrinhas */}
      {[-3.5, -7].map((z) => (
        <g key={z} stroke="#000" strokeOpacity="0.14" strokeWidth="0.8" fill="none">
          <polyline points={pts([P(0, N, z), P(N, N, z)])} strokeDasharray="10 4" />
          <polyline points={pts([P(N, 0, z), P(N, N, z)])} strokeDasharray="8 5" />
        </g>
      ))}
      {Array.from({ length: 10 }, (_, i) => {
        const [x, y] = i % 2 ? P(N, 0.6 + i * 1.1, -8.5) : P(0.6 + i * 1.1, N, -8.5);
        return <ellipse key={`pd${i}`} cx={x} cy={y} rx={1.4 + h01(i, 3, 1) * 1.2} ry="1" fill="#3F2A1C" opacity="0.5" />;
      })}
      {Array.from({ length: N }, (_, i) =>
        Array.from({ length: N }, (_, j) => (
          <polygon
            key={`${i}-${j}`}
            points={pts([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)])}
            fill={CAMINHO.has(`${i},${j}`) ? tema.caminho[(i + j) % 2 ? 0 : 1] : tom(tema.grama[(i + j) % 2 ? 0 : 1], (h01(i, j, 2) - 0.5) * 0.08)}
            stroke={CAMINHO.has(`${i},${j}`) ? tom(tema.caminho[1], -0.1) : tema.linha}
            strokeWidth="0.35"
          />
        ))
      )}
      {/* Etapa 329 — tufinhos de capim e pedrinhas no caminho */}
      <g pointerEvents="none">
        {Array.from({ length: N }, (_, i) =>
          Array.from({ length: N }, (_, j) => {
            const k = `${i},${j}`;
            if (CAMINHO.has(k)) {
              if (h01(i, j, 8) > 0.5) return null;
              const [x, y] = P(i + 0.3 + h01(i, j, 9) * 0.4, j + 0.3 + h01(i, j, 10) * 0.4);
              return <ellipse key={k} cx={x} cy={y} rx="1.6" ry="0.8" fill="#000" opacity="0.1" />;
            }
            return [0, 1].map((q) => {
              const [x, y] = P(i + 0.2 + h01(i, j, 12 + q) * 0.6, j + 0.2 + h01(i, j, 14 + q) * 0.6);
              return <path key={`${k}-${q}`} d={`M${x - 1.6} ${y} l0.6 -2.2 M${x} ${y} l0 -2.8 M${x + 1.6} ${y} l-0.6 -2.2`} stroke={tom(tema.grama[0], -0.28)} strokeWidth="0.6" strokeLinecap="round" />;
            });
          })
        )}
      </g>
      {/* arvorezinhas de enfeite */}
      {[
        [0.4, 0.4],
        [11.5, 2.4],
        [2.5, 11.5],
        [8.5, 10.5],
        [11.5, 8.5],
        [8.5, 2.6],
      ].map(([x, y], i) => {
        const [cx, cy] = P(x, y);
        return (
          <g key={i}>
            <rect x={cx - 1.2} y={cy - 9} width="2.4" height="9" fill={tema.tronco} />
            {tema.id === "deserto" ? (
              <g>
                <rect x={cx - 2.5} y={cy - 22} width="5" height="20" rx="2.5" fill={tema.copa[0]} />
                <rect x={cx - 8} y={cy - 16} width="4" height="9" rx="2" fill={tema.copa[1]} />
                <rect x={cx + 4} y={cy - 19} width="4" height="8" rx="2" fill={tema.copa[1]} />
              </g>
            ) : tema.id === "inverno" ? (
              <g>
                <polygon points={`${cx - 8},${cy - 6} ${cx + 8},${cy - 6} ${cx},${cy - 20}`} fill={tema.copa[0]} />
                <polygon points={`${cx - 6},${cy - 14} ${cx + 6},${cy - 14} ${cx},${cy - 26}`} fill={tema.copa[1]} />
                <polygon points={`${cx - 3},${cy - 22} ${cx + 3},${cy - 22} ${cx},${cy - 27}`} fill="#F8FAFC" />
              </g>
            ) : (
              <g>
                <ArvoreRica cx={cx} cy={cy} copa={tema.copa} tronco={tema.tronco} v={i % 3} />
              </g>
            )}
          </g>
        );
      })}

      {/* Etapa 316 — decoração do evento */}
      {evento === "halloween" &&
        [
          [0.5, 5.5],
          [2.5, 8.5],
          [8.5, 1.5],
          [10.5, 5.5],
          [6.5, 10.5],
        ].map(([x, y], i) => {
          const [cx, cy] = P(x, y);
          return (
            <g key={`ab${i}`}>
              <ellipse cx={cx} cy={cy - 4} rx="6" ry="4.6" fill="#EA580C" />
              <ellipse cx={cx} cy={cy - 4} rx="3" ry="4.6" fill="#F97316" />
              <rect x={cx - 0.8} y={cy - 10.5} width="1.6" height="3" fill="#15803D" />
              {noite && <circle cx={cx} cy={cy - 4} r="9" fill="#FDBA74" opacity="0.25" />}
              <path d={`M${cx - 3} ${cy - 5} l1.2 -1.6 l1.2 1.6 Z M${cx + 0.6} ${cy - 5} l1.2 -1.6 l1.2 1.6 Z`} fill="#FDE047" />
            </g>
          );
        })}
      {evento === "natal" &&
        [
          [0.5, 5.5],
          [2.5, 8.5],
          [8.5, 1.5],
          [10.5, 5.5],
          [6.5, 10.5],
        ].map(([x, y], i) => {
          const [cx, cy] = P(x, y);
          return (
            <g key={`nt${i}`}>
              <polygon points={`${cx - 8},${cy - 3} ${cx + 8},${cy - 3} ${cx},${cy - 18}`} fill="#15803D" />
              <polygon points={`${cx - 6},${cy - 11} ${cx + 6},${cy - 11} ${cx},${cy - 24}`} fill="#16A34A" />
              <path d={`M${cx} ${cy - 27} l1 2 l2 0.3 l-1.5 1.4 l0.4 2 l-1.9 -1 l-1.9 1 l0.4 -2 l-1.5 -1.4 l2 -0.3 Z`} fill="#FBBF24" />
              {[
                [-4, -7, "#EF4444"],
                [3, -9, "#3B82F6"],
                [-1, -15, "#FBBF24"],
                [4, -17, "#EF4444"],
              ].map(([dx, dy, c], k) => (
                <circle key={k} cx={cx + (dx as number)} cy={cy + (dy as number)} r="1.2" fill={c as string} className="animate-cintilar" style={{ animationDelay: `${k * 0.4}s` }} />
              ))}
              <rect x={cx + 5} y={cy - 5} width="5" height="5" fill="#DC2626" />
              <rect x={cx + 7} y={cy - 5} width="1" height="5" fill="#FDE047" />
            </g>
          );
        })}

      {ents.map((e) => e.el)}

      {evento === "halloween" &&
        [
          [60, 40],
          [300, 60],
          [200, 30],
        ].map(([x, y], i) => (
          <g key={`mc${i}`} className="vtm-voa" style={{ animationDuration: `${2 + i * 0.6}s` }} pointerEvents="none">
            <path d={`M${x} ${y} q-5 -6 -11 -3 q3 1 2 4 q-3 -1 -5 1 q5 0 8 2 Z M${x} ${y} q5 -6 11 -3 q-3 1 -2 4 q3 -1 5 1 q-5 0 -8 2 Z`} fill="#1F2421" />
          </g>
        ))}
      {/* Etapa 329 — passarinhos / vaga-lumes e a fumaça da chaminé */}
      <CeuVivo noite={noite} chamine={P(2.35, 1.45, 44)} />
      <Balao noite={noite} />
      {evento === "natal" && !tema.particula && <Particulas tipo="neve" />}

      {tema.particula && <Particulas tipo={tema.particula} />}
      {/* Etapa 315 — clima do humor: chuvinha quando ele está tristinho/doente */}
      {clima === "chuva" && <Particulas tipo="chuva" />}
      {(clima === "nuvens" || clima === "cinza" || clima === "chuva") && <SombrasNuvens escuras={clima !== "nuvens"} />}
      {(noite || periodo === "entardecer") && <rect width={LARG} height={ALT} fill={noite ? "#0B1026" : "#7C2D12"} opacity={noite ? 0.32 : 0.1} pointerEvents="none" />}
      {noite && <FachoFarol />}
    </svg>
  );
}

// ---------- Etapa 311 — desenhos dos monumentos ----------
const FB = { transformBox: "fill-box" as const, transformOrigin: "50% 100%" };

function desenharMonumento(id: string, x: number, y: number, noite: boolean, cor: CorMascote): React.ReactNode {
  const c = (dx = 0.5, dy = 0.5, z = 0) => P(x + dx, y + dy, z);
  switch (id) {
    case "h1": {
      // placa de boas-vindas
      const [cx, cy] = c(0.5, 0.5, 16);
      return (
        <g>
          {bloco(x + 0.3, y + 0.45, 0.08, 0.08, 14, "#7A4E2E")}
          {bloco(x + 0.62, y + 0.45, 0.08, 0.08, 14, "#7A4E2E")}
          <polygon points={pts([c(0.2, 0.5, 9), c(0.8, 0.5, 9), c(0.8, 0.5, 19), c(0.2, 0.5, 19)])} fill="#C9A27A" stroke="#7A4E2E" strokeWidth="0.7" />
          <text x={cx} y={cy + 1} fontSize="5" textAnchor="middle" fill="#5B3A1E" fontWeight="800" fontFamily="sans-serif">
            OLÁ!
          </text>
        </g>
      );
    }
    case "h50": {
      const [bx, by] = c(0.5, 0.5, 0);
      return (
        <g>
          {bloco(x + 0.3, y + 0.3, 0.4, 0.4, 3, "#A8A29E")}
          <line x1={bx} y1={by - 3} x2={bx} y2={by - 38} stroke="#E7E5E4" strokeWidth="1.4" />
          <path d={`M${bx} ${by - 38} Q${bx + 9} ${by - 35} ${bx + 16} ${by - 37} L${bx + 16} ${by - 27} Q${bx + 9} ${by - 25} ${bx} ${by - 28} Z`} fill="#EF4444" className="vtm-onda" />
        </g>
      );
    }
    case "h200":
    case "d2": {
      const [bx, by] = c();
      const frutas = id === "d2";
      return (
        <g>
          <rect x={bx - 2.2} y={by - 16} width="4.4" height="16" fill="#7A4E2E" />
          <circle cx={bx} cy={by - 26} r={frutas ? 11 : 13} fill={frutas ? "#3F9D5A" : "#2F7D46"} />
          <circle cx={bx - 7} cy={by - 20} r={frutas ? 7 : 9} fill={frutas ? "#4CAF50" : "#3F9D5A"} />
          <circle cx={bx + 7} cy={by - 21} r={frutas ? 7 : 9} fill={frutas ? "#5CC27A" : "#357F4A"} />
          {frutas
            ? [
                [-5, -27],
                [4, -30],
                [7, -20],
                [-8, -19],
                [1, -22],
              ].map(([dx, dy], i) => <circle key={i} cx={bx + dx} cy={by + dy} r="2" fill={i % 2 ? "#FB923C" : "#EF4444"} />)
            : <circle cx={bx + 4} cy={by - 33} r="4" fill="#4CAF50" opacity="0.8" />}
        </g>
      );
    }
    case "h500": {
      // moinho
      const [hx, hy] = c(0.5, 0.75, 26);
      return (
        <g>
          {bloco(x + 0.25, y + 0.25, 0.5, 0.5, 24, "#F1E6D2")}
          {telhado(x + 0.2, y + 0.2, 0.6, 0.6, 24, 10, "#B45309")}
          <polygon points={pts([c(0.42, 0.75, 0), c(0.58, 0.75, 0), c(0.58, 0.75, 8), c(0.42, 0.75, 8)])} fill="#7A4E2E" />
          <g className="animate-spin" style={{ transformBox: "fill-box", transformOrigin: "center", animationDuration: "7s" }}>
            {[0, 90, 180, 270].map((a) => (
              <rect key={a} x={hx - 1.6} y={hy - 18} width="3.2" height="18" fill="#FEF3C7" stroke="#A16207" strokeWidth="0.5" transform={`rotate(${a} ${hx} ${hy})`} />
            ))}
          </g>
          <circle cx={hx} cy={hy} r="1.6" fill="#7A4E2E" />
        </g>
      );
    }
    case "h1000": {
      // castelo (2×2)
      const torres: [number, number][] = [
        [0.1, 0.1],
        [1.5, 0.1],
        [0.1, 1.5],
        [1.5, 1.5],
      ];
      return (
        <g>
          {bloco(x + 0.3, y + 0.3, 1.4, 1.4, 26, "#CBD5E1")}
          <polygon points={pts([c(0.8, 1.7, 0), c(1.2, 1.7, 0), c(1.2, 1.7, 13), c(0.8, 1.7, 13)])} fill="#7A4E2E" />
          {torres.map(([dx, dy], i) => (
            <g key={i}>
              {bloco(x + dx, y + dy, 0.4, 0.4, 38, "#E2E8F0")}
              <polygon points={pts([P(x + dx + 0.2, y + dy + 0.2, 52), P(x + dx, y + dy + 0.4, 38), P(x + dx + 0.4, y + dy + 0.4, 38)])} fill="#DC2626" />
              <polygon points={pts([P(x + dx + 0.2, y + dy + 0.2, 52), P(x + dx + 0.4, y + dy, 38), P(x + dx + 0.4, y + dy + 0.4, 38)])} fill="#991B1B" />
            </g>
          ))}
          {(() => {
            const [fx, fy] = c(1, 1, 30);
            return (
              <g>
                <line x1={fx} y1={fy} x2={fx} y2={fy - 18} stroke="#E7E5E4" strokeWidth="1" />
                <path d={`M${fx} ${fy - 18} l10 3 l-10 3 Z`} fill="#FBBF24" className="vtm-onda" />
              </g>
            );
          })()}
          {noite &&
            [0.6, 1.2].map((u) => <polygon key={u} points={pts([c(u, 1.7, 15), c(u + 0.2, 1.7, 15), c(u + 0.2, 1.7, 21), c(u, 1.7, 21)])} fill="#FDE68A" />)}
        </g>
      );
    }
    case "s7": {
      const [bx, by] = c();
      return (
        <g>
          <ellipse cx={bx} cy={by} rx="9" ry="4.5" fill="#57534E" />
          <rect x={bx - 7} y={by - 2.5} width="14" height="2.6" rx="1.3" fill="#7A4E2E" transform={`rotate(18 ${bx} ${by})`} />
          <rect x={bx - 7} y={by - 2.5} width="14" height="2.6" rx="1.3" fill="#8B5A2B" transform={`rotate(-18 ${bx} ${by})`} />
          <g className="vtm-fogo" style={FB}>
            <path d={`M${bx - 5} ${by - 2} Q${bx - 6} ${by - 10} ${bx} ${by - 17} Q${bx + 6} ${by - 10} ${bx + 5} ${by - 2} Z`} fill="#F97316" />
            <path d={`M${bx - 2.5} ${by - 2} Q${bx - 3} ${by - 7} ${bx} ${by - 11} Q${bx + 3} ${by - 7} ${bx + 2.5} ${by - 2} Z`} fill="#FDE047" />
          </g>
          {noite && <circle cx={bx} cy={by - 6} r="16" fill="#F97316" opacity="0.18" />}
        </g>
      );
    }
    case "s30": {
      const [tx, ty] = c(0.5, 0.5, 46);
      return (
        <g>
          {bloco(x + 0.2, y + 0.2, 0.6, 0.6, 4, "#A8A29E")}
          {bloco(x + 0.35, y + 0.35, 0.3, 0.3, 34, "#D6D3D1", 4)}
          <polygon points={pts([P(x + 0.5, y + 0.5, 44), P(x + 0.35, y + 0.65, 38), P(x + 0.65, y + 0.65, 38)])} fill="#E7E5E4" />
          <polygon points={pts([P(x + 0.5, y + 0.5, 44), P(x + 0.65, y + 0.35, 38), P(x + 0.65, y + 0.65, 38)])} fill="#A8A29E" />
          <g className="vtm-brilha" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            <path d={`M${tx} ${ty - 6} l1.6 4.4 l4.4 1.6 l-4.4 1.6 l-1.6 4.4 l-1.6 -4.4 l-4.4 -1.6 l4.4 -1.6 Z`} fill="#93C5FD" />
          </g>
          <line x1={tx + 2} y1={ty - 1} x2={tx + 13} y2={ty - 9} stroke="#BFDBFE" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
        </g>
      );
    }
    case "s100": {
      const [bx, by] = c();
      return (
        <g>
          <path d={`M${bx - 16} ${by + 2} L${bx - 5} ${by - 26} L${bx + 5} ${by - 26} L${bx + 16} ${by + 2} Z`} fill="#78716C" />
          <path d={`M${bx} ${by - 26} L${bx + 5} ${by - 26} L${bx + 16} ${by + 2} L${bx + 2} ${by + 2} Z`} fill="#57534E" />
          <ellipse cx={bx} cy={by - 26} rx="5" ry="2" fill="#EF4444" />
          <path d={`M${bx - 2} ${by - 25} Q${bx - 4} ${by - 15} ${bx - 7} ${by - 8}`} stroke="#F97316" strokeWidth="2" fill="none" />
          {[0, 0.8, 1.6].map((d) => (
            <circle key={d} cx={bx} cy={by - 30} r="3.5" fill="#D6D3D1" className="vtm-fumaca" style={{ transformBox: "fill-box", animationDelay: `${d}s` }} />
          ))}
        </g>
      );
    }
    case "f1": {
      const [bx, by] = c();
      return (
        <g>
          <ellipse cx={bx} cy={by - 2} rx="9" ry="4.5" fill="#A16207" />
          <ellipse cx={bx} cy={by - 3.5} rx="6.5" ry="2.8" fill="#713F12" />
          <ellipse cx={bx - 1.5} cy={by - 7} rx="3.4" ry="4.3" fill="#FEF9C3" stroke="#E7E5E4" strokeWidth="0.5" />
          <ellipse cx={bx + 2.5} cy={by - 6} rx="3" ry="3.8" fill="#DBEAFE" stroke="#E7E5E4" strokeWidth="0.5" />
        </g>
      );
    }
    case "f3":
    case "f5": {
      const ouro = id === "f5";
      const [bx, by] = c(0.5, 0.5, 9);
      return (
        <g>
          {bloco(x + 0.2, y + 0.2, 0.6, 0.6, 9, ouro ? "#FDE68A" : "#D6D3D1")}
          <g
            transform={`translate(${bx - 13}, ${by - 24})`}
            style={{ filter: ouro ? "sepia(1) saturate(4) hue-rotate(-12deg) brightness(1.05)" : "grayscale(1) brightness(1.05)" }}
          >
            <Mascote cor={cor} fase={ouro ? 5 : 3} humor="feliz" equipados={ouro ? { chapeu: "coroa" } : {}} tamanho={26} volume={false} animado={false} />
          </g>
          {ouro && <circle cx={bx + 10} cy={by - 22} r="1.4" fill="#FEF3C7" className="vtm-brilha" style={{ transformBox: "fill-box", transformOrigin: "center" }} />}
        </g>
      );
    }
    case "c3": {
      const [bx, by] = c(0.5, 0.5, 10);
      return (
        <g>
          {bloco(x + 0.22, y + 0.22, 0.56, 0.56, 10, "#A8A29E")}
          <polygon points={pts([P(x + 0.3, y + 0.3, 10), P(x + 0.7, y + 0.3, 10), P(x + 0.7, y + 0.7, 10), P(x + 0.3, y + 0.7, 10)])} fill="#3B82F6" />
          {bloco(x + 0.22, y + 0.46, 0.06, 0.06, 26, "#7A4E2E")}
          {bloco(x + 0.72, y + 0.46, 0.06, 0.06, 26, "#7A4E2E")}
          {telhado(x + 0.12, y + 0.3, 0.76, 0.4, 26, 8, "#B45309")}
          <line x1={bx} y1={by - 13} x2={bx} y2={by - 4} stroke="#57534E" strokeWidth="0.6" />
          <rect x={bx - 2} y={by - 5} width="4" height="3.5" fill="#7A4E2E" />
        </g>
      );
    }
    case "c10": {
      const [bx, by] = c(0.5, 0.5, 6);
      return (
        <g>
          {bloco(x + 0.08, y + 0.08, 0.84, 0.84, 6, "#D6D3D1")}
          <polygon points={pts([P(x + 0.18, y + 0.18, 6), P(x + 0.82, y + 0.18, 6), P(x + 0.82, y + 0.82, 6), P(x + 0.18, y + 0.82, 6)])} fill="#60A5FA" />
          {bloco(x + 0.42, y + 0.42, 0.16, 0.16, 12, "#E7E5E4", 6)}
          <ellipse cx={bx} cy={by - 12} rx="5" ry="2" fill="#E7E5E4" />
          {[-4, 0, 4].map((dx, i) => (
            <circle key={dx} cx={bx + dx} cy={by - 14} r="1.2" fill="#BFDBFE" className="vtm-gota" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
        </g>
      );
    }
    case "cv": {
      const [r1x, r1y] = c(0.28, 0.75, 2.5);
      const [r2x, r2y] = c(0.72, 0.75, 2.5);
      return (
        <g>
          {bloco(x + 0.12, y + 0.25, 0.76, 0.5, 6, "#EF4444", 2)}
          {bloco(x + 0.3, y + 0.3, 0.4, 0.4, 5, "#F87171", 8)}
          <polygon points={pts([P(x + 0.32, y + 0.7, 9), P(x + 0.68, y + 0.7, 9), P(x + 0.68, y + 0.7, 12.5), P(x + 0.32, y + 0.7, 12.5)])} fill="#BFDBFE" />
          <circle cx={r1x} cy={r1y} r="2.6" fill="#1F2937" />
          <circle cx={r2x} cy={r2y} r="2.6" fill="#1F2937" />
        </g>
      );
    }
    case "m10": {
      const [bx, by] = c(0.5, 0.5, 14);
      return (
        <g>
          {bloco(x + 0.3, y + 0.55, 0.06, 0.06, 10, "#7A4E2E")}
          {bloco(x + 0.64, y + 0.55, 0.06, 0.06, 10, "#7A4E2E")}
          {[9, 6.5, 4, 1.8].map((r, i) => (
            <ellipse key={r} cx={bx} cy={by} rx={r} ry={r} fill={i % 2 ? "#FFFFFF" : "#EF4444"} />
          ))}
          <line x1={bx + 7} y1={by - 6} x2={bx + 1} y2={by} stroke="#7A4E2E" strokeWidth="1" />
        </g>
      );
    }
    case "m50": {
      return (
        <g>
          {bloco(x + 0.2, y + 0.2, 0.6, 0.6, 44, "#A8A29E")}
          {[0.2, 0.47, 0.74].map((u) => (
            <g key={u}>{bloco(x + u, y + 0.2, 0.06, 0.06, 5, "#D6D3D1", 44)}</g>
          ))}
          {[0.2, 0.47, 0.74].map((u) => (
            <g key={`b${u}`}>{bloco(x + 0.74, y + u, 0.06, 0.06, 5, "#D6D3D1", 44)}</g>
          ))}
          <polygon points={pts([c(0.42, 0.8, 30), c(0.58, 0.8, 30), c(0.58, 0.8, 36), c(0.42, 0.8, 36)])} fill={noite ? "#FDE68A" : "#1F2937"} />
        </g>
      );
    }
    case "b1": {
      const [bx, by] = c(0.5, 0.5, 9);
      return (
        <g>
          {bloco(x + 0.25, y + 0.32, 0.5, 0.36, 7, "#8B5A2B")}
          {bloco(x + 0.25, y + 0.32, 0.5, 0.36, 3, "#A16207", 7)}
          <polygon points={pts([P(x + 0.48, y + 0.68, 4), P(x + 0.54, y + 0.68, 4), P(x + 0.54, y + 0.68, 10), P(x + 0.48, y + 0.68, 10)])} fill="#FBBF24" />
          <circle cx={bx + 7} cy={by - 6} r="1.4" fill="#FEF3C7" className="vtm-brilha" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <text x={bx - 8} y={by + 3} fontSize="6">🪙</text>
        </g>
      );
    }
    case "b5": {
      // navio pirata na água
      const [bx, by] = P(x + 1, y + 0.5);
      return (
        <g className="vtm-onda">
          <path d={`M${bx - 22} ${by - 8} L${bx + 22} ${by - 8} L${bx + 15} ${by + 3} L${bx - 15} ${by + 3} Z`} fill="#7A4E2E" />
          <rect x={bx - 22} y={by - 10} width="44" height="2.5" fill="#5B3A1E" />
          <line x1={bx} y1={by - 10} x2={bx} y2={by - 42} stroke="#5B3A1E" strokeWidth="1.6" />
          <path d={`M${bx + 1} ${by - 40} Q${bx + 16} ${by - 30} ${bx + 1} ${by - 15} Z`} fill="#F5F5F4" />
          <path d={`M${bx - 1} ${by - 38} Q${bx - 13} ${by - 29} ${bx - 1} ${by - 18} Z`} fill="#E7E5E4" />
          <path d={`M${bx} ${by - 42} l9 2.5 l-9 2.5 Z`} fill="#111827" />
        </g>
      );
    }
    case "d1": {
      const [bx, by] = c(0.5, 0.5, 14);
      return (
        <g>
          {bloco(x + 0.15, y + 0.4, 0.7, 0.25, 6, "#B07D52")}
          {bloco(x + 0.15, y + 0.62, 0.7, 0.06, 8, "#8B5A2B", 6)}
          <g className="vtm-voa" style={{ transformBox: "fill-box" }}>
            <path d={`M${bx} ${by - 2} C${bx - 7} ${by - 7} ${bx - 4} ${by - 13} ${bx} ${by - 9} C${bx + 4} ${by - 13} ${bx + 7} ${by - 7} ${bx} ${by - 2} Z`} fill="#F472B6" />
          </g>
        </g>
      );
    }
    default:
      return null;
  }
}

/** Etapa 312 — neve, folhas, pétalas ou brasas caindo sobre a ilha. */
function Particulas({ tipo }: { tipo: NonNullable<TemaIlha["particula"]> | "chuva" }) {
  if (tipo === "chuva") {
    return (
      <g pointerEvents="none" aria-hidden>
        {Array.from({ length: 34 }, (_, i) => {
          const x = ((i * 61) % LARG) + 3;
          return (
            <g key={i} className="vtm-cai" style={{ animationDuration: `${1.4 + (i % 4) * 0.2}s`, animationDelay: `${-((i * 0.37) % 2)}s` }}>
              <line x1={x} y1={0} x2={x - 2} y2={7} stroke="#BFDBFE" strokeWidth="1" opacity="0.8" />
            </g>
          );
        })}
      </g>
    );
  }
  const cor = { neve: "#FFFFFF", folhas: "#E07A2E", petalas: "#F9A8D4", brasas: "#FDBA74" }[tipo];
  const sobe = tipo === "brasas";
  return (
    <g pointerEvents="none" aria-hidden>
      {Array.from({ length: 22 }, (_, i) => {
        const x = ((i * 97) % LARG) + 4;
        const atraso = (i * 0.53) % 6;
        const dur = 6 + (i % 5);
        return (
          <g key={i} className={sobe ? "vtm-brasa" : "vtm-cai"} style={{ animationDuration: `${dur}s`, animationDelay: `${-atraso}s` }}>
            {tipo === "neve" || tipo === "brasas" ? (
              <circle cx={x} cy={sobe ? ALT - 10 : 0} r={tipo === "neve" ? 1.6 : 1.2} fill={cor} opacity="0.9" />
            ) : (
              <ellipse cx={x} cy={0} rx="2.4" ry="1.3" fill={i % 3 ? cor : tom(cor, -0.15)} transform={`rotate(${(i * 47) % 180} ${x} 0)`} />
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Etapa 315 — sombras de nuvem passando devagar sobre a ilha. */
function SombrasNuvens({ escuras }: { escuras: boolean }) {
  return (
    <g pointerEvents="none" aria-hidden opacity={escuras ? 0.22 : 0.12}>
      {[
        [80, 120, 70],
        [260, 170, 90],
        [170, 230, 60],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.35} fill="#0F172A" className="vtm-nuvem" style={{ animationDuration: `${14 + i * 4}s` }} />
      ))}
    </g>
  );
}
