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
      {/* ilha: areia + terra */}
      <polygon points={pts([P(-0.4, -0.4), P(N + 0.4, -0.4), P(N + 0.4, N + 0.4), P(-0.4, N + 0.4)])} fill={tema.areia} />
      <polygon points={pts([P(0, N), P(N, N), P(N, N, -10), P(0, N, -10)])} fill="#7A5236" />
      <polygon points={pts([P(N, 0), P(N, N), P(N, N, -10), P(N, 0, -10)])} fill="#5E3F29" />
      {Array.from({ length: N }, (_, i) =>
        Array.from({ length: N }, (_, j) => (
          <polygon
            key={`${i}-${j}`}
            points={pts([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)])}
            fill={CAMINHO.has(`${i},${j}`) ? tema.caminho[(i + j) % 2 ? 0 : 1] : tema.grama[(i + j) % 2 ? 0 : 1]}
            stroke={CAMINHO.has(`${i},${j}`) ? tom(tema.caminho[1], -0.1) : tema.linha}
            strokeWidth="0.35"
          />
        ))
      )}
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
                <circle cx={cx} cy={cy - 14} r="7" fill={tema.copa[0]} />
                <circle cx={cx - 3} cy={cy - 17} r="3.5" fill={tema.copa[1]} />
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
      {evento === "natal" && !tema.particula && <Particulas tipo="neve" />}

      {tema.particula && <Particulas tipo={tema.particula} />}
      {/* Etapa 315 — clima do humor: chuvinha quando ele está tristinho/doente */}
      {clima === "chuva" && <Particulas tipo="chuva" />}
      {(clima === "nuvens" || clima === "cinza" || clima === "chuva") && <SombrasNuvens escuras={clima !== "nuvens"} />}
      {(noite || periodo === "entardecer") && <rect width={LARG} height={ALT} fill={noite ? "#0B1026" : "#7C2D12"} opacity={noite ? 0.32 : 0.1} pointerEvents="none" />}
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
