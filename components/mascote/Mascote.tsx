"use client";

// Etapa 298 — o mascote, todo em SVG (sem imagens). Cresce por fase, muda
// de humor com o dia e veste o que a pessoa comprou na lojinha.
import { useCallback, useEffect, useId, useRef, useState } from "react";
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
  /** Etapa 300 — virar o bichinho (graus). 0 = de frente, 180 = de costas. */
  angulo?: number;
  /** Etapa 302 — hora do dia do lugar (sem passar, usa a hora atual) */
  periodo?: Periodo;
  /** Etapa 304 — luz e volume "3D" (filtro de iluminação). Por padrão só nos tamanhos grandes. */
  volume?: boolean;
};

// Etapa 304 — luz de cada hora: cor do brilho (contorno/especular) e da luz geral
const LUZ: Record<Periodo, { brilho: string; difusa: string; azimute: number }> = {
  manha: { brilho: "#FFE9B8", difusa: "#FFF8EC", azimute: 215 },
  tarde: { brilho: "#FFFFFF", difusa: "#FFFFFF", azimute: 240 },
  entardecer: { brilho: "#FFB27A", difusa: "#FFE6D2", azimute: 320 },
  noite: { brilho: "#A9BCFF", difusa: "#C9D2F2", azimute: 250 },
};

// Etapa 302 — lugares vivos: o cenário é onde ele mora. Muda com a hora
// (manhã, tarde, fim de tarde, noite) e o tempo segue o humor do dia.
export type Periodo = "manha" | "tarde" | "entardecer" | "noite";
export type Clima = "sol" | "limpo" | "nuvens" | "chuva" | "cinza";

export function periodoDaHora(h: number): Periodo {
  if (h >= 5 && h < 11) return "manha";
  if (h >= 11 && h < 17) return "tarde";
  if (h >= 17 && h < 19) return "entardecer";
  return "noite";
}

export function climaDoHumor(h: Humor): Clima {
  switch (h) {
    case "radiante":
      return "sol";
    case "triste":
      return "chuva";
    case "doente":
      return "cinza";
    case "neutro":
    case "fome":
      return "nuvens";
    default:
      return "limpo";
  }
}

/** Lugar de quem ainda não comprou nenhum. */
export const LUGAR_PADRAO = "casinha";

const OLHO = "#1F2421";

export function Mascote({ cor, fase, humor, equipados = {}, tamanho = 160, comFundo = false, animado = true, className = "", aoTocar, angulo = 0, periodo, volume }: Props) {
  const uid = useId().replace(/:/g, "");
  const c = CORES_MASCOTE[cor] ?? CORES_MASCOTE.verde;
  const corpo = cor === "arcoiris" ? `url(#vtm-arco-${uid})` : c.corpo;
  const r = [0, 34, 40, 46, 50, 54][Math.max(0, Math.min(5, fase))] || 34;
  const k = r / 50;
  const cy = 170 - r * 0.95;
  const topo = cy - r * 0.95;
  const olhoY = cy - r * 0.2;
  const anim = animado ? "" : " vtm-parado";
  // Etapa 300 — giro: o rosto desliza pela "bola" do corpo (recortado nela)
  // e, passando de 90°, ele mostra as costas com o rabinho.
  const rad = (angulo * Math.PI) / 180;
  const seno = Math.sin(rad);
  const costas = Math.cos(rad) < 0;
  const desvio = seno * r * 0.62;
  const larg = 0.9 + 0.1 * Math.abs(Math.cos(rad));
  // Etapa 304 — luz
  const per = periodo ?? periodoDaHora(new Date().getHours());
  const luz = LUZ[per];
  // celular mais fraco: fica só o sombreado (sem o filtro de luz, que pesa mais)
  const [fraco, setFraco] = useState(false);
  useEffect(() => {
    try {
      const n = navigator as any;
      if ((n.deviceMemory && n.deviceMemory <= 3) || (n.hardwareConcurrency && n.hardwareConcurrency <= 4)) setFraco(true);
    } catch {}
  }, []);
  const comVolume = (volume ?? tamanho >= 110) && !fraco;
  // o sol "anda": sombra no chão vai pro lado oposto
  const sombraX = per === "manha" ? 8 : per === "entardecer" ? -10 : per === "noite" ? 0 : 3;
  // Etapa 331 — trejeitos: de vez em quando ele acena, pula, olha pros
  // lados ou solta coraçõezinhos/notinhas (e reage quando você toca)
  const podeTrejeito = animado && fase > 0 && tamanho >= 110 && humor !== "dormindo" && humor !== "doente" && !costas;
  const [trejeito, reagir] = useTrejeito(podeTrejeito);
  const tj = podeTrejeito ? trejeito : null;

  return (
    <svg
      viewBox="0 0 200 200"
      width={tamanho}
      height={tamanho}
      className={`vtm${anim} ${className}`}
      onClick={() => {
        if (podeTrejeito) reagir(Math.random() < 0.5 ? "coracao" : "pular");
        aoTocar?.();
      }}
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
        <clipPath id={`vtm-corpo-${uid}`}>
          <ellipse cx="100" cy={cy} rx={r} ry={r * 0.95} />
        </clipPath>
        <clipPath id={`vtm-clip-${uid}`}>
          <rect x="0" y="0" width="200" height="200" rx="36" />
        </clipPath>
        {/* Etapa 304 — volume: sombreado redondo, oclusão embaixo, contorno de luz */}
        <radialGradient id={`vtm-vol-${uid}`} cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="38%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="72%" stopColor="#000000" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#1A1020" stopOpacity="0.38" />
        </radialGradient>
        <linearGradient id={`vtm-ao-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#140C1C" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id={`vtm-membro-${uid}`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id={`vtm-olho-${uid}`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#4A3A33" />
          <stop offset="70%" stopColor="#1B1412" />
          <stop offset="100%" stopColor="#050304" />
        </radialGradient>
        <radialGradient id={`vtm-chao-${uid}`}>
          <stop offset="0%" stopColor="#000" stopOpacity="0.38" />
          <stop offset="60%" stopColor="#000" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <mask id={`vtm-aro-${uid}`}>
          <ellipse cx="100" cy={cy} rx={r} ry={r * 0.95} fill="#fff" />
          <ellipse cx={100 - (per === "entardecer" ? -5 : 5)} cy={cy - 4} rx={r} ry={r * 0.95} fill="#000" />
        </mask>
        <filter id={`vtm-borra-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        {/* luz de verdade em tudo (corpo e acessórios): relevo suave + brilho */}
        <filter id={`vtm-luz-${uid}`} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.4" result="alt" />
          <feDiffuseLighting in="alt" surfaceScale="3.2" diffuseConstant="1.12" lightingColor={luz.difusa} result="dif">
            <feDistantLight azimuth={luz.azimute} elevation="58" />
          </feDiffuseLighting>
          <feComposite in="SourceGraphic" in2="dif" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="iluminado" />
          <feSpecularLighting in="alt" surfaceScale="3.2" specularConstant="0.6" specularExponent="24" lightingColor={luz.brilho} result="esp">
            <feDistantLight azimuth={luz.azimute} elevation="42" />
          </feSpecularLighting>
          <feComposite in="esp" in2="SourceAlpha" operator="in" result="esp2" />
          <feComposite in="iluminado" in2="esp2" operator="arithmetic" k1="0" k2="1" k3="0.55" k4="0" />
        </filter>
        {/* Etapa 329 — olho de verdade (íris com brilho) e pelinho */}
        <radialGradient id={`vtm-iris-${uid}`} cx="45%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#E2A660" />
          <stop offset="55%" stopColor="#8A5626" />
          <stop offset="100%" stopColor="#3A2210" />
        </radialGradient>
        <pattern id={`vtm-pelo-${uid}`} width="7" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
          <path d="M1 5 q1 -3 2 -4" stroke="#FFFFFF" strokeOpacity="0.32" strokeWidth="0.7" fill="none" strokeLinecap="round" />
          <path d="M4.5 6 q0.8 -2.6 1.8 -3.6" stroke="#000000" strokeOpacity="0.14" strokeWidth="0.7" fill="none" strokeLinecap="round" />
        </pattern>
        {/* Etapa 327 — corpo com mais profundidade e cor mais viva */}
        <radialGradient id={`vtm-pele-${uid}`} cx="36%" cy="30%" r="80%">
          <stop offset="0%" stopColor={misturarCor(c.corpo, "#FFFFFF", 0.35)} />
          <stop offset="45%" stopColor={c.corpo} />
          <stop offset="100%" stopColor={misturarCor(c.corpo, c.sombra, 0.75)} />
        </radialGradient>
        <linearGradient id={`vtm-barriga-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor={c.barriga} />
          <stop offset="100%" stopColor={misturarCor(c.barriga, c.sombra, 0.3)} />
        </linearGradient>
        <radialGradient id={`vtm-brilho-${uid}`}>
          <stop offset="0%" stopColor={c.sombra} stopOpacity="0.22" />
          <stop offset="100%" stopColor={c.sombra} stopOpacity="0" />
        </radialGradient>
      </defs>

      {comFundo ? (
        <g clipPath={`url(#vtm-clip-${uid})`}>
          {/* Etapa 304 — o lugar acompanha o giro de leve (profundidade) */}
          <g transform={`translate(${(-seno * 6).toFixed(2)} 0) translate(100 100) scale(1.06) translate(-100 -100)`}>
            <Fundo id={equipados.fundo ?? LUGAR_PADRAO} periodo={per} clima={climaDoHumor(humor)} uid={uid} />
          </g>
          <Atmosfera lugar={equipados.fundo ?? LUGAR_PADRAO} periodo={per} clima={climaDoHumor(humor)} uid={uid} />
        </g>
      ) : (
        <circle cx="100" cy={cy} r={r * 1.7} fill={`url(#vtm-brilho-${uid})`} />
      )}

      {/* sombra no chão */}
      {/* Etapa 304 — sombra macia (some pro lado contrário da luz) + sombra de contato */}
      <ellipse cx={100 + sombraX} cy="177" rx={(fase === 0 ? 34 : r * 1.05) + Math.abs(sombraX)} ry="8" fill={`url(#vtm-chao-${uid})`} className="vtm-sombra" />
      <ellipse cx="100" cy="175.5" rx={fase === 0 ? 22 : r * 0.62} ry="3.2" fill="#000" opacity={per === "noite" ? 0.22 : 0.3} filter={comVolume ? `url(#vtm-borra-${uid})` : undefined} />

      {fase >= 5 && <Aura cy={cy} r={r} />}

      <g key={tj?.n ?? 0} className={tj?.tipo === "pular" ? "vtm-pulinho" : undefined}>
      <g className={fase === 0 ? "vtm-ovo" : "vtm-respira"}>
      <g filter={comVolume ? `url(#vtm-luz-${uid})` : undefined}>
      <g transform={`translate(100 0) scale(${larg.toFixed(3)} 1) translate(-100 0)`}>
        {fase === 0 ? (
          <Ovo corpo={corpo} sombra={c.sombra} humor={humor} desvio={seno * 22} costas={costas} />
        ) : (
          <>
            {equipados.roupa === "capa" && !costas && (
              <g transform={`translate(100 ${cy}) scale(${k})`}>
                <path d="M-38 -14 Q-66 34 -52 66 L52 66 Q66 34 38 -14 Z" fill="#DC2626" />
                <path d="M-38 -14 Q-60 30 -48 62 L-30 62 Q-40 30 -26 -10 Z" fill="#B91C1C" opacity="0.6" />
              </g>
            )}
            {/* Etapa 329 — rabinho fofo (balança) */}
            {!costas && fase >= 2 && (
              <g transform={`translate(${100 + r * 0.82} ${cy + r * 0.5})`}>
                <g>
                  {animado && <animateTransform attributeName="transform" type="rotate" values="-8;10;-8" dur="1.8s" repeatCount="indefinite" />}
                  <path d={`M0 0 Q${r * 0.42} ${-r * 0.05} ${r * 0.5} ${-r * 0.42} Q${r * 0.62} ${-r * 0.7} ${r * 0.38} ${-r * 0.72} Q${r * 0.28} ${-r * 0.42} ${-r * 0.05} ${-r * 0.22} Z`} fill={cor === "arcoiris" ? corpo : `url(#vtm-pele-${uid})`} stroke={misturarCor(c.sombra, "#10131A", 0.35)} strokeWidth="1.6" strokeLinejoin="round" />
                  <path d={`M${r * 0.44} ${-r * 0.5} Q${r * 0.52} ${-r * 0.66} ${r * 0.4} ${-r * 0.68}`} stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth={Math.max(1, r * 0.05)} fill="none" strokeLinecap="round" />
                </g>
              </g>
            )}
            {/* pés */}
            {[-1, 1].map((l) => (
              <g key={l}>
                <ellipse cx={100 + l * r * 0.45} cy={cy + r * 0.88} rx={r * 0.3} ry={r * 0.15} fill={c.sombra} />
                <ellipse cx={100 + l * r * 0.45} cy={cy + r * 0.88} rx={r * 0.3} ry={r * 0.15} fill={`url(#vtm-membro-${uid})`} stroke={misturarCor(c.sombra, "#10131A", 0.35)} strokeWidth="1.6" />
                {/* Etapa 329 — dedinhos */}
                {!costas && fase >= 2 &&
                  [-1, 0, 1].map((d) => (
                    <path key={d} d={`M${100 + l * r * 0.45 + d * r * 0.1} ${cy + r * 0.93} v${-r * 0.06}`} stroke={misturarCor(c.sombra, "#10131A", 0.45)} strokeWidth={Math.max(0.8, r * 0.025)} strokeLinecap="round" opacity="0.7" />
                  ))}
              </g>
            ))}
            {/* orelhas (a partir de Crescido) */}
            {fase >= 3 && (
              <>
                <path d={`M${100 - r * 0.62} ${topo + r * 0.42} L${100 - r * 0.78} ${topo - r * 0.22} L${100 - r * 0.22} ${topo + r * 0.12} Z`} fill={corpo} stroke={c.sombra} strokeWidth="2" strokeLinejoin="round" />
                <path d={`M${100 + r * 0.62} ${topo + r * 0.42} L${100 + r * 0.78} ${topo - r * 0.22} L${100 + r * 0.22} ${topo + r * 0.12} Z`} fill={corpo} stroke={c.sombra} strokeWidth="2" strokeLinejoin="round" />
                {/* dentro da orelha */}
                <path d={`M${100 - r * 0.58} ${topo + r * 0.3} L${100 - r * 0.7} ${topo - r * 0.08} L${100 - r * 0.34} ${topo + r * 0.14} Z`} fill="#F6A6C1" opacity="0.75" />
                <path d={`M${100 + r * 0.58} ${topo + r * 0.3} L${100 + r * 0.7} ${topo - r * 0.08} L${100 + r * 0.34} ${topo + r * 0.14} Z`} fill="#F6A6C1" opacity="0.75" />
              </>
            )}
            {/* braços */}
            {[-1, 1].map((l) => (
              <g key={`${l}-${l === -1 && tj?.tipo === "acenar" ? tj.n : 0}`} className={l === -1 && tj?.tipo === "acenar" ? "vtm-aceno" : undefined}>
              <g transform={`rotate(${-l * 25} ${100 + l * r * 0.95} ${cy + r * 0.15})`}>
                <ellipse cx={100 + l * r * 0.95} cy={cy + r * 0.15} rx={r * 0.17} ry={r * 0.28} fill={c.sombra} />
                <ellipse cx={100 + l * r * 0.95} cy={cy + r * 0.15} rx={r * 0.17} ry={r * 0.28} fill={`url(#vtm-membro-${uid})`} stroke={misturarCor(c.sombra, "#10131A", 0.35)} strokeWidth="1.6" />
              </g>
              </g>
            ))}
            {/* corpo */}
            <ellipse cx="100" cy={cy} rx={r} ry={r * 0.95} fill={cor === "arcoiris" ? corpo : `url(#vtm-pele-${uid})`} />
            {humor === "doente" && <ellipse cx="100" cy={cy} rx={r} ry={r * 0.95} fill="#9CA3AF" opacity="0.28" />}
            {costas ? (
              <g clipPath={`url(#vtm-corpo-${uid})`}>
                {/* de costas: rabinho e uma manchinha */}
                <ellipse cx={100 - desvio * 0.9} cy={cy - r * 0.15} rx={r * 0.28} ry={r * 0.2} fill={c.sombra} opacity="0.35" />
              </g>
            ) : (
              <g clipPath={`url(#vtm-corpo-${uid})`}>
                <ellipse cx={100 + desvio} cy={cy + r * 0.34} rx={r * 0.58} ry={r * 0.46} fill={`url(#vtm-barriga-${uid})`} opacity="0.92" />
              </g>
            )}
            {/* Etapa 329 — pelinho (só nos tamanhos maiores, onde dá pra ver) */}
            {tamanho >= 90 && (
              <g clipPath={`url(#vtm-corpo-${uid})`}>
                <ellipse cx="100" cy={cy} rx={r} ry={r * 0.95} fill={`url(#vtm-pelo-${uid})`} opacity="0.55" />
              </g>
            )}
            {/* topetinho e bochechas fofas */}
            {!costas && fase >= 2 && (
              <g fill={cor === "arcoiris" ? corpo : misturarCor(c.corpo, "#FFFFFF", 0.12)} stroke={misturarCor(c.sombra, "#10131A", 0.35)} strokeWidth="1.4" strokeLinejoin="round">
                <path d={`M${100 - r * 0.2} ${topo + r * 0.06} Q${100 - r * 0.12} ${topo - r * 0.22} ${100 - r * 0.02} ${topo + r * 0.02} Q${100 + r * 0.06} ${topo - r * 0.26} ${100 + r * 0.16} ${topo + r * 0.05}`} />
                {[-1, 1].map((l) => (
                  <path key={l} d={`M${100 + l * r * 0.93} ${cy - r * 0.02} l${l * r * 0.13} ${r * 0.06} l${-l * r * 0.08} ${r * 0.05} l${l * r * 0.12} ${r * 0.07} l${-l * r * 0.16} ${r * 0.06}`} />
                ))}
              </g>
            )}
            {/* Etapa 304 — volume do corpo: sombreado redondo, oclusão, contorno de luz e brilho */}
            <ellipse cx="100" cy={cy} rx={r} ry={r * 0.95} fill={`url(#vtm-vol-${uid})`} />
            <ellipse cx="100" cy={cy} rx={r} ry={r * 0.95} fill={`url(#vtm-ao-${uid})`} />
            <ellipse cx="100" cy={cy} rx={r} ry={r * 0.95} fill={luz.brilho} opacity={per === "tarde" ? 0.35 : 0.6} mask={`url(#vtm-aro-${uid})`} />
            <ellipse
              cx={100 - r * 0.36 + desvio * 0.25}
              cy={cy - r * 0.52}
              rx={r * 0.24}
              ry={r * 0.13}
              fill="#fff"
              opacity="0.6"
              transform={`rotate(-25 ${100 - r * 0.36} ${cy - r * 0.52})`}
              filter={comVolume ? `url(#vtm-borra-${uid})` : undefined}
            />
            {/* Etapa 327 — contorno: o bichinho "descola" do fundo escuro */}
            <ellipse cx="100" cy={cy} rx={r} ry={r * 0.95} fill="none" stroke={misturarCor(c.sombra, "#10131A", 0.35)} strokeWidth={Math.max(2, r * 0.06)} opacity="0.85" />
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
            {!costas && (
              <g clipPath={`url(#vtm-corpo-${uid})`}>
                <g transform={`translate(${desvio.toFixed(2)} 0)`}>
                  <g key={tj?.tipo === "olhar" ? tj.n : 0} className={tj?.tipo === "olhar" ? "vtm-olhar" : undefined}>
                  <Rosto humor={humor} cy={olhoY} r={r} olho={`url(#vtm-olho-${uid})`} iris={tamanho >= 48 ? `url(#vtm-iris-${uid})` : undefined} contorno={misturarCor(c.sombra, "#10131A", 0.5)} />
                  </g>
                </g>
              </g>
            )}
            {costas && (
              <circle cx={100 - desvio * 0.5} cy={cy + r * 0.62} r={r * 0.16} fill={c.barriga} stroke={c.sombra} strokeWidth="1.5" />
            )}
            {equipados.roupa && equipados.roupa !== "capa" && !costas && (
              <g transform={`translate(${(100 + desvio * 0.8).toFixed(2)} ${cy + r * 0.14}) scale(${k})`}>
                <Roupa id={equipados.roupa} />
              </g>
            )}
            {equipados.roupa === "capa" && costas && (
              <g transform={`translate(100 ${cy}) scale(${k})`}>
                <path d="M-30 -22 Q-46 14 -42 50 Q0 58 42 50 Q46 14 30 -22 Q0 -12 -30 -22 Z" fill="#DC2626" />
                <path d="M-4 -14 Q-7 18 -5 50" stroke="#B91C1C" strokeWidth="3" fill="none" opacity="0.5" />
              </g>
            )}
            {equipados.oculos && humor !== "dormindo" && !costas && Math.abs(seno) < 0.75 && (
              <g transform={`translate(${(100 + desvio).toFixed(2)} ${olhoY}) scale(${k})`}>
                <Oculos id={equipados.oculos} />
              </g>
            )}
            {/* Etapa 315 — dormindo sem chapéu: touquinha de dormir */}
            {(equipados.chapeu || (humor === "dormindo" && fase > 0)) && (
              <g transform={`translate(${(100 + desvio * 0.25).toFixed(2)} ${topo + 3}) scale(${k})`}>
                <Chapeu id={equipados.chapeu ?? "touca"} />
              </g>
            )}
            {equipados.mao && (
              <g transform={`translate(${costas ? 100 - r * 1.02 : 100 + r * 1.02} ${cy + r * 0.28}) scale(${costas ? -k : k} ${k})`}>
                <Mao id={equipados.mao} />
              </g>
            )}
          </>
        )}
      </g>
      </g>
      </g>
      </g>

      {/* Etapa 331 — coraçõezinhos / notinhas subindo */}
      {(tj?.tipo === "coracao" || tj?.tipo === "nota") && (
        <g key={`fx${tj.n}`} pointerEvents="none">
          {[
            [100 - r * 0.5, topo - 4, 0],
            [100 + r * 0.55, topo - 10, 0.25],
            [100 + r * 0.05, topo - 20, 0.5],
          ].map(([x, y, d], i) => (
            <g key={i} className="vtm-sobe" style={{ animationDelay: `${d}s` }}>
              {tj.tipo === "coracao" ? (
                <path d={`M${x} ${y + 4} c-6 -4 -8 -9 -4 -11 c2 -1 4 0 4 2 c0 -2 2 -3 4 -2 c4 2 2 7 -4 11 Z`} fill={["#F472B6", "#EF4444", "#FB7185"][i]} />
              ) : (
                <text x={x} y={y} fontSize="13" fontWeight="700" fill={["#A78BFA", "#60A5FA", "#F472B6"][i]} fontFamily="sans-serif" textAnchor="middle">
                  {i === 1 ? "♫" : "♪"}
                </text>
              )}
            </g>
          ))}
        </g>
      )}

      {/* Etapa 301 — amiguinho do ladinho */}
      {equipados.amigo && fase > 0 && (
        <g transform={`translate(${(100 - r * 1.42).toFixed(1)} 174) scale(${Math.max(1.15, k * 1.35).toFixed(2)})`}>
          <Amigo id={equipados.amigo} />
        </g>
      )}

      {humor === "dormindo" && (
        <g fill="#C9C0F2" fontWeight="700" fontFamily="sans-serif">
          <text x={100 + r * 0.7} y={topo + 6} fontSize="14" className="vtm-z">z</text>
          <text x={100 + r * 0.9} y={topo - 8} fontSize="11" className="vtm-z" style={{ animationDelay: "0.8s" }}>z</text>
        </g>
      )}
      {/* Etapa 302 — dodói: bolsa de gelo, termômetro e suorzinho */}
      {humor === "doente" && fase > 0 && !costas && (
        <g>
          {!equipados.chapeu && (
            <g transform={`translate(${100 + r * 0.25} ${topo + 4}) rotate(-12)`}>
              <ellipse cx="0" cy="0" rx={r * 0.34} ry={r * 0.16} fill="#7DD3FC" stroke="#38BDF8" strokeWidth="1.5" />
              <rect x={-r * 0.06} y={-r * 0.24} width={r * 0.12} height={r * 0.1} rx="1.5" fill="#F87171" />
            </g>
          )}
          {/* Etapa 339 — curativo em X na bochecha (o termômetro na boca parecia cigarro) */}
          <g transform={`translate(${100 + desvio + r * 0.52} ${cy + r * 0.12})`}>
            {[-35, 35].map((ang) => (
              <g key={ang} transform={`rotate(${ang})`}>
                <rect x={-r * 0.2} y={-r * 0.055} width={r * 0.4} height={r * 0.11} rx={r * 0.05} fill="#F5C9A0" stroke="#D9A070" strokeWidth="0.6" />
                <rect x={-r * 0.06} y={-r * 0.05} width={r * 0.12} height={r * 0.1} rx={r * 0.02} fill="#E8B48A" />
                {[-0.13, 0.13].map((dx) => (
                  <circle key={dx} cx={r * dx} cy="0" r={Math.max(0.4, r * 0.012)} fill="#C08050" opacity="0.6" />
                ))}
              </g>
            ))}
          </g>
          <path d={`M${100 - r * 0.78} ${cy - r * 0.42} q-3 6 0 8 q3 -2 0 -8 Z`} fill="#BAE6FD" className="vtm-lagrima" />
        </g>
      )}
      {humor === "fome" && fase > 0 && !costas && (
        <text x={100 + r * 0.55} y={cy + r * 0.75} fontSize="11" fontWeight="700" fill="#F59E0B" fontFamily="sans-serif" className="vtm-ronco">
          ronc
        </text>
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

type Trejeito = "acenar" | "pular" | "coracao" | "nota" | "olhar";
const TREJEITOS: Trejeito[] = ["acenar", "pular", "coracao", "nota", "olhar"];

/** Etapa 331 — sorteia um trejeito a cada 6–13 s (e deixa disparar no toque) */
function useTrejeito(ativo: boolean): [{ tipo: Trejeito; n: number } | null, (t: Trejeito) => void] {
  const [atual, setAtual] = useState<{ tipo: Trejeito; n: number } | null>(null);
  const fim = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disparar = useCallback((tipo: Trejeito) => {
    if (fim.current) clearTimeout(fim.current);
    setAtual({ tipo, n: Date.now() });
    fim.current = setTimeout(() => setAtual(null), 2000);
  }, []);
  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    let id: ReturnType<typeof setTimeout>;
    const agenda = () => {
      id = setTimeout(() => {
        if (!vivo) return;
        if (typeof document === "undefined" || !document.hidden) disparar(TREJEITOS[Math.floor(Math.random() * TREJEITOS.length)]);
        agenda();
      }, 6000 + Math.random() * 7000);
    };
    agenda();
    return () => {
      vivo = false;
      clearTimeout(id);
    };
  }, [ativo, disparar]);
  useEffect(() => () => { if (fim.current) clearTimeout(fim.current); }, []);
  return [atual, disparar];
}

/** Etapa 329 — olho "de verdade": contorno, íris com degradê, pupila, pálpebra e reflexos */
function OlhoReal({ x, y, er, iris, pidao = false }: { x: number; y: number; er: number; iris: string; pidao?: boolean }) {
  const rx = er * 1.12;
  const ry = er * 1.32;
  return (
    <g className="vtm-piscar">
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#1A1412" />
      <ellipse cx={x} cy={y + er * 0.08} rx={rx * 0.82} ry={ry * 0.82} fill={iris} />
      <ellipse cx={x} cy={y + er * 0.12} rx={rx * (pidao ? 0.58 : 0.45)} ry={ry * (pidao ? 0.6 : 0.5)} fill="#0B0806" />
      {/* sombra da pálpebra */}
      <path d={`M${x - rx} ${y - ry * 0.15} Q${x} ${y - ry * 1.15} ${x + rx} ${y - ry * 0.15} Q${x} ${y - ry * 0.7} ${x - rx} ${y - ry * 0.15} Z`} fill="#000" opacity="0.28" />
      <ellipse cx={x + er * 0.38} cy={y - er * 0.42} rx={er * 0.36} ry={er * 0.32} fill="#fff" />
      <circle cx={x - er * 0.36} cy={y + er * 0.52} r={er * 0.15} fill="#fff" opacity="0.85" />
      {pidao && <circle cx={x + er * 0.1} cy={y + er * 0.2} r={er * 0.12} fill="#fff" opacity="0.7" />}
    </g>
  );
}

/** Etapa 327 — mistura duas cores hex (t = 0 → a, 1 → b) */
function misturarCor(a: string, b: string, t: number) {
  if (!a.startsWith("#") || !b.startsWith("#")) return a;
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("");
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

function Rosto({ humor, cy, r, olho = OLHO, iris, contorno = "#2A2230" }: { humor: Humor; cy: number; r: number; olho?: string; iris?: string; contorno?: string }) {
  const dx = r * 0.36;
  const er = r * 0.13;
  const bocaY = cy + r * 0.32;
  return (
    <g>
      {/* bochechas */}
      <ellipse cx={100 - r * 0.56} cy={cy + r * 0.22} rx={r * 0.15} ry={r * 0.09} fill="#F472B6" opacity="0.6" />
      <ellipse cx={100 + r * 0.56} cy={cy + r * 0.22} rx={r * 0.15} ry={r * 0.09} fill="#F472B6" opacity="0.6" />
      {humor === "dormindo" ? (
        <>
          <path d={`M${100 - dx - er} ${cy} Q${100 - dx} ${cy + er} ${100 - dx + er} ${cy}`} stroke={OLHO} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d={`M${100 + dx - er} ${cy} Q${100 + dx} ${cy + er} ${100 + dx + er} ${cy}`} stroke={OLHO} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : humor === "doente" ? (
        <>
          {/* olhinhos cansados (meio fechados) */}
          <path d={`M${100 - dx - er} ${cy - er * 0.2} L${100 - dx + er} ${cy + er * 0.3}`} stroke={OLHO} strokeWidth="2.6" strokeLinecap="round" />
          <path d={`M${100 + dx + er} ${cy - er * 0.2} L${100 + dx - er} ${cy + er * 0.3}`} stroke={OLHO} strokeWidth="2.6" strokeLinecap="round" />
          <ellipse cx={100 - dx} cy={cy + er * 0.9} rx={er * 0.9} ry={er * 0.35} fill="#6B7280" opacity="0.35" />
          <ellipse cx={100 + dx} cy={cy + er * 0.9} rx={er * 0.9} ry={er * 0.35} fill="#6B7280" opacity="0.35" />
        </>
      ) : humor === "fome" ? (
        <>
          {/* olhão pidão */}
          {iris && [-1, 1].map((l) => <OlhoReal key={l} x={100 + l * dx} y={cy} er={er * 1.15} iris={iris} pidao />)}
          {!iris && (<>
          <circle cx={100 - dx} cy={cy} r={er * 1.25} fill={olho} />
          <circle cx={100 - dx + er * 0.4} cy={cy - er * 0.45} r={er * 0.5} fill="#fff" />
          <circle cx={100 - dx - er * 0.45} cy={cy + er * 0.4} r={er * 0.22} fill="#fff" />
          <circle cx={100 + dx} cy={cy} r={er * 1.25} fill={olho} />
          <circle cx={100 + dx + er * 0.4} cy={cy - er * 0.45} r={er * 0.5} fill="#fff" />
          <circle cx={100 + dx - er * 0.45} cy={cy + er * 0.4} r={er * 0.22} fill="#fff" />
          </>)}
        </>
      ) : humor === "radiante" ? (
        <>
          <path d={estrela(100 - dx, cy, er * 1.5)} fill={OLHO} />
          <path d={estrela(100 + dx, cy, er * 1.5)} fill={OLHO} />
        </>
      ) : humor === "feliz" ? (
        <>
          {/* Etapa 329 — olho com íris, pupila e reflexo */}
          {[-1, 1].map((l) =>
            iris ? (
              <OlhoReal key={l} x={100 + l * dx} y={cy} er={er} iris={iris} />
            ) : (
              <g key={l} className="vtm-piscar">
                <ellipse cx={100 + l * dx} cy={cy} rx={er * 1.12} ry={er * 1.3} fill={olho} />
                <circle cx={100 + l * dx + er * 0.38} cy={cy - er * 0.48} r={er * 0.42} fill="#fff" />
              </g>
            )
          )}
        </>
      ) : (
        <>
          {iris ? (
            [-1, 1].map((l) => <OlhoReal key={l} x={100 + l * dx} y={cy} er={er * 0.95} iris={iris} />)
          ) : (<>
          <g className="vtm-piscar">
            <circle cx={100 - dx} cy={cy} r={er * 1.08} fill={olho} />
            <circle cx={100 - dx + er * 0.38} cy={cy - er * 0.38} r={er * 0.38} fill="#fff" />
            <circle cx={100 - dx - er * 0.4} cy={cy + er * 0.42} r={er * 0.16} fill="#fff" opacity="0.8" />
          </g>
          <g className="vtm-piscar">
            <circle cx={100 + dx} cy={cy} r={er * 1.08} fill={olho} />
            <circle cx={100 + dx + er * 0.38} cy={cy - er * 0.38} r={er * 0.38} fill="#fff" />
            <circle cx={100 + dx - er * 0.4} cy={cy + er * 0.42} r={er * 0.16} fill="#fff" opacity="0.8" />
          </g>
          </>)}
          {humor === "triste" && (
            <>
              <path d={`M${100 - dx - er} ${cy - er * 1.7} L${100 - dx + er} ${cy - er * 2.2}`} stroke={OLHO} strokeWidth="2" strokeLinecap="round" />
              <path d={`M${100 + dx + er} ${cy - er * 1.7} L${100 + dx - er} ${cy - er * 2.2}`} stroke={OLHO} strokeWidth="2" strokeLinecap="round" />
              <path d={`M${100 + dx + er * 0.6} ${cy + er * 1.2} q-3 6 0 8 q3 -2 0 -8 Z`} fill="#7DD3FC" className="vtm-lagrima" />
            </>
          )}
        </>
      )}
      {/* Etapa 329 — narizinho e bigodinhos */}
      {iris && humor !== "dormindo" && (
        <>
          <path d={`M${100 - r * 0.05} ${cy + r * 0.15} Q100 ${cy + r * 0.13} ${100 + r * 0.05} ${cy + r * 0.15} Q100 ${cy + r * 0.24} ${100 - r * 0.05} ${cy + r * 0.15} Z`} fill="#6B3344" />
          <ellipse cx={100 - r * 0.015} cy={cy + r * 0.155} rx={r * 0.018} ry={r * 0.01} fill="#fff" opacity="0.6" />
          {[-1, 1].map((l) => (
            <g key={l} stroke={contorno} strokeOpacity="0.38" strokeWidth={Math.max(0.6, r * 0.018)} strokeLinecap="round" fill="none">
              <path d={`M${100 + l * r * 0.42} ${cy + r * 0.22} q${l * r * 0.16} ${-r * 0.04} ${l * r * 0.3} ${-r * 0.02}`} />
              <path d={`M${100 + l * r * 0.42} ${cy + r * 0.28} q${l * r * 0.16} ${r * 0.01} ${l * r * 0.3} ${r * 0.05}`} />
            </g>
          ))}
        </>
      )}
      {/* boca */}
      {humor === "radiante" ? (
        <path d={`M${100 - r * 0.18} ${bocaY - 2} Q100 ${bocaY + r * 0.26} ${100 + r * 0.18} ${bocaY - 2} Z`} fill="#7A2E3B" />
      ) : humor === "feliz" ? (
        <>
          {/* sorriso aberto com linguinha */}
          <path d={`M${100 - r * 0.15} ${bocaY - 1} Q100 ${bocaY + r * 0.24} ${100 + r * 0.15} ${bocaY - 1} Z`} fill="#7A2E3B" />
          <path d={`M${100 - r * 0.08} ${bocaY + r * 0.1} Q100 ${bocaY + r * 0.02} ${100 + r * 0.08} ${bocaY + r * 0.1} Q100 ${bocaY + r * 0.18} ${100 - r * 0.08} ${bocaY + r * 0.1} Z`} fill="#F48FB1" />
        </>
      ) : humor === "triste" ? (
        <path d={`M${100 - r * 0.12} ${bocaY + 4} Q100 ${bocaY - r * 0.08} ${100 + r * 0.12} ${bocaY + 4}`} stroke={OLHO} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      ) : humor === "dormindo" ? (
        <ellipse cx="100" cy={bocaY + 2} rx={r * 0.06} ry={r * 0.08} fill={OLHO} opacity="0.7" />
      ) : humor === "doente" ? (
        <path d={`M${100 - r * 0.16} ${bocaY + 2} q${r * 0.08} -4 ${r * 0.16} 0 t${r * 0.16} 0`} stroke={OLHO} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : humor === "fome" ? (
        <>
          <ellipse cx="100" cy={bocaY + 2} rx={r * 0.08} ry={r * 0.1} fill="#7A2E3B" />
          <path d={`M${100 + r * 0.05} ${bocaY + r * 0.1} q-2 5 0 7 q2 -2 0 -7 Z`} fill="#BAE6FD" className="vtm-lagrima" />
        </>
      ) : (
        <path d={`M${100 - r * 0.1} ${bocaY} Q100 ${bocaY + r * 0.1} ${100 + r * 0.1} ${bocaY}`} stroke={OLHO} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
    </g>
  );
}

function Ovo({ corpo, sombra, humor, desvio = 0, costas = false }: { corpo: string; sombra: string; humor: Humor; desvio?: number; costas?: boolean }) {
  return (
    <g>
      <path d="M100 86 C128 86 140 128 140 144 C140 166 122 176 100 176 C78 176 60 166 60 144 C60 128 72 86 100 86 Z" fill="#FFF8EC" stroke={sombra} strokeWidth="2.5" />
      <circle cx="84" cy="118" r="7" fill={corpo} opacity="0.8" />
      <circle cx="118" cy="108" r="5" fill={corpo} opacity="0.8" />
      <circle cx="122" cy="152" r="8" fill={corpo} opacity="0.8" />
      <circle cx="78" cy="156" r="5" fill={corpo} opacity="0.8" />
      <path d="M70 136 L80 130 L88 138 L98 128 L108 138 L118 130 L130 136" stroke={sombra} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
      {costas ? null : (
      <g transform={`translate(${desvio.toFixed(2)} 0)`}>
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
    // Etapa 331 — novidades da lojinha
    case "cowboy":
      return (
        <g>
          <path d="M-24 2 Q-27 -24 -12 -30 Q0 -23 12 -30 Q27 -24 24 2 Z" fill="#B45309" />
          <path d="M-4 -26 Q0 -20 4 -26" stroke="#92400E" strokeWidth="1.5" fill="none" />
          <path d="M-24 -5 Q0 1 24 -5 L24 2 Q0 7 -24 2 Z" fill="#451A03" />
          <circle cx="15" cy="-1.5" r="2.6" fill="#FBBF24" />
          <path d="M-48 -6 Q-44 8 0 9 Q44 8 48 -6 Q40 4 24 1 Q0 6 -24 1 Q-40 4 -48 -6 Z" fill="#92400E" />
          <path d="M-40 1 Q0 10 40 1" stroke="#78350F" strokeWidth="1" fill="none" opacity="0.6" />
          <path d="M-18 -22 Q-20 -10 -19 -2" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      );
    case "tiara":
      return (
        <g>
          <path d="M-30 6 Q0 -6 30 6" stroke="#CBD5E1" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M-22 1 L-16 -11 L-8 -3 L0 -19 L8 -3 L16 -11 L22 1 Q0 -5 -22 1 Z" fill="#EEF2FF" stroke="#A5B4FC" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="0" cy="-10" r="3.6" fill="#EC4899" />
          <circle cx="-1" cy="-11" r="1.1" fill="#FFFFFF" opacity="0.8" />
          <circle cx="-14" cy="-4" r="2" fill="#38BDF8" />
          <circle cx="14" cy="-4" r="2" fill="#38BDF8" />
          <path d={estrela(13, -19, 4)} fill="#FDE68A" className="vtm-brilha" />
        </g>
      );
    case "coelho":
      return (
        <g>
          {[-1, 1].map((l) => (
            <g key={l} transform={`rotate(${l * 12} ${l * 14} 0)`}>
              <ellipse cx={l * 14} cy={-24} rx="8" ry="23" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
              <ellipse cx={l * 14} cy={-22} rx="3.8" ry="16" fill="#F9A8D4" />
            </g>
          ))}
          <path d="M-27 6 Q0 -8 27 6" stroke="#F472B6" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </g>
      );
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
    case "palha":
      return (
        <g>
          <ellipse cx="0" cy="2" rx="46" ry="9" fill="#E8C872" stroke="#C9A24A" strokeWidth="1.5" />
          <path d="M-24 0 Q-24 -28 0 -28 Q24 -28 24 0 Z" fill="#F0D488" stroke="#C9A24A" strokeWidth="1.5" />
          <path d="M-24 -6 Q0 -2 24 -6 L24 0 Q0 4 -24 0 Z" fill="#E11D48" />
          <path d="M-16 -20 L16 -20 M-20 -13 L20 -13" stroke="#C9A24A" strokeWidth="1" opacity="0.6" />
        </g>
      );
    case "fones":
      return (
        <g>
          <path d="M-46 22 Q-48 -16 0 -16 Q48 -16 46 22" stroke="#334155" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M-46 22 Q-48 -16 0 -16 Q48 -16 46 22" stroke="#64748B" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="-56" y="14" width="16" height="26" rx="7" fill="#F43F5E" />
          <rect x="40" y="14" width="16" height="26" rx="7" fill="#F43F5E" />
          <rect x="-53" y="18" width="5" height="18" rx="2.5" fill="#FDA4AF" opacity="0.7" />
          <rect x="48" y="18" width="5" height="18" rx="2.5" fill="#FDA4AF" opacity="0.7" />
        </g>
      );
    case "chef":
      return (
        <g>
          <circle cx="-16" cy="-18" r="14" fill="#FFFFFF" stroke="#E5E7EB" />
          <circle cx="16" cy="-18" r="14" fill="#FFFFFF" stroke="#E5E7EB" />
          <circle cx="0" cy="-28" r="16" fill="#FFFFFF" stroke="#E5E7EB" />
          <rect x="-24" y="-12" width="48" height="16" rx="3" fill="#FFFFFF" stroke="#E5E7EB" />
          <path d="M-10 -8 L-10 2 M0 -8 L0 2 M10 -8 L10 2" stroke="#E5E7EB" strokeWidth="1.5" />
        </g>
      );
    case "floral":
      return (
        <g>
          <path d="M-32 6 Q0 -6 32 6" stroke="#4D7C0F" strokeWidth="3" fill="none" />
          {[[-30, 5, "#F472B6"], [-18, -1, "#FBBF24"], [-6, -3, "#A78BFA"], [6, -3, "#F87171"], [18, -1, "#60A5FA"], [30, 5, "#F472B6"]].map(([x, y, cor], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} cx="0" cy="-4" rx="3" ry="4.5" fill={cor as string} transform={`rotate(${a})`} />
              ))}
              <circle r="2.4" fill="#FEF3C7" />
            </g>
          ))}
          <ellipse cx="-24" cy="9" rx="5" ry="2.5" fill="#65A30D" transform="rotate(-20 -24 9)" />
          <ellipse cx="24" cy="9" rx="5" ry="2.5" fill="#65A30D" transform="rotate(20 24 9)" />
        </g>
      );
    case "pirata":
      return (
        <g>
          <path d="M-46 4 Q-30 -10 -22 -26 Q0 -40 22 -26 Q30 -10 46 4 Q0 -6 -46 4 Z" fill="#1F2421" />
          <path d="M-46 4 Q0 -6 46 4" stroke="#FBBF24" strokeWidth="2.5" fill="none" />
          <circle cx="0" cy="-16" r="6.5" fill="#F8FAFC" />
          <circle cx="-2.4" cy="-17" r="1.5" fill="#1F2421" />
          <circle cx="2.4" cy="-17" r="1.5" fill="#1F2421" />
          <path d="M-8 -6 L8 -2 M8 -6 L-8 -2" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "mago":
      return (
        <g>
          <path d="M-26 2 L-2 -62 Q8 -70 18 -60 Q8 -58 6 -50 L26 2 Z" fill="#4F46E5" />
          <ellipse cx="0" cy="3" rx="40" ry="7" fill="#4338CA" />
          <path d={estrela(-6, -22, 6)} fill="#FDE68A" />
          <path d={estrela(9, -38, 4)} fill="#FDE68A" />
          <circle cx="-11" cy="-44" r="1.8" fill="#FDE68A" />
          <circle cx="12" cy="-12" r="2" fill="#FDE68A" />
        </g>
      );
    case "aureola":
      return (
        <g className="vtm-brilha">
          <ellipse cx="0" cy="-20" rx="30" ry="8" fill="none" stroke="#FDE68A" strokeWidth="5" />
          <ellipse cx="0" cy="-20" rx="30" ry="8" fill="none" stroke="#FBBF24" strokeWidth="2" />
        </g>
      );
    // Etapa 313
    case "viking":
      return (
        <g>
          <path d="M-30 6 Q-30 -30 0 -30 Q30 -30 30 6 Z" fill="#9CA3AF" />
          <rect x="-32" y="-2" width="64" height="9" rx="3" fill="#B45309" />
          <path d="M-3 -30 L-3 6 M3 -30 L3 6" stroke="#6B7280" strokeWidth="2" />
          <path d="M-28 -8 Q-52 -14 -48 -42 Q-40 -22 -26 -20 Z" fill="#F5F5F4" stroke="#D6D3D1" strokeWidth="1.2" />
          <path d="M28 -8 Q52 -14 48 -42 Q40 -22 26 -20 Z" fill="#F5F5F4" stroke="#D6D3D1" strokeWidth="1.2" />
        </g>
      );
    case "orelhas":
      return (
        <g>
          <path d="M-30 -2 Q-34 -24 -34 -34 Q-22 -26 -12 -18 Z" fill="#1F2421" />
          <path d="M30 -2 Q34 -24 34 -34 Q22 -26 12 -18 Z" fill="#1F2421" />
          <path d="M-28 -6 Q-30 -20 -30 -26 Q-23 -21 -17 -16 Z" fill="#F9A8D4" />
          <path d="M28 -6 Q30 -20 30 -26 Q23 -21 17 -16 Z" fill="#F9A8D4" />
          <path d="M-30 -2 Q0 -26 30 -2" stroke="#1F2421" strokeWidth="4" fill="none" />
        </g>
      );
    case "sombrero":
      return (
        <g>
          <ellipse cx="0" cy="2" rx="54" ry="10" fill="#E8B04A" stroke="#B7791F" strokeWidth="1.5" />
          <path d="M-20 0 Q-22 -36 0 -38 Q22 -36 20 0 Z" fill="#F0C060" stroke="#B7791F" strokeWidth="1.5" />
          <path d="M-21 -6 Q0 -1 21 -6 L21 -1 Q0 4 -21 -1 Z" fill="#16A34A" />
          {[-40, -24, 24, 40].map((x) => (
            <circle key={x} cx={x} cy={6} r="2.2" fill="#DC2626" />
          ))}
        </g>
      );
    case "capacete":
      return (
        <g>
          <path d="M-32 6 Q-32 -30 0 -32 Q32 -30 32 6 Z" fill="#22C55E" />
          {[-14, 0, 14].map((x) => (
            <path key={x} d={`M${x - 4} -28 Q${x} -12 ${x - 2} 2`} stroke="#15803D" strokeWidth="4" fill="none" strokeLinecap="round" />
          ))}
          <path d="M14 0 Q34 -2 40 6 Q28 8 14 6 Z" fill="#15803D" />
        </g>
      );
    // Etapa 315 — touquinha de dormir (aparece sozinha de madrugada)
    case "touca":
      return (
        <g>
          <path d="M-30 6 Q-30 -20 -4 -26 Q22 -30 40 -8 Q44 0 38 4 Q30 -12 18 -14 Q26 -2 30 6 Z" fill="#6D8BD6" />
          <rect x="-32" y="0" width="64" height="9" rx="4.5" fill="#E0E7FF" />
          <circle cx="40" cy="6" r="6" fill="#E0E7FF" />
          {[[-14, -10], [4, -16], [16, -4]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2" fill="#FDE68A" />
          ))}
        </g>
      );
    // Etapa 316 — eventos
    case "bruxa":
      return (
        <g transform="rotate(-8)">
          <ellipse cx="0" cy="4" rx="44" ry="8" fill="#312E81" />
          <path d="M-24 4 Q-16 -30 4 -50 Q12 -58 22 -52 Q12 -44 14 -30 Q18 -10 24 4 Z" fill="#3730A3" />
          <rect x="-24" y="-6" width="48" height="8" fill="#F97316" />
          <rect x="-5" y="-7" width="10" height="10" rx="1" fill="none" stroke="#FBBF24" strokeWidth="2" />
        </g>
      );
    case "gorroNatal":
      return (
        <g>
          <path d="M-30 4 Q-28 -30 6 -34 Q34 -30 44 -6 L36 -2 Q28 -18 14 -20 Q24 -6 28 4 Z" fill="#DC2626" />
          <rect x="-33" y="-2" width="66" height="11" rx="5.5" fill="#F8FAFC" />
          <circle cx="42" cy="-2" r="7" fill="#F8FAFC" />
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
    case "monoculo":
      return (
        <g>
          <circle cx="18" cy="0" r="12" fill="rgba(255,255,255,0.22)" stroke="#D4A017" strokeWidth="3" />
          <path d="M14 -6 L20 -9" stroke="#fff" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
          <path d="M28 8 Q34 24 26 38" stroke="#D4A017" strokeWidth="1.3" fill="none" strokeDasharray="2 2" />
        </g>
      );
    case "aviador":
      return (
        <g>
          <path d="M-32 -8 L-6 -8 Q-4 10 -18 11 Q-32 10 -32 -8 Z" fill="#78350F" opacity="0.85" stroke="#D4A017" strokeWidth="2" />
          <path d="M32 -8 L6 -8 Q4 10 18 11 Q32 10 32 -8 Z" fill="#78350F" opacity="0.85" stroke="#D4A017" strokeWidth="2" />
          <path d="M-6 -6 Q0 -10 6 -6" stroke="#D4A017" strokeWidth="2" fill="none" />
          <path d="M-27 -4 L-19 -4 M10 -4 L18 -4" stroke="#FDE68A" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
        </g>
      );
    case "mergulho":
      return (
        <g>
          <path d="M-46 0 L-34 0 M34 0 L46 0" stroke="#0EA5E9" strokeWidth="4" strokeLinecap="round" />
          <rect x="-35" y="-13" width="70" height="25" rx="11" fill="rgba(186,230,253,0.35)" stroke="#0284C7" strokeWidth="4" />
          <path d="M-26 -6 L-16 -6" stroke="#fff" strokeWidth="2.5" opacity="0.7" strokeLinecap="round" />
          <path d="M38 6 L42 -30 Q43 -36 49 -34" stroke="#F97316" strokeWidth="5" fill="none" strokeLinecap="round" />
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
    // Etapa 313
    case "nerd":
      return (
        <g fill="rgba(255,255,255,0.15)" stroke="#1F2421" strokeWidth="5">
          <rect x="-31" y="-11" width="25" height="21" rx="4" />
          <rect x="6" y="-11" width="25" height="21" rx="4" />
          <path d="M-6 -3 L6 -3" fill="none" />
          <path d="M-2 -6 L2 -6 L2 0 L-2 0 Z" fill="#FFFFFF" stroke="none" />
        </g>
      );
    case "neon":
      return (
        <g>
          <path d="M-34 -8 L34 -8 L30 8 L4 8 L0 2 L-4 8 L-30 8 Z" fill="#22D3EE" opacity="0.75" stroke="#A855F7" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M-26 -3 L-10 -3" stroke="#fff" strokeWidth="2" opacity="0.7" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

function Roupa({ id }: { id: string }) {
  switch (id) {
    case "cracha":
      return (
        <g>
          <path d="M-24 -18 L-4 10 M24 -18 L4 10" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
          <rect x="-11" y="9" width="22" height="22" rx="3" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
          <rect x="-11" y="9" width="22" height="7" rx="3" fill="#D9A24C" />
          <rect x="-4" y="6.5" width="8" height="4" rx="1" fill="#64748B" />
          <text x="0" y="14.6" textAnchor="middle" fontSize="5" fontWeight="800" fill="#FFFFFF" fontFamily="sans-serif">VT</text>
          <circle cx="0" cy="21.5" r="3.6" fill="#CBD5E1" />
          <rect x="-7" y="26.5" width="14" height="2" rx="1" fill="#94A3B8" />
        </g>
      );
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
    case "lenco":
      return (
        <g>
          <path d="M-30 -6 Q0 2 30 -6 L0 26 Z" fill="#2563EB" />
          {[[-12, 2], [10, 2], [0, 12], [-4, -2]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.8" fill="#fff" />
          ))}
          <path d="M-30 -6 Q0 2 30 -6" stroke="#1D4ED8" strokeWidth="2" fill="none" />
        </g>
      );
    case "havaiano":
      return (
        <g>
          {Array.from({ length: 9 }, (_, i) => {
            const t = (i / 8) * Math.PI;
            const x = -34 * Math.cos(t);
            const y = -4 + 16 * Math.sin(t);
            const cor = ["#F472B6", "#FBBF24", "#FB7185", "#C084FC"][i % 4];
            return (
              <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
                {[0, 72, 144, 216, 288].map((a) => (
                  <ellipse key={a} cx="0" cy="-3.5" rx="2.8" ry="4" fill={cor} transform={`rotate(${a})`} />
                ))}
                <circle r="1.8" fill="#FEF9C3" />
              </g>
            );
          })}
        </g>
      );
    case "faixa":
      return (
        <g>
          <path d="M-38 -34 Q2 -6 34 30" stroke="#DC2626" strokeWidth="11" fill="none" />
          <path d="M-38 -34 Q2 -6 34 30" stroke="#FBBF24" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
          <circle cx="2" cy="-4" r="8.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
          <path d={estrela(2, -4, 5)} fill="#FFF7D6" />
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
    // Etapa 313
    case "ouro":
      return (
        <g>
          <path d="M-30 -6 Q0 22 30 -6" stroke="#FBBF24" strokeWidth="4" fill="none" strokeDasharray="5 2" />
          <circle cx="0" cy="12" r="7" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
          <text x="0" y="15.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#92400E" fontFamily="sans-serif">
            $
          </text>
        </g>
      );
    case "babador":
      return (
        <g>
          <path d="M-22 -6 Q0 2 22 -6 Q22 22 0 26 Q-22 22 -22 -6 Z" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="2" />
          <path d="M-8 10 Q0 16 8 10" stroke="#F472B6" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="-6" cy="4" r="1.6" fill="#F472B6" />
          <circle cx="6" cy="4" r="1.6" fill="#F472B6" />
        </g>
      );
    case "gravataSocial":
      return (
        <g>
          <path d="M-14 -6 L0 2 L14 -6" stroke="#F8FAFC" strokeWidth="6" fill="none" strokeLinejoin="round" />
          <path d="M-5 0 L5 0 L3 6 L-3 6 Z" fill="#1E3A8A" />
          <path d="M-3 6 L3 6 L7 34 L0 40 L-7 34 Z" fill="#1D4ED8" />
          <path d="M-4 14 L5 20 M-5 24 L6 30" stroke="#93C5FD" strokeWidth="1.5" />
        </g>
      );
    // Etapa 316 — eventos
    case "morcego":
      return (
        <g>
          <path d="M0 0 Q-6 -8 -14 -8 Q-12 -4 -16 -2 Q-20 -6 -26 -4 Q-20 2 -22 8 Q-12 4 -6 8 Q-4 4 0 4 Z" fill="#1F2421" />
          <path d="M0 0 Q6 -8 14 -8 Q12 -4 16 -2 Q20 -6 26 -4 Q20 2 22 8 Q12 4 6 8 Q4 4 0 4 Z" fill="#1F2421" />
          <circle cx="0" cy="2" r="4" fill="#7C3AED" />
        </g>
      );
    case "sinos":
      return (
        <g>
          <path d="M-30 -6 Q0 14 30 -6" stroke="#16A34A" strokeWidth="4" fill="none" />
          {[-16, 0, 16].map((x) => (
            <g key={x} transform={`translate(${x} ${x === 0 ? 10 : 5})`}>
              <path d="M-5 4 Q-5 -6 0 -6 Q5 -6 5 4 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
              <circle cx="0" cy="5" r="1.6" fill="#B45309" />
            </g>
          ))}
        </g>
      );
    default:
      return null;
  }
}

function Mao({ id }: { id: string }) {
  switch (id) {
    case "camera":
      return (
        <g transform="rotate(-8)">
          <rect x="-8" y="-14" width="10" height="5" rx="1.5" fill="#4B5563" />
          <rect x="-14" y="-10" width="28" height="18" rx="3" fill="#374151" />
          <path d="M-14 -5 h28" stroke="#1F2937" strokeWidth="0.8" />
          <circle cx="0" cy="-1" r="7" fill="#111827" stroke="#9CA3AF" strokeWidth="2" />
          <circle cx="-2" cy="-3" r="2" fill="#60A5FA" opacity="0.85" />
          <rect x="8" y="-8" width="4" height="2.6" rx="1" fill="#FDE68A" />
        </g>
      );
    case "pincel":
      return (
        <g>
          <g transform="rotate(-28)">
            <rect x="-2" y="-6" width="4" height="26" rx="2" fill="#B45309" />
            <rect x="-2.6" y="-12" width="5.2" height="7" fill="#D1D5DB" />
            <path d="M-2.6 -12 Q-3.2 -22 0 -27 Q3.2 -22 2.6 -12 Z" fill="#8B5CF6" />
          </g>
          <path d="M14 -24 q2 3 0 4 q-2 -1 0 -4 Z" fill="#8B5CF6" className="vtm-lagrima" />
        </g>
      );
    case "cofrinho":
      return (
        <g>
          <circle cx="-1" cy="-21" r="4" fill="#FBBF24" stroke="#D97706" strokeWidth="1" className="vtm-voa" />
          <rect x="-9" y="5" width="4" height="5" rx="1" fill="#F472B6" />
          <rect x="4" y="5" width="4" height="5" rx="1" fill="#F472B6" />
          <ellipse cx="0" cy="-2" rx="15" ry="11" fill="#F9A8D4" />
          <circle cx="11" cy="-4" r="6.5" fill="#F9A8D4" />
          <ellipse cx="16" cy="-3" rx="3" ry="2.4" fill="#F472B6" />
          <circle cx="15.2" cy="-3.2" r="0.6" fill="#9D174D" />
          <circle cx="16.8" cy="-3.2" r="0.6" fill="#9D174D" />
          <circle cx="10.5" cy="-7" r="1.2" fill="#1F2421" />
          <path d="M6 -10 l1.5 -5 l3.5 3.5 Z" fill="#F472B6" />
          <rect x="-6" y="-13.2" width="9" height="2" rx="1" fill="#9D174D" />
          <path d="M-15 -3 q-4 -1 -3 -4" stroke="#F472B6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <ellipse cx="-6" cy="-6" rx="4" ry="2.4" fill="#FFFFFF" opacity="0.4" />
        </g>
      );
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
    case "sorvete":
      return (
        <g>
          <path d="M-8 -6 L8 -6 L0 16 Z" fill="#E8B26A" />
          <path d="M-5 -2 L4 8 M4 -2 L-2 10" stroke="#C98E2C" strokeWidth="1" />
          <circle cx="-4" cy="-10" r="7" fill="#F9A8D4" />
          <circle cx="4" cy="-11" r="7" fill="#FDE68A" />
          <circle cx="0" cy="-18" r="6.5" fill="#A7F3D0" />
          <circle cx="1" cy="-26" r="3" fill="#EF4444" />
        </g>
      );
    case "regador":
      return (
        <g>
          <rect x="-12" y="-12" width="20" height="20" rx="4" fill="#22C55E" />
          <path d="M8 -6 L22 -18" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" />
          <circle cx="23" cy="-19" r="3.5" fill="#16A34A" />
          <path d="M-12 -6 Q-22 -6 -20 4 Q-18 8 -12 6" stroke="#16A34A" strokeWidth="3" fill="none" />
          <path d="M26 -14 l2 5 M30 -16 l3 4 M28 -10 l2 5" stroke="#7DD3FC" strokeWidth="1.8" strokeLinecap="round" className="vtm-vapor" />
        </g>
      );
    case "violao":
      return (
        <g transform="rotate(-35)">
          <rect x="-2.5" y="-46" width="5" height="34" rx="1.5" fill="#7C4A21" />
          <rect x="-4" y="-52" width="8" height="8" rx="2" fill="#5B3416" />
          <circle cx="0" cy="-8" r="10" fill="#D97706" />
          <circle cx="0" cy="8" r="13" fill="#D97706" />
          <circle cx="0" cy="2" r="4" fill="#5B3416" />
          <path d="M-1 -44 L-1 14 M1 -44 L1 14" stroke="#FDE68A" strokeWidth="0.6" />
        </g>
      );
    case "varinha":
      return (
        <g transform="rotate(-25)">
          <rect x="-2" y="-34" width="4" height="40" rx="2" fill="#1F2421" />
          <rect x="-2" y="-34" width="4" height="6" fill="#F8FAFC" />
          <g className="vtm-brilha">
            <path d={estrela(0, -42, 10)} fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.2" />
          </g>
          <circle cx="12" cy="-52" r="1.6" fill="#FDE68A" className="vtm-brilha" />
          <circle cx="-10" cy="-56" r="1.3" fill="#C4B5FD" className="vtm-brilha" style={{ animationDelay: "0.5s" }} />
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
    // Etapa 313
    case "pipoca":
      return (
        <g>
          <path d="M-10 -8 L10 -8 L7 14 L-7 14 Z" fill="#FFFFFF" />
          {[-6, 0, 6].map((x) => (
            <path key={x} d={`M${x - 1.5} -8 L${x * 0.8 - 1} 14`} stroke="#EF4444" strokeWidth="3" />
          ))}
          {[[-7, -12], [-1, -15], [5, -12], [-4, -18], [3, -19], [8, -16]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill={i % 2 ? "#FEF3C7" : "#FFFBEB"} stroke="#FDE68A" strokeWidth="0.6" />
          ))}
        </g>
      );
    case "pirulito":
      return (
        <g>
          <rect x="-1.5" y="-6" width="3" height="22" rx="1.5" fill="#F8FAFC" />
          <circle cx="0" cy="-16" r="12" fill="#F472B6" />
          <path d="M0 -16 m-9 0 a9 9 0 1 1 9 9 a6 6 0 1 1 -6 -6 a3 3 0 1 1 3 3" stroke="#FFFFFF" strokeWidth="2.2" fill="none" />
        </g>
      );
    case "raquete":
      return (
        <g transform="rotate(-25)">
          <rect x="-2" y="0" width="4" height="18" rx="2" fill="#374151" />
          <ellipse cx="0" cy="-14" rx="11" ry="14" fill="none" stroke="#EF4444" strokeWidth="3" />
          <path d="M-8 -20 L8 -20 M-10 -14 L10 -14 M-8 -8 L8 -8 M-5 -26 L5 -26 M-4 -2 L4 -2 M0 -28 L0 0 M-6 -26 L-6 -3 M6 -26 L6 -3" stroke="#F8FAFC" strokeWidth="0.8" />
          <circle cx="16" cy="-30" r="4" fill="#BEF264" />
        </g>
      );
    case "microfone":
      return (
        <g transform="rotate(-15)">
          <path d="M-3 0 L3 0 L2 18 L-2 18 Z" fill="#1F2421" />
          <circle cx="0" cy="-6" r="8" fill="#9CA3AF" />
          <path d="M-6 -10 L6 -2 M-6 -2 L6 -10 M-7 -6 L7 -6" stroke="#6B7280" strokeWidth="0.8" />
          <rect x="-4" y="0" width="8" height="3" fill="#A855F7" />
          <path d="M12 -16 q3 -3 0 -6 M16 -18 q4 -4 0 -8" stroke="#A855F7" strokeWidth="1.5" fill="none" className="vtm-vapor" />
        </g>
      );
    // Etapa 316 — eventos
    case "vassoura":
      return (
        <g transform="rotate(30)">
          <rect x="-2" y="-34" width="4" height="40" rx="2" fill="#8B5A2B" />
          <path d="M-9 6 L9 6 L12 26 L-12 26 Z" fill="#E8B04A" />
          <path d="M-6 10 L-8 25 M0 10 L0 26 M6 10 L8 25" stroke="#B7791F" strokeWidth="1" />
          <rect x="-9" y="4" width="18" height="4" fill="#7C2D12" />
        </g>
      );
    case "bengala":
      return (
        <g>
          <path d="M0 18 L0 -12 Q0 -24 10 -24 Q20 -24 20 -14" stroke="#F8FAFC" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M0 18 L0 -12 Q0 -24 10 -24 Q20 -24 20 -14" stroke="#EF4444" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="4 4" />
        </g>
      );
    default:
      return null;
  }
}

// ---- Etapa 302 — lugares vivos ----

const CEUS: Record<Periodo, [string, string]> = {
  manha: ["#9FD4F5", "#FCE7C8"],
  tarde: ["#6EC1F2", "#CBEBFF"],
  entardecer: ["#7C6BB5", "#F7A97C"],
  noite: ["#0E1738", "#273469"],
};

function Ceu({ periodo, clima, uid }: { periodo: Periodo; clima: Clima; uid: string }) {
  const [a, b] = CEUS[periodo];
  const g = `vtm-ceu-${uid}`;
  const escuro = clima === "chuva" || clima === "cinza";
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${g})`} />
      {periodo === "noite" ? (
        <g>
          {!escuro &&
            [[18, 22], [52, 12], [84, 34], [118, 16], [178, 58], [30, 64], [140, 48], [100, 8]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="1.3" fill="#fff" className="vtm-brilha" style={{ animationDelay: `${i * 0.35}s` }} />
            ))}
          <path d="M156 22 a14 14 0 1 0 12 22 a10 10 0 1 1 -12 -22 Z" fill="#FDF3C4" opacity={escuro ? 0.5 : 1} />
        </g>
      ) : (
        <Sol periodo={periodo} raios={clima === "sol"} apagado={escuro} />
      )}
      {escuro && <rect width="200" height="200" fill="#475569" opacity={clima === "chuva" ? 0.45 : 0.32} />}
      {clima !== "sol" && <Nuvens escuras={escuro} poucas={clima === "limpo"} noite={periodo === "noite"} />}
    </g>
  );
}

function Sol({ periodo, raios, apagado }: { periodo: Periodo; raios: boolean; apagado: boolean }) {
  const [x, y, r, cor] =
    periodo === "manha" ? [40, 56, 12, "#FFE58A"] : periodo === "tarde" ? [156, 34, 14, "#FFE066"] : [166, 98, 17, "#FF9F5A"];
  return (
    <g opacity={apagado ? 0.35 : 1}>
      <circle cx={x} cy={y} r={r * 1.8} fill={cor} opacity="0.25" />
      {raios && (
        <g transform={`translate(${x} ${y})`}>
          <g className="vtm-raios">
            {Array.from({ length: 10 }, (_, i) => (
              <rect key={i} x="-1.5" y={-r - 12} width="3" height="7" rx="1.5" fill={cor} transform={`rotate(${i * 36})`} />
            ))}
          </g>
        </g>
      )}
      <circle cx={x} cy={y} r={r} fill={cor} />
    </g>
  );
}

function Nuvem({ x, y, k, cor }: { x: number; y: number; k: number; cor: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} fill={cor}>
      <ellipse cx="0" cy="0" rx="18" ry="8" />
      <ellipse cx="-9" cy="-5" rx="9" ry="7" />
      <ellipse cx="6" cy="-7" rx="11" ry="9" />
    </g>
  );
}

function Nuvens({ escuras, poucas, noite }: { escuras: boolean; poucas: boolean; noite: boolean }) {
  const cor = escuras ? "#94A3B8" : noite ? "#3B4A7A" : "#FFFFFF";
  return (
    <g opacity={poucas ? 0.75 : 0.95}>
      <g className="vtm-nuvem">
        <Nuvem x={58} y={40} k={1.1} cor={cor} />
      </g>
      {!poucas && (
        <g className="vtm-nuvem" style={{ animationDelay: "-4s", animationDuration: "11s" }}>
          <Nuvem x={132} y={60} k={0.9} cor={cor} />
          {escuras && <Nuvem x={20} y={26} k={0.8} cor={cor} />}
          {escuras && <Nuvem x={170} y={22} k={1} cor={cor} />}
        </g>
      )}
    </g>
  );
}

function Chuva() {
  return (
    <g stroke="#BFDBFE" strokeWidth="1.4" strokeLinecap="round" opacity="0.8">
      {[12, 30, 47, 66, 83, 101, 118, 137, 152, 171, 188].map((x, i) => (
        <line key={x} x1={x} y1="0" x2={x - 3} y2="10" className="vtm-pingo" style={{ animationDelay: `${(i * 0.17) % 1}s` }} />
      ))}
    </g>
  );
}

/** Escurece o chão à noite / no fim da tarde (as luzes vêm depois). */
function Penumbra({ periodo }: { periodo: Periodo }) {
  if (periodo === "noite") return <rect width="200" height="200" fill="#0B1026" opacity="0.38" />;
  if (periodo === "entardecer") return <rect width="200" height="200" fill="#7C2D12" opacity="0.1" />;
  return null;
}

function Luz({ x, y, w, h, acesa }: { x: number; y: number; w: number; h: number; acesa: boolean }) {
  return <rect x={x} y={y} width={w} height={h} rx="1" fill={acesa ? "#FDE68A" : "#BFE3F5"} opacity={acesa ? 1 : 0.85} />;
}

function Fundo({ id, periodo, clima, uid }: { id: string; periodo: Periodo; clima: Clima; uid: string }) {
  const noite = periodo === "noite";
  const acesa = noite || periodo === "entardecer";
  const chuva = clima === "chuva";
  const ceu = <Ceu periodo={periodo} clima={clima} uid={uid} />;

  switch (id) {
    case "quarto":
      return (
        <g>
          <rect width="200" height="200" fill={noite ? "#2A2140" : "#4A3B5E"} />
          <rect y="150" width="200" height="50" fill={noite ? "#3E2F24" : "#5B4636"} />
          {/* janela com o céu de verdade lá fora */}
          <svg x="126" y="30" width="50" height="44" viewBox="40 0 120 106" preserveAspectRatio="xMidYMid slice">
            {ceu}
            {chuva && <Chuva />}
          </svg>
          <rect x="126" y="30" width="50" height="44" rx="4" fill="none" stroke="#E7DCC8" strokeWidth="4" />
          <path d="M151 30 L151 74 M126 52 L176 52" stroke="#E7DCC8" strokeWidth="3" />
          <rect x="22" y="40" width="30" height="38" rx="3" fill="#F2C46D" />
          <path d="M27 70 L33 56 L39 64 L43 58 L48 70 Z" fill="#8FD3A6" />
          {/* abajur: acende de noite */}
          <rect x="62" y="120" width="4" height="30" fill="#7C6A55" />
          <path d="M52 120 L76 120 L70 104 L58 104 Z" fill={acesa ? "#FDE68A" : "#E7DCC8"} />
          {acesa && <circle cx="64" cy="118" r="26" fill="#FDE68A" opacity="0.18" />}
          <ellipse cx="100" cy="182" rx="70" ry="12" fill="#B7A9F0" opacity="0.6" />
        </g>
      );
    case "jardim":
      return (
        <g>
          {ceu}
          <path d="M0 150 Q60 120 120 145 Q170 160 200 140 L200 200 L0 200 Z" fill="#7FC88F" />
          <path d="M0 170 Q80 150 200 172 L200 200 L0 200 Z" fill="#5EA875" />
          {[[24, 160, "#F472B6"], [50, 176, "#FBBF24"], [158, 168, "#F87171"], [182, 182, "#FFFFFF"], [140, 186, "#A78BFA"]].map(([x, y, cor], i) => (
            <g key={i}>
              <path d={`M${x} ${y} l0 8`} stroke="#3F7D55" strokeWidth="1.5" />
              <circle cx={x as number} cy={y as number} r="4" fill={cor as string} />
              <circle cx={x as number} cy={y as number} r="1.5" fill="#FDE68A" />
            </g>
          ))}
          <Penumbra periodo={periodo} />
          {noite
            ? [[30, 120], [70, 136], [150, 118], [176, 140], [110, 128]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="1.8" fill="#FDE047" className="vtm-brilha" style={{ animationDelay: `${i * 0.4}s` }} />
              ))
            : !chuva && (
                <g className="vtm-voa">
                  <path d="M150 110 q4 -6 8 0 q4 -6 8 0" stroke="#334155" strokeWidth="1.6" fill="none" />
                </g>
              )}
          {chuva && <Chuva />}
        </g>
      );
    case "praia":
      return (
        <g>
          {ceu}
          <rect y="112" width="200" height="40" fill={noite ? "#1E3A8A" : periodo === "entardecer" ? "#5B7FD6" : "#3B9BEA"} />
          {noite && <rect x="150" y="114" width="12" height="30" fill="#FDF3C4" opacity="0.25" />}
          <g className="vtm-onda">
            <path d="M-20 122 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#BFDBFE" strokeWidth="2" fill="none" />
            <path d="M-10 136 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#DBEAFE" strokeWidth="1.5" fill="none" opacity="0.7" />
          </g>
          <path d="M0 150 Q100 142 200 150 L200 200 L0 200 Z" fill="#F3D9A4" />
          {/* coqueiro */}
          <path d="M28 196 Q24 160 34 128" stroke="#8B5A2B" strokeWidth="5" fill="none" strokeLinecap="round" />
          <g transform="translate(34 128)" className="vtm-broto">
            <path d="M0 0 Q-18 -10 -32 2 Q-16 -2 0 0 Z M0 0 Q16 -14 32 -2 Q16 -4 0 0 Z M0 0 Q-6 -20 -20 -24 Q-6 -12 0 0 Z M0 0 Q8 -20 22 -22 Q8 -10 0 0 Z" fill="#3F9D5A" />
          </g>
          <Penumbra periodo={periodo} />
          {chuva && <Chuva />}
        </g>
      );
    case "noite": // acampamento
      return (
        <g>
          {ceu}
          <path d="M0 140 L14 112 L28 140 Z M20 140 L36 104 L52 140 Z M150 140 L166 108 L182 140 Z M172 140 L186 116 L200 140 Z" fill="#1E4D3A" />
          <rect y="140" width="200" height="60" fill="#3F6B3F" />
          {/* barraca */}
          <path d="M120 176 L148 132 L176 176 Z" fill="#E9875B" />
          <path d="M148 132 L141 176 L155 176 Z" fill="#9A4A26" />
          <Penumbra periodo={periodo} />
          {/* fogueira sempre acesa */}
          <g transform="translate(50 178)">
            <path d="M-12 4 L12 -2 M-12 -2 L12 4" stroke="#7C4A21" strokeWidth="4" strokeLinecap="round" />
            {acesa && <circle cx="0" cy="-6" r="30" fill="#F59E0B" opacity="0.18" />}
            <g className="vtm-fogo">
              <path d="M0 -24 Q10 -10 6 0 L-6 0 Q-10 -10 0 -24 Z" fill="#F97316" />
              <path d="M0 -14 Q5 -6 3 0 L-3 0 Q-5 -6 0 -14 Z" fill="#FDE047" />
            </g>
          </g>
          {chuva && <Chuva />}
        </g>
      );
    case "espaco":
      return (
        <g>
          <rect width="200" height="200" fill="#0B0B1E" />
          <circle cx="40" cy="44" r="18" fill="#9C8FD9" />
          <ellipse cx="40" cy="44" rx="30" ry="6" fill="none" stroke="#F2C46D" strokeWidth="3" transform="rotate(-18 40 44)" />
          <circle cx="168" cy="150" r="10" fill="#F87171" />
          <g className="vtm-voa" style={{ animationDuration: "5s" }}>
            <path d="M150 50 l14 -6 l-4 10 Z" fill="#E5E7EB" />
            <path d="M150 50 l-6 2" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
          </g>
          {[[90, 20], [120, 60], [180, 30], [20, 120], [70, 180], [150, 100], [110, 150], [10, 80]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.4" fill="#fff" className="vtm-brilha" style={{ animationDelay: `${i * 0.25}s` }} />
          ))}
        </g>
      );
    case "montanha":
      return (
        <g>
          {ceu}
          <path d="M-10 160 L50 70 L95 130 L130 80 L210 160 Z" fill={noite ? "#3B4663" : "#7C8DA8"} />
          <path d="M50 70 L38 88 L46 86 L52 94 L60 84 Z M130 80 L120 94 L128 92 L134 100 L141 92 Z" fill="#F8FAFC" />
          <path d="M0 150 Q60 130 120 150 Q170 165 200 148 L200 200 L0 200 Z" fill="#6FBF85" />
          <path d="M0 176 Q100 160 200 178 L200 200 L0 200 Z" fill="#4E9E66" />
          <path d="M160 140 l8 -20 l8 20 Z M176 146 l7 -16 l7 16 Z" fill="#2F6B45" />
          <Penumbra periodo={periodo} />
          {chuva && <Chuva />}
        </g>
      );
    case "neve":
      return (
        <g>
          {ceu}
          <path d="M0 150 Q100 132 200 150 L200 200 L0 200 Z" fill="#F1F5F9" />
          <path d="M150 150 l10 -34 l10 34 Z" fill="#2F6B45" />
          <path d="M146 126 l14 -26 l14 26 Z" fill="#3E8357" />
          <path d="M150 104 Q160 98 170 104" stroke="#fff" strokeWidth="3" fill="none" />
          {/* bonequinho de neve */}
          <circle cx="34" cy="166" r="12" fill="#fff" stroke="#E2E8F0" />
          <circle cx="34" cy="148" r="8" fill="#fff" stroke="#E2E8F0" />
          <path d="M34 148 l7 2 l-7 1 Z" fill="#F97316" />
          <circle cx="31" cy="146" r="1" fill="#1F2421" />
          <circle cx="37" cy="146" r="1" fill="#1F2421" />
          <Penumbra periodo={periodo} />
          <g fill="#fff">
            {[14, 38, 62, 88, 112, 136, 160, 184].map((x, i) => (
              <circle key={x} cx={x} cy="0" r={i % 2 ? 1.6 : 2.2} className="vtm-floco" style={{ animationDelay: `${(i * 0.45) % 3}s` }} />
            ))}
          </g>
        </g>
      );
    case "cidade":
      return (
        <g>
          {ceu}
          {[[0, 90, 30], [28, 70, 26], [52, 100, 22], [72, 60, 30], [100, 86, 24], [122, 50, 28], [148, 94, 26], [172, 74, 28]].map(([x, y, w], i) => (
            <rect key={i} x={x} y={y} width={w} height={200 - y} fill={noite ? (i % 2 ? "#312E81" : "#3730A3") : i % 2 ? "#64748B" : "#7C8BA1"} />
          ))}
          <rect y="168" width="200" height="32" fill="#1F2937" />
          <path d="M0 184 L200 184" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.6" />
          <Penumbra periodo={periodo} />
          {[[0, 90, 30], [28, 70, 26], [52, 100, 22], [72, 60, 30], [100, 86, 24], [122, 50, 28], [148, 94, 26], [172, 74, 28]].map(([x, y, w], i) => (
            <g key={i}>
              {Array.from({ length: 6 }, (_, j) => (
                <Luz key={j} x={x + 5 + (j % 2) * (w / 2 - 2)} y={y + 8 + Math.floor(j / 2) * 14} w={5} h={6} acesa={acesa && (i + j) % 3 !== 0} />
              ))}
            </g>
          ))}
          {chuva && <Chuva />}
        </g>
      );
    case "ceuarco":
      return (
        <g>
          {ceu}
          <g opacity={noite ? 0.35 : 0.85}>
            {["#F87171", "#FB923C", "#FDE047", "#4ADE80", "#60A5FA", "#A78BFA"].map((cor, i) => (
              <path key={cor} d={`M${10 + i * 8} 170 A ${90 - i * 8} ${90 - i * 8} 0 0 1 ${190 - i * 8} 170`} stroke={cor} strokeWidth="8" fill="none" />
            ))}
          </g>
          <ellipse cx="34" cy="168" rx="30" ry="14" fill="#fff" />
          <ellipse cx="166" cy="168" rx="30" ry="14" fill="#fff" />
          <rect y="176" width="200" height="24" fill="#BBF7D0" />
          <Penumbra periodo={periodo} />
          {chuva && <Chuva />}
        </g>
      );
    case "casinha":
    default:
      return (
        <g>
          {ceu}
          <path d="M0 152 Q100 136 200 152 L200 200 L0 200 Z" fill="#8FCB8F" />
          <path d="M0 176 Q100 166 200 178 L200 200 L0 200 Z" fill="#6DB06D" />
          {/* casinha */}
          <rect x="14" y="112" width="46" height="44" fill="#F2E3C6" />
          <path d="M8 114 L37 88 L66 114 Z" fill="#D9734E" />
          <rect x="48" y="92" width="7" height="14" fill="#B65A3B" />
          <rect x="31" y="132" width="12" height="24" rx="2" fill="#9A6B47" />
          {/* cerquinha */}
          {[128, 140, 152, 164, 176, 188].map((x) => (
            <path key={x} d={`M${x} 168 L${x} 152 L${x + 3} 148 L${x + 6} 152 L${x + 6} 168 Z`} fill="#FFFFFF" opacity="0.9" />
          ))}
          <rect x="124" y="156" width="76" height="3" fill="#FFFFFF" opacity="0.9" />
          <Penumbra periodo={periodo} />
          <Luz x={18} y={120} w={10} h={9} acesa={acesa} />
          <Luz x={46} y={120} w={10} h={9} acesa={acesa} />
          {(periodo === "manha" || noite) && (
            <g fill="#E5E7EB" opacity="0.8">
              <circle cx="51" cy="86" r="3" className="vtm-fumaca" />
              <circle cx="53" cy="86" r="4" className="vtm-fumaca" style={{ animationDelay: "1s" }} />
            </g>
          )}
          {chuva && <Chuva />}
        </g>
      );
  }
}

/** Etapa 301 — amiguinhos que ficam do lado (origem no chão). */
function Amigo({ id }: { id: string }) {
  switch (id) {
    case "gatinho":
      return (
        <g className="vtm-gingar">
          <ellipse cx="0" cy="-1" rx="13" ry="2.5" fill="#000" opacity="0.15" />
          <path d="M9 -6 Q22 -9 17 -24" stroke="#F59E0B" strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="2" cy="-9" rx="11" ry="8" fill="#FBBF24" />
          <path d="M-1 -15 q2 3 0 6 M5 -16 q2 3 0 6" stroke="#D97706" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <ellipse cx="-4" cy="-1.8" rx="3" ry="1.8" fill="#FDE68A" />
          <ellipse cx="6" cy="-1.8" rx="3" ry="1.8" fill="#FDE68A" />
          <path d="M-13 -24 L-12 -33 L-6 -28 Z M-4 -28 L1 -33 L1 -23 Z" fill="#FBBF24" />
          <path d="M-11.5 -26 L-11.2 -30.5 L-8.4 -28 Z M-2.5 -28 L-0.2 -30.5 L-0.4 -26 Z" fill="#F9A8D4" />
          <circle cx="-6" cy="-21" r="8" fill="#FBBF24" />
          <path d="M-9 -27 q1 2 0 3 M-5 -28 q1 2 0 3" stroke="#D97706" strokeWidth="1.2" fill="none" />
          <ellipse cx="-9" cy="-21.5" rx="1.3" ry="1.7" fill="#1F2421" />
          <ellipse cx="-3.5" cy="-21.5" rx="1.3" ry="1.7" fill="#1F2421" />
          <circle cx="-9.4" cy="-22.2" r="0.45" fill="#fff" />
          <circle cx="-3.9" cy="-22.2" r="0.45" fill="#fff" />
          <path d="M-7.6 -18.6 l1.3 1.1 l1.3 -1.1 Z" fill="#F472B6" />
          <path d="M-12 -18 l-6 -1 M-12 -17 l-6 1 M-1 -18 l6 -1 M-1 -17 l6 1" stroke="#92400E" strokeWidth="0.5" opacity="0.6" />
        </g>
      );
    case "coelhinho":
      return (
        <g className="vtm-gingar" style={{ animationDuration: "1.4s" }}>
          <ellipse cx="0" cy="-1" rx="12" ry="2.5" fill="#000" opacity="0.15" />
          <circle cx="9" cy="-8" r="3.6" fill="#FFFFFF" stroke="#E2E8F0" />
          <ellipse cx="1" cy="-9" rx="10" ry="8.5" fill="#F8FAFC" stroke="#E2E8F0" />
          <g transform="rotate(-10 -7 -28)">
            <ellipse cx="-7" cy="-31" rx="2.8" ry="8.5" fill="#F8FAFC" stroke="#E2E8F0" />
            <ellipse cx="-7" cy="-30.5" rx="1.3" ry="6" fill="#F9A8D4" />
          </g>
          <g transform="rotate(14 -1 -28)">
            <ellipse cx="-1" cy="-31" rx="2.8" ry="8.5" fill="#F8FAFC" stroke="#E2E8F0" />
            <ellipse cx="-1" cy="-30.5" rx="1.3" ry="6" fill="#F9A8D4" />
          </g>
          <circle cx="-4" cy="-20" r="7" fill="#F8FAFC" stroke="#E2E8F0" />
          <circle cx="-7" cy="-21" r="1.3" fill="#1F2421" />
          <circle cx="-1.6" cy="-21" r="1.3" fill="#1F2421" />
          <ellipse cx="-4.3" cy="-17.6" rx="1.2" ry="0.9" fill="#F472B6" />
          <circle cx="-9" cy="-17.5" r="1.5" fill="#FBCFE8" opacity="0.8" />
          <circle cx="0.4" cy="-17.5" r="1.5" fill="#FBCFE8" opacity="0.8" />
        </g>
      );
    case "passarinho":
      return (
        <g className="vtm-voa">
          <g transform="translate(0 -46)">
            <ellipse cx="0" cy="0" rx="11" ry="9" fill="#60A5FA" />
            <ellipse cx="2" cy="3" rx="6" ry="4.5" fill="#DBEAFE" />
            <path d="M-4 -2 Q-14 -12 -16 0 Z" fill="#3B82F6" className="vtm-asa" />
            <path d="M10 -3 L17 -1 L10 1 Z" fill="#F59E0B" />
            <circle cx="5" cy="-3" r="1.8" fill="#1F2421" />
            <path d="M-11 2 L-17 6 L-11 5 Z" fill="#3B82F6" />
          </g>
        </g>
      );
    case "borboleta":
      return (
        <g className="vtm-voa" style={{ animationDuration: "2.2s" }}>
          <g transform="translate(0 -56)">
            <g className="vtm-asa">
              <ellipse cx="-7" cy="-5" rx="8" ry="10" fill="#F472B6" />
              <ellipse cx="-6" cy="7" rx="6" ry="6" fill="#C084FC" />
              <ellipse cx="7" cy="-5" rx="8" ry="10" fill="#F472B6" />
              <ellipse cx="6" cy="7" rx="6" ry="6" fill="#C084FC" />
              <circle cx="-7" cy="-6" r="2.5" fill="#FDE68A" />
              <circle cx="7" cy="-6" r="2.5" fill="#FDE68A" />
            </g>
            <rect x="-1.5" y="-10" width="3" height="20" rx="1.5" fill="#1F2421" />
            <path d="M0 -10 Q-4 -18 -7 -18 M0 -10 Q4 -18 7 -18" stroke="#1F2421" strokeWidth="1" fill="none" />
          </g>
        </g>
      );
    case "patinho":
      return (
        <g className="vtm-gingar">
          <ellipse cx="0" cy="-1" rx="12" ry="2.5" fill="#000" opacity="0.15" />
          <ellipse cx="0" cy="-10" rx="11" ry="9" fill="#FDE047" />
          <circle cx="6" cy="-22" r="7" fill="#FDE047" />
          <path d="M12 -22 L19 -20 L12 -18 Z" fill="#F97316" />
          <circle cx="8" cy="-24" r="1.5" fill="#1F2421" />
          <path d="M-6 -12 Q0 -8 4 -13" stroke="#EAB308" strokeWidth="2" fill="none" />
          <path d="M-11 -12 L-16 -15 L-12 -8 Z" fill="#FDE047" />
        </g>
      );
    case "caracol":
      return (
        <g>
          <path d="M-14 -2 Q-14 -6 -6 -6 L16 -6 Q22 -6 22 -12 L22 -16" stroke="#A3E635" strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="22" cy="-19" r="1.3" fill="#1F2421" />
          <path d="M20 -18 L18 -25 M24 -18 L26 -25" stroke="#65A30D" strokeWidth="1.3" />
          <circle cx="2" cy="-16" r="11" fill="#D97706" />
          <path d="M2 -16 m0 -7 a7 7 0 1 1 -6 10 a4.5 4.5 0 1 1 5 -6" stroke="#92400E" strokeWidth="2" fill="none" />
        </g>
      );
    case "estrelinha":
      return (
        <g className="vtm-voa" style={{ animationDuration: "3s" }}>
          <g transform="translate(0 -52)">
            <circle r="16" fill="#FDE68A" opacity="0.25" className="vtm-aura" />
            <path d={estrela(0, 0, 13)} fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="-3" cy="0" r="1.3" fill="#1F2421" />
            <circle cx="3" cy="0" r="1.3" fill="#1F2421" />
            <path d="M-2 3 Q0 5 2 3" stroke="#1F2421" strokeWidth="1" fill="none" />
          </g>
        </g>
      );
    // Etapa 313
    case "joaninha":
      return (
        <g className="vtm-gingar">
          <ellipse cx="0" cy="-1" rx="10" ry="2" fill="#000" opacity="0.15" />
          <path d="M-10 -8 A10 10 0 0 1 10 -8 L10 -6 L-10 -6 Z" fill="#EF4444" />
          <path d="M0 -18 L0 -6" stroke="#1F2421" strokeWidth="1.4" />
          {[[-5, -12], [5, -12], [-6, -8], [6, -8]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.8" fill="#1F2421" />
          ))}
          <circle cx="10" cy="-9" r="4" fill="#1F2421" />
          <circle cx="11.5" cy="-10" r="1" fill="#fff" />
        </g>
      );
    case "abelha":
      return (
        <g className="vtm-voa" style={{ animationDuration: "1.6s" }}>
          <g transform="translate(0 -50)">
            <ellipse cx="-3" cy="-9" rx="6" ry="8" fill="#E0F2FE" opacity="0.85" className="vtm-asa" />
            <ellipse cx="4" cy="-9" rx="6" ry="8" fill="#E0F2FE" opacity="0.85" className="vtm-asa" />
            <ellipse cx="0" cy="0" rx="11" ry="8" fill="#FACC15" />
            <path d="M-4 -7 L-4 7 M3 -7.5 L3 7.5" stroke="#1F2421" strokeWidth="3" />
            <circle cx="8" cy="-2" r="1.6" fill="#1F2421" />
            <path d="M-11 0 L-15 1 L-11 2 Z" fill="#1F2421" />
          </g>
        </g>
      );
    case "fantasma":
      return (
        <g className="vtm-voa" style={{ animationDuration: "3s" }}>
          <g transform="translate(0 -52)" opacity="0.92">
            <path d="M-12 12 L-12 -2 Q-12 -16 0 -16 Q12 -16 12 -2 L12 12 L8 8 L4 12 L0 8 L-4 12 L-8 8 Z" fill="#F8FAFC" />
            <ellipse cx="-4" cy="-4" rx="2" ry="3" fill="#1F2421" />
            <ellipse cx="4" cy="-4" rx="2" ry="3" fill="#1F2421" />
            <ellipse cx="0" cy="3" rx="2.5" ry="2" fill="#1F2421" />
          </g>
        </g>
      );
    case "dragao":
      return (
        <g className="vtm-gingar">
          <ellipse cx="0" cy="-1" rx="15" ry="3" fill="#000" opacity="0.15" />
          <path d="M-14 -10 Q-26 -14 -24 -2 Q-18 -6 -12 -4 Z" fill="#16A34A" />
          <ellipse cx="0" cy="-11" rx="13" ry="10" fill="#22C55E" />
          <ellipse cx="2" cy="-7" rx="7" ry="5" fill="#BBF7D0" />
          <path d="M-4 -20 Q-14 -36 -2 -32 Q2 -26 0 -20 Z" fill="#4ADE80" className="vtm-asa" />
          <circle cx="9" cy="-24" r="7.5" fill="#22C55E" />
          <path d="M5 -31 L4 -36 L8 -31 M11 -31 L12 -36 L14 -30" fill="#FBBF24" stroke="#FBBF24" strokeWidth="1" />
          <circle cx="11.5" cy="-25" r="1.6" fill="#1F2421" />
          <path d="M16 -22 q4 -1 6 -4" stroke="#F97316" strokeWidth="2" fill="none" className="vtm-vapor" />
        </g>
      );
    // Etapa 316 — prêmios de evento
    case "abobora":
      return (
        <g className="vtm-gingar">
          <ellipse cx="0" cy="-1" rx="14" ry="3" fill="#000" opacity="0.15" />
          <ellipse cx="-6" cy="-12" rx="8" ry="11" fill="#EA580C" />
          <ellipse cx="6" cy="-12" rx="8" ry="11" fill="#EA580C" />
          <ellipse cx="0" cy="-12" rx="8" ry="12" fill="#F97316" />
          <path d="M0 -24 q2 -6 6 -7" stroke="#15803D" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M-8 -15 l3 -4 l3 4 Z M2 -15 l3 -4 l3 4 Z" fill="#FDE047" />
          <path d="M-8 -8 Q0 -2 8 -8 L5 -6 L2 -8 L0 -5 L-2 -8 L-5 -6 Z" fill="#FDE047" />
        </g>
      );
    case "rena":
      return (
        <g className="vtm-gingar">
          <ellipse cx="0" cy="-1" rx="14" ry="3" fill="#000" opacity="0.15" />
          <rect x="-8" y="-10" width="3" height="9" fill="#92400E" />
          <rect x="5" y="-10" width="3" height="9" fill="#92400E" />
          <ellipse cx="0" cy="-12" rx="11" ry="7" fill="#B45309" />
          <circle cx="9" cy="-22" r="6" fill="#B45309" />
          <path d="M6 -27 l-2 -7 l-3 2 M6 -27 l-1 -5 M12 -27 l2 -7 l3 2 M12 -27 l1 -5" stroke="#78350F" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <circle cx="15" cy="-21" r="2.6" fill="#EF4444" />
          <circle cx="10" cy="-23" r="1.2" fill="#1F2421" />
          <path d="M-6 -6 Q0 -2 6 -6" stroke="#16A34A" strokeWidth="2" fill="none" />
        </g>
      );
    default:
      return null;
  }
}

// ---- Etapa 304 — atmosfera: neblina no horizonte, raios de luz e vinheta ----

const NEBLINA: Record<Periodo, [string, number]> = {
  manha: ["#FFF3DD", 0.32],
  tarde: ["#E8F6FF", 0.22],
  entardecer: ["#FFC9A0", 0.34],
  noite: ["#3A4A8A", 0.16],
};

function Atmosfera({ lugar, periodo, clima, uid }: { lugar: string; periodo: Periodo; clima: Clima; uid: string }) {
  const [cor, forca] = NEBLINA[periodo];
  const ceuAberto = lugar !== "quarto" && lugar !== "espaco";
  const raios = ceuAberto && periodo !== "noite" && (clima === "sol" || clima === "limpo");
  const sol = periodo === "manha" ? [40, 56] : periodo === "tarde" ? [156, 34] : [166, 98];
  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id={`vtm-neblina-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.42" stopColor={cor} stopOpacity="0" />
          <stop offset="0.7" stopColor={cor} stopOpacity={forca} />
          <stop offset="0.92" stopColor={cor} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`vtm-vinheta-${uid}`} cx="50%" cy="45%" r="72%">
          <stop offset="0.62" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={periodo === "noite" ? 0.45 : 0.28} />
        </radialGradient>
        {/* chão: luz onde ele pisa e primeiro plano mais escuro (profundidade) */}
        <radialGradient id={`vtm-pisa-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={periodo === "noite" ? "#9DB4FF" : "#FFF6DA"} stopOpacity={periodo === "noite" ? 0.12 : 0.3} />
          <stop offset="1" stopColor="#FFF6DA" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`vtm-frente-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.82" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={`vtm-raio-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFBEA" stopOpacity="0.38" />
          <stop offset="1" stopColor="#FFFBEA" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ceuAberto && lugar !== "espaco" && <rect width="200" height="200" fill={`url(#vtm-neblina-${uid})`} />}
      {raios && (
        <g className="vtm-raio-luz" style={{ transformOrigin: `${sol[0]}px ${sol[1]}px` }}>
          {[-26, -8, 12].map((a, i) => (
            <path
              key={a}
              d={`M${sol[0]} ${sol[1]} L${sol[0] + Math.cos(((a + (sol[0] > 100 ? 110 : 40)) * Math.PI) / 180) * 260} ${sol[1] + Math.sin(((a + (sol[0] > 100 ? 110 : 40)) * Math.PI) / 180) * 260} L${sol[0] + Math.cos(((a + 7 + (sol[0] > 100 ? 110 : 40)) * Math.PI) / 180) * 260} ${sol[1] + Math.sin(((a + 7 + (sol[0] > 100 ? 110 : 40)) * Math.PI) / 180) * 260} Z`}
              fill={`url(#vtm-raio-${uid})`}
              opacity={0.55 - i * 0.12}
            />
          ))}
        </g>
      )}
      {/* luz entrando pela janela do quarto */}
      {lugar === "quarto" && periodo !== "noite" && <path d="M128 72 L176 72 L150 196 L64 196 Z" fill="#FFF3C4" opacity="0.12" />}
      {lugar !== "espaco" && <ellipse cx="100" cy="176" rx="80" ry="20" fill={`url(#vtm-pisa-${uid})`} />}
      <rect width="200" height="200" fill={`url(#vtm-frente-${uid})`} />
      <rect width="200" height="200" fill={`url(#vtm-vinheta-${uid})`} />
    </g>
  );
}
