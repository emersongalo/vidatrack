"use client";

// Etapa 298 — o mascote, todo em SVG (sem imagens). Cresce por fase, muda
// de humor com o dia e veste o que a pessoa comprou na lojinha.
import { useId } from "react";
import { CORES_MASCOTE, type CorMascote, type Humor, type Slot } from "@/lib/mascote/mascote";

type Props = {
  cor: CorMascote;
  fase: number;
  humor: Humor;
  equipados?: Partial<Record<Slot, string>>;
  tamanho?: number;
  /** desenha o cenário (fundo) atrás */
  comFundo?: boolean;
  animado?: boolean;
  className?: string;
  aoTocar?: () => void;
};

const OLHO = "#1F2421";

export function Mascote({ cor, fase, humor, equipados = {}, tamanho = 160, comFundo = false, animado = true, className = "", aoTocar }: Props) {
  const uid = useId().replace(/:/g, "");
  const c = CORES_MASCOTE[cor] ?? CORES_MASCOTE.verde;
  const corpo = cor === "arcoiris" ? `url(#vtm-arco-${uid})` : c.corpo;
  const r = [0, 34, 40, 46, 50, 54][Math.max(0, Math.min(5, fase))] || 34;
  const k = r / 50;
  const cy = 170 - r * 0.95;
  const topo = cy - r * 0.95;
  const olhoY = cy - r * 0.2;
  const anim = animado ? "" : " vtm-parado";

  return (
    <svg
      viewBox="0 0 200 200"
      width={tamanho}
      height={tamanho}
      className={`vtm${anim} ${className}`}
      onClick={aoTocar}
      role="img"
      aria-label="Seu mascote"
    >
      <defs>
        <linearGradient id={`vtm-arco-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F6A6C1" />
          <stop offset="35%" stopColor="#F2C46D" />
          <stop offset="65%" stopColor="#8FD3A6" />
          <stop offset="100%" stopColor="#8EC5F5" />
        </linearGradient>
        <clipPath id={`vtm-clip-${uid}`}>
          <rect x="0" y="0" width="200" height="200" rx="36" />
        </clipPath>
        <radialGradient id={`vtm-brilho-${uid}`}>
          <stop offset="0%" stopColor={c.sombra} stopOpacity="0.35" />
          <stop offset="100%" stopColor={c.sombra} stopOpacity="0" />
        </radialGradient>
      </defs>

      {comFundo && equipados.fundo ? (
        <g clipPath={`url(#vtm-clip-${uid})`}>
          <Fundo id={equipados.fundo} />
        </g>
      ) : (
        <circle cx="100" cy={cy} r={r * 1.7} fill={`url(#vtm-brilho-${uid})`} />
      )}

      {/* sombra no chão */}
      <ellipse cx="100" cy="176" rx={fase === 0 ? 30 : r * 0.85} ry="6" fill="#000" opacity="0.18" className="vtm-sombra" />

      {fase >= 5 && <Aura cy={cy} r={r} />}

      <g className={fase === 0 ? "vtm-ovo" : "vtm-respira"}>
        {fase === 0 ? (
          <Ovo corpo={corpo} sombra={c.sombra} humor={humor} />
        ) : (
          <>
            {equipados.roupa === "capa" && (
              <g transform={`translate(100 ${cy}) scale(${k})`}>
                <path d="M-38 -14 Q-66 34 -52 66 L52 66 Q66 34 38 -14 Z" fill="#DC2626" />
                <path d="M-38 -14 Q-60 30 -48 62 L-30 62 Q-40 30 -26 -10 Z" fill="#B91C1C" opacity="0.6" />
              </g>
            )}
            {/* pés */}
            <ellipse cx={100 - r * 0.45} cy={cy + r * 0.88} rx={r * 0.3} ry={r * 0.15} fill={c.sombra} />
            <ellipse cx={100 + r * 0.45} cy={cy + r * 0.88} rx={r * 0.3} ry={r * 0.15} fill={c.sombra} />
            {/* orelhas (a partir de Crescido) */}
            {fase >= 3 && (
              <>
                <path d={`M${100 - r * 0.62} ${topo + r * 0.42} L${100 - r * 0.78} ${topo - r * 0.22} L${100 - r * 0.22} ${topo + r * 0.12} Z`} fill={corpo} stroke={c.sombra} strokeWidth="2" strokeLinejoin="round" />
                <path d={`M${100 + r * 0.62} ${topo + r * 0.42} L${100 + r * 0.78} ${topo - r * 0.22} L${100 + r * 0.22} ${topo + r * 0.12} Z`} fill={corpo} stroke={c.sombra} strokeWidth="2" strokeLinejoin="round" />
              </>
            )}
            {/* braços */}
            <ellipse cx={100 - r * 0.95} cy={cy + r * 0.15} rx={r * 0.17} ry={r * 0.28} transform={`rotate(25 ${100 - r * 0.95} ${cy + r * 0.15})`} fill={c.sombra} />
            <ellipse cx={100 + r * 0.95} cy={cy + r * 0.15} rx={r * 0.17} ry={r * 0.28} transform={`rotate(-25 ${100 + r * 0.95} ${cy + r * 0.15})`} fill={c.sombra} />
            {/* corpo */}
            <ellipse cx="100" cy={cy} rx={r} ry={r * 0.95} fill={corpo} />
            <ellipse cx="100" cy={cy + r * 0.32} rx={r * 0.6} ry={r * 0.48} fill={c.barriga} opacity="0.85" />
            <ellipse cx={100 - r * 0.38} cy={cy - r * 0.55} rx={r * 0.22} ry={r * 0.12} fill="#fff" opacity="0.35" transform={`rotate(-25 ${100 - r * 0.38} ${cy - r * 0.55})`} />
            {/* brotinho na cabeça (Pequeno e Campeão) */}
            {(fase === 2 || fase === 4) && !equipados.chapeu && (
              <g transform={`translate(100 ${topo + 2}) scale(${k})`}>
                <g className="vtm-broto">
                  <path d="M0 0 Q-2 -12 0 -18" stroke="#3F7D55" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M0 -14 Q-14 -24 -18 -12 Q-8 -8 0 -14 Z" fill="#6BCB8B" />
                  <path d="M0 -16 Q12 -28 18 -16 Q8 -10 0 -16 Z" fill="#8FD3A6" />
                </g>
              </g>
            )}
            <Rosto humor={humor} cy={olhoY} r={r} />
            {equipados.roupa && equipados.roupa !== "capa" && (
              <g transform={`translate(100 ${cy + r * 0.14}) scale(${k})`}>
                <Roupa id={equipados.roupa} />
              </g>
            )}
            {equipados.oculos && humor !== "dormindo" && (
              <g transform={`translate(100 ${olhoY}) scale(${k})`}>
                <Oculos id={equipados.oculos} />
              </g>
            )}
            {equipados.chapeu && (
              <g transform={`translate(100 ${topo + 3}) scale(${k})`}>
                <Chapeu id={equipados.chapeu} />
              </g>
            )}
            {equipados.mao && (
              <g transform={`translate(${100 + r * 1.02} ${cy + r * 0.28}) scale(${k})`}>
                <Mao id={equipados.mao} />
              </g>
            )}
          </>
        )}
      </g>

      {humor === "dormindo" && (
        <g fill="#C9C0F2" fontWeight="700" fontFamily="sans-serif">
          <text x={100 + r * 0.7} y={topo + 6} fontSize="14" className="vtm-z">z</text>
          <text x={100 + r * 0.9} y={topo - 8} fontSize="11" className="vtm-z" style={{ animationDelay: "0.8s" }}>z</text>
        </g>
      )}
      {humor === "radiante" && (
        <g fill="#FBBF24">
          {[
            [100 - r * 1.15, cy - r * 0.6, 0],
            [100 + r * 1.2, cy - r * 0.9, 0.6],
            [100 + r * 0.95, cy + r * 0.7, 1.2],
          ].map(([x, y, d], i) => (
            <path key={i} d={estrela(x, y, 6)} className="vtm-brilha" style={{ animationDelay: `${d}s` }} />
          ))}
        </g>
      )}
    </svg>
  );
}

function estrela(x: number, y: number, t: number) {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? t : t * 0.45;
    p.push(`${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${p.join(" L")} Z`;
}

function Rosto({ humor, cy, r }: { humor: Humor; cy: number; r: number }) {
  const dx = r * 0.36;
  const er = r * 0.13;
  const bocaY = cy + r * 0.32;
  return (
    <g>
      {/* bochechas */}
      <ellipse cx={100 - r * 0.58} cy={cy + r * 0.2} rx={r * 0.14} ry={r * 0.08} fill="#F472B6" opacity="0.45" />
      <ellipse cx={100 + r * 0.58} cy={cy + r * 0.2} rx={r * 0.14} ry={r * 0.08} fill="#F472B6" opacity="0.45" />
      {humor === "dormindo" ? (
        <>
          <path d={`M${100 - dx - er} ${cy} Q${100 - dx} ${cy + er} ${100 - dx + er} ${cy}`} stroke={OLHO} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d={`M${100 + dx - er} ${cy} Q${100 + dx} ${cy + er} ${100 + dx + er} ${cy}`} stroke={OLHO} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : humor === "radiante" ? (
        <>
          <path d={estrela(100 - dx, cy, er * 1.5)} fill={OLHO} />
          <path d={estrela(100 + dx, cy, er * 1.5)} fill={OLHO} />
        </>
      ) : humor === "feliz" ? (
        <>
          <path d={`M${100 - dx - er} ${cy + er * 0.4} Q${100 - dx} ${cy - er * 1.4} ${100 - dx + er} ${cy + er * 0.4}`} stroke={OLHO} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d={`M${100 + dx - er} ${cy + er * 0.4} Q${100 + dx} ${cy - er * 1.4} ${100 + dx + er} ${cy + er * 0.4}`} stroke={OLHO} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <g className="vtm-piscar">
            <circle cx={100 - dx} cy={cy} r={er} fill={OLHO} />
            <circle cx={100 - dx + er * 0.35} cy={cy - er * 0.35} r={er * 0.35} fill="#fff" />
          </g>
          <g className="vtm-piscar">
            <circle cx={100 + dx} cy={cy} r={er} fill={OLHO} />
            <circle cx={100 + dx + er * 0.35} cy={cy - er * 0.35} r={er * 0.35} fill="#fff" />
          </g>
          {humor === "triste" && (
            <>
              <path d={`M${100 - dx - er} ${cy - er * 1.7} L${100 - dx + er} ${cy - er * 2.2}`} stroke={OLHO} strokeWidth="2" strokeLinecap="round" />
              <path d={`M${100 + dx + er} ${cy - er * 1.7} L${100 + dx - er} ${cy - er * 2.2}`} stroke={OLHO} strokeWidth="2" strokeLinecap="round" />
              <path d={`M${100 + dx + er * 0.6} ${cy + er * 1.2} q-3 6 0 8 q3 -2 0 -8 Z`} fill="#7DD3FC" className="vtm-lagrima" />
            </>
          )}
        </>
      )}
      {/* boca */}
      {humor === "radiante" ? (
        <path d={`M${100 - r * 0.18} ${bocaY - 2} Q100 ${bocaY + r * 0.26} ${100 + r * 0.18} ${bocaY - 2} Z`} fill="#7A2E3B" />
      ) : humor === "feliz" ? (
        <path d={`M${100 - r * 0.16} ${bocaY} Q100 ${bocaY + r * 0.18} ${100 + r * 0.16} ${bocaY}`} stroke={OLHO} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      ) : humor === "triste" ? (
        <path d={`M${100 - r * 0.12} ${bocaY + 4} Q100 ${bocaY - r * 0.08} ${100 + r * 0.12} ${bocaY + 4}`} stroke={OLHO} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      ) : humor === "dormindo" ? (
        <ellipse cx="100" cy={bocaY + 2} rx={r * 0.06} ry={r * 0.08} fill={OLHO} opacity="0.7" />
      ) : (
        <path d={`M${100 - r * 0.1} ${bocaY} Q100 ${bocaY + r * 0.1} ${100 + r * 0.1} ${bocaY}`} stroke={OLHO} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
    </g>
  );
}

function Ovo({ corpo, sombra, humor }: { corpo: string; sombra: string; humor: Humor }) {
  return (
    <g>
      <path d="M100 86 C128 86 140 128 140 144 C140 166 122 176 100 176 C78 176 60 166 60 144 C60 128 72 86 100 86 Z" fill="#FFF8EC" stroke={sombra} strokeWidth="2.5" />
      <circle cx="84" cy="118" r="7" fill={corpo} opacity="0.8" />
      <circle cx="118" cy="108" r="5" fill={corpo} opacity="0.8" />
      <circle cx="122" cy="152" r="8" fill={corpo} opacity="0.8" />
      <circle cx="78" cy="156" r="5" fill={corpo} opacity="0.8" />
      <path d="M70 136 L80 130 L88 138 L98 128 L108 138 L118 130 L130 136" stroke={sombra} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
      {humor === "dormindo" ? (
        <>
          <path d="M88 146 q4 3 8 0" stroke={OLHO} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M104 146 q4 3 8 0" stroke={OLHO} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="92" cy="146" r="3.6" fill={OLHO} className="vtm-piscar" />
          <circle cx="108" cy="146" r="3.6" fill={OLHO} className="vtm-piscar" />
        </>
      )}
    </g>
  );
}

function Aura({ cy, r }: { cy: number; r: number }) {
  return (
    <g className="vtm-aura">
      <circle cx="100" cy={cy} r={r * 1.35} fill="none" stroke="#FDE68A" strokeWidth="3" opacity="0.5" />
      <circle cx="100" cy={cy} r={r * 1.55} fill="none" stroke="#FDE68A" strokeWidth="1.5" opacity="0.3" />
    </g>
  );
}

function Chapeu({ id }: { id: string }) {
  switch (id) {
    case "bone":
      return (
        <g>
          <path d="M-30 6 Q-31 -26 0 -27 Q31 -26 30 6 Z" fill="#E9875B" />
          <path d="M8 4 Q40 -2 54 8 Q40 12 8 10 Z" fill="#C9663C" />
          <circle cx="0" cy="-27" r="3.5" fill="#C9663C" />
          <path d="M-12 -24 Q-14 -6 -14 5" stroke="#C9663C" strokeWidth="1.5" fill="none" />
        </g>
      );
    case "laco":
      return (
        <g transform="translate(20 -2) rotate(15)">
          <path d="M0 0 L-18 -12 L-18 12 Z" fill="#F472B6" />
          <path d="M0 0 L18 -12 L18 12 Z" fill="#F472B6" />
          <circle cx="0" cy="0" r="5" fill="#DB2777" />
        </g>
      );
    case "flor":
      return (
        <g transform="translate(16 -4)">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-9" rx="6" ry="9" fill="#FFFFFF" transform={`rotate(${a})`} />
          ))}
          <circle cx="0" cy="0" r="6" fill="#FBBF24" />
        </g>
      );
    case "gorro":
      return (
        <g>
          <path d="M-32 6 Q-32 -32 0 -32 Q32 -32 32 6 Z" fill="#6B8AF0" />
          <rect x="-34" y="-4" width="68" height="12" rx="6" fill="#4F6BD0" />
          <circle cx="0" cy="-34" r="8" fill="#FFFFFF" />
        </g>
      );
    case "festa":
      return (
        <g transform="rotate(-12)">
          <path d="M-18 6 L0 -46 L18 6 Z" fill="#9C8FD9" />
          <path d="M-12 -10 L12 -10 M-7 -26 L7 -26" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
          <circle cx="0" cy="-48" r="6" fill="#F472B6" />
        </g>
      );
    case "cartola":
      return (
        <g>
          <ellipse cx="0" cy="4" rx="34" ry="6" fill="#1F2421" />
          <rect x="-22" y="-38" width="44" height="42" rx="4" fill="#1F2421" />
          <rect x="-22" y="-8" width="44" height="7" fill="#DC2626" />
        </g>
      );
    case "coroa":
      return (
        <g>
          <path d="M-28 6 L-28 -20 L-14 -6 L0 -28 L14 -6 L28 -20 L28 6 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="0" cy="-2" r="4" fill="#EF4444" />
          <circle cx="-17" cy="0" r="3" fill="#3B82F6" />
          <circle cx="17" cy="0" r="3" fill="#22C55E" />
        </g>
      );
    case "aureola":
      return (
        <g className="vtm-brilha">
          <ellipse cx="0" cy="-20" rx="30" ry="8" fill="none" stroke="#FDE68A" strokeWidth="5" />
          <ellipse cx="0" cy="-20" rx="30" ry="8" fill="none" stroke="#FBBF24" strokeWidth="2" />
        </g>
      );
    default:
      return null;
  }
}

function Oculos({ id }: { id: string }) {
  switch (id) {
    case "redondos":
      return (
        <g fill="rgba(255,255,255,0.18)" stroke="#1F2421" strokeWidth="3">
          <circle cx="-18" cy="0" r="11" />
          <circle cx="18" cy="0" r="11" />
          <path d="M-7 -1 Q0 -5 7 -1" fill="none" />
        </g>
      );
    case "escuros":
      return (
        <g>
          <rect x="-31" y="-9" width="25" height="17" rx="6" fill="#111" />
          <rect x="6" y="-9" width="25" height="17" rx="6" fill="#111" />
          <path d="M-6 -3 L6 -3" stroke="#111" strokeWidth="3" />
          <path d="M-27 -5 L-20 -5" stroke="#fff" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
          <path d="M10 -5 L17 -5" stroke="#fff" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
        </g>
      );
    case "coracao":
      return (
        <g fill="#F43F5E" opacity="0.92">
          <path d="M-18 9 L-30 -2 Q-34 -12 -24 -13 Q-19 -13 -18 -7 Q-17 -13 -12 -13 Q-2 -12 -6 -2 Z" />
          <path d="M18 9 L6 -2 Q2 -12 12 -13 Q17 -13 18 -7 Q19 -13 24 -13 Q34 -12 30 -2 Z" />
          <path d="M-6 -4 L6 -4" stroke="#F43F5E" strokeWidth="2.5" />
        </g>
      );
    case "estrela":
      return (
        <g fill="#FBBF24" stroke="#D97706" strokeWidth="1.5">
          <path d={estrela(-18, 0, 13)} />
          <path d={estrela(18, 0, 13)} />
          <path d="M-6 -2 L6 -2" stroke="#D97706" strokeWidth="2.5" />
        </g>
      );
    default:
      return null;
  }
}

function Roupa({ id }: { id: string }) {
  switch (id) {
    case "gravata":
      return (
        <g>
          <path d="M0 0 L-14 -9 L-14 9 Z" fill="#E11D48" />
          <path d="M0 0 L14 -9 L14 9 Z" fill="#E11D48" />
          <circle cx="0" cy="0" r="4.5" fill="#9F1239" />
        </g>
      );
    case "cachecol":
      return (
        <g>
          <rect x="-46" y="-7" width="92" height="14" rx="7" fill="#EF4444" />
          <path d="M-30 -7 L-30 7 M-12 -7 L-12 7 M6 -7 L6 7 M24 -7 L24 7" stroke="#FCA5A5" strokeWidth="3" />
          <rect x="16" y="2" width="13" height="30" rx="4" fill="#DC2626" transform="rotate(-8 22 16)" />
        </g>
      );
    case "colar":
      return (
        <g fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="0.8">
          {[-30, -20, -10, 0, 10, 20, 30].map((x) => (
            <circle key={x} cx={x} cy={-4 + Math.abs(x) * -0.1 + (30 - Math.abs(x)) * 0.25} r="3.6" />
          ))}
        </g>
      );
    case "medalha":
      return (
        <g>
          <path d="M-14 -8 L0 14 L14 -8" stroke="#3B82F6" strokeWidth="6" fill="none" strokeLinejoin="round" />
          <circle cx="0" cy="20" r="9" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
          <path d={estrela(0, 20, 5)} fill="#FFF7D6" />
        </g>
      );
    default:
      return null;
  }
}

function Mao({ id }: { id: string }) {
  switch (id) {
    case "cafe":
      return (
        <g>
          <path d="M-4 -12 q3 -6 0 -10 M3 -12 q3 -6 0 -10" stroke="#E5E7EB" strokeWidth="1.8" fill="none" className="vtm-vapor" />
          <rect x="-8" y="-10" width="16" height="18" rx="3" fill="#FFFFFF" stroke="#D6D3D1" />
          <path d="M8 -6 q7 0 7 5 q0 5 -7 5" stroke="#D6D3D1" strokeWidth="2.5" fill="none" />
          <rect x="-8" y="-10" width="16" height="4" fill="#92400E" />
        </g>
      );
    case "livro":
      return (
        <g transform="rotate(-12)">
          <rect x="-12" y="-14" width="24" height="28" rx="2" fill="#3B82F6" />
          <rect x="-9" y="-12" width="20" height="24" rx="1" fill="#F8FAFC" />
          <rect x="-12" y="-14" width="5" height="28" fill="#1D4ED8" />
        </g>
      );
    case "halter":
      return (
        <g transform="rotate(-20)">
          <rect x="-14" y="-2" width="28" height="4" fill="#6B7280" />
          <rect x="-20" y="-9" width="8" height="18" rx="2" fill="#374151" />
          <rect x="12" y="-9" width="8" height="18" rx="2" fill="#374151" />
        </g>
      );
    case "balao":
      return (
        <g>
          <path d="M0 0 Q6 -24 4 -44" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
          <g className="vtm-balao">
            <ellipse cx="4" cy="-58" rx="14" ry="17" fill="#EF4444" />
            <ellipse cx="-1" cy="-63" rx="4" ry="6" fill="#fff" opacity="0.4" />
            <path d="M1 -41 L7 -41 L4 -37 Z" fill="#DC2626" />
          </g>
        </g>
      );
    case "trofeu":
      return (
        <g>
          <path d="M-10 -16 L10 -16 L8 -2 Q0 4 -8 -2 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
          <path d="M-10 -14 q-8 0 -6 6 q2 4 6 3 M10 -14 q8 0 6 6 q-2 4 -6 3" stroke="#D97706" strokeWidth="2" fill="none" />
          <rect x="-3" y="1" width="6" height="6" fill="#D97706" />
          <rect x="-8" y="7" width="16" height="4" rx="1" fill="#92400E" />
        </g>
      );
    default:
      return null;
  }
}

function Fundo({ id }: { id: string }) {
  switch (id) {
    case "quarto":
      return (
        <g>
          <rect width="200" height="200" fill="#3B2F4A" />
          <rect y="150" width="200" height="50" fill="#5B4636" />
          <rect x="128" y="34" width="46" height="40" rx="4" fill="#A5D8FF" stroke="#E7DCC8" strokeWidth="4" />
          <path d="M151 34 L151 74 M128 54 L174 54" stroke="#E7DCC8" strokeWidth="3" />
          <rect x="22" y="40" width="30" height="38" rx="3" fill="#F2C46D" />
          <ellipse cx="100" cy="182" rx="70" ry="12" fill="#B7A9F0" opacity="0.6" />
        </g>
      );
    case "jardim":
      return (
        <g>
          <rect width="200" height="200" fill="#CDEBFF" />
          <circle cx="164" cy="36" r="16" fill="#FDE68A" />
          <path d="M0 150 Q60 120 120 145 Q170 160 200 140 L200 200 L0 200 Z" fill="#7FC88F" />
          <path d="M0 170 Q80 150 200 172 L200 200 L0 200 Z" fill="#5EA875" />
          {[[24, 160, "#F472B6"], [50, 176, "#FBBF24"], [158, 168, "#F87171"], [182, 182, "#FFFFFF"]].map(([x, y, cor], i) => (
            <g key={i}>
              <circle cx={x as number} cy={y as number} r="4" fill={cor as string} />
              <circle cx={x as number} cy={y as number} r="1.5" fill="#FDE68A" />
            </g>
          ))}
        </g>
      );
    case "praia":
      return (
        <g>
          <rect width="200" height="200" fill="#FDBA8C" />
          <rect width="200" height="110" fill="#FCD6B5" />
          <circle cx="100" cy="112" r="26" fill="#FDE68A" />
          <rect y="112" width="200" height="40" fill="#60A5FA" />
          <path d="M0 126 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#BFDBFE" strokeWidth="2" fill="none" />
          <rect y="150" width="200" height="50" fill="#F3D9A4" />
        </g>
      );
    case "noite":
      return (
        <g>
          <rect width="200" height="200" fill="#16204A" />
          <path d="M150 30 a16 16 0 1 0 14 24 a12 12 0 1 1 -14 -24 Z" fill="#FDE68A" />
          {[[20, 30], [60, 18], [90, 44], [40, 70], [180, 90], [130, 70], [12, 110], [170, 130]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" className="vtm-brilha" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
          <path d="M0 160 Q100 140 200 160 L200 200 L0 200 Z" fill="#1E2B5E" />
        </g>
      );
    case "espaco":
      return (
        <g>
          <rect width="200" height="200" fill="#0B0B1E" />
          <circle cx="40" cy="44" r="18" fill="#9C8FD9" />
          <ellipse cx="40" cy="44" rx="30" ry="6" fill="none" stroke="#F2C46D" strokeWidth="3" transform="rotate(-18 40 44)" />
          <circle cx="168" cy="150" r="10" fill="#F87171" />
          {[[90, 20], [120, 60], [180, 30], [20, 120], [70, 180], [150, 100], [110, 150]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.4" fill="#fff" className="vtm-brilha" style={{ animationDelay: `${i * 0.25}s` }} />
          ))}
        </g>
      );
    default:
      return null;
  }
}
