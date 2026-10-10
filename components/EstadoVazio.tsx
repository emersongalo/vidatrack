import Link from "next/link";

// Etapa 230 — um jeito só de dizer "não tem nada aqui ainda" em todo o app
// Etapa 248 — ilustração com brilhinhos e versão compacta pra cartões.
const TOM = {
  habito: { fundo: "radial-gradient(circle at 35% 30%, #A8D8B6, #7FB894 60%, #5E9A75)", brilho: "#7FB894" },
  financa: { fundo: "radial-gradient(circle at 35% 30%, #F6D58B, #E8B04B 60%, #C98E2C)", brilho: "#E8B04B" },
  nota: { fundo: "radial-gradient(circle at 35% 30%, #C9C0F2, #9C8FD9 60%, #7B6EC0)", brilho: "#9C8FD9" },
  neutro: { fundo: "radial-gradient(circle at 35% 30%, rgb(var(--c-ink-400) / 0.45), rgb(var(--c-ink-400) / 0.2))", brilho: "rgb(var(--c-ink-400))" },
} as const;

export type TomVazio = keyof typeof TOM;

// Etapa 282 — ilustrações próprias (SVG) pra cada área. O emoji da
// tela vira um selinho flutuando ao lado do desenho.
const COR_AREA: Record<TomVazio, string> = {
  habito: "rgb(var(--c-habito))",
  financa: "rgb(var(--c-financa))",
  nota: "rgb(var(--c-nota))",
  neutro: "rgb(var(--c-ink-400))",
};

function Desenho({ tom }: { tom: TomVazio }) {
  const c = COR_AREA[tom];
  const suave = { fill: c, opacity: 0.18 } as const;
  const cheio = { fill: c } as const;
  const traco = { stroke: c, strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;
  if (tom === "habito")
    // vasinho com um broto que balança
    return (
      <>
        <circle cx="60" cy="52" r="40" style={suave} />
        <g className="origin-[60px_70px] animate-balancar">
          <path d="M60 70 V40" style={traco} />
          <path d="M60 52 C48 50 42 42 44 32 C54 32 60 40 60 52 Z" style={cheio} />
          <path d="M60 46 C70 44 78 36 76 26 C66 26 60 34 60 46 Z" style={cheio} opacity={0.75} />
        </g>
        <path d="M40 70 H80 L75 96 H45 Z" style={cheio} opacity={0.9} />
        <rect x="37" y="66" width="46" height="8" rx="3" style={cheio} />
      </>
    );
  if (tom === "financa")
    // potinho de moedas
    return (
      <>
        <circle cx="60" cy="52" r="40" style={suave} />
        <rect x="38" y="44" width="44" height="52" rx="10" style={traco} />
        <rect x="42" y="38" width="36" height="8" rx="3" style={cheio} opacity={0.6} />
        <ellipse cx="60" cy="84" rx="14" ry="4" style={cheio} opacity={0.5} />
        <ellipse cx="60" cy="78" rx="14" ry="4" style={cheio} opacity={0.7} />
        <ellipse cx="60" cy="72" rx="14" ry="4" style={cheio} />
        <g className="animate-boiar">
          <circle cx="60" cy="22" r="9" style={cheio} />
          <path d="M60 17 V27" stroke="#0F1013" strokeWidth="2.5" strokeLinecap="round" opacity={0.45} />
        </g>
      </>
    );
  if (tom === "nota")
    // prancheta com a listinha
    return (
      <>
        <circle cx="60" cy="52" r="40" style={suave} />
        <rect x="36" y="22" width="48" height="70" rx="8" style={traco} />
        <rect x="49" y="17" width="22" height="10" rx="4" style={cheio} />
        <path d="M45 44 l4 4 l7 -8" style={traco} />
        <path d="M62 45 H76" style={traco} opacity={0.6} />
        <path d="M45 60 l4 4 l7 -8" style={traco} />
        <path d="M62 61 H76" style={traco} opacity={0.6} />
        <circle cx="50" cy="77" r="4" style={traco} opacity={0.6} />
        <path d="M62 77 H72" style={traco} opacity={0.35} />
      </>
    );
  // neutro: nuvem com lua
  return (
    <>
      <circle cx="60" cy="52" r="40" style={suave} />
      <path d="M74 22 a14 14 0 1 0 12 20 a11 11 0 1 1 -12 -20 Z" style={cheio} opacity={0.7} />
      <g className="animate-boiar">
        <path d="M36 78 a12 12 0 0 1 4 -23 a16 16 0 0 1 30 -4 a12 12 0 0 1 12 27 Z" style={cheio} opacity={0.85} />
      </g>
    </>
  );
}

function Ilustracao({ emoji, tom, pequeno }: { emoji: string; tom: TomVazio; pequeno?: boolean }) {
  const tam = pequeno ? 72 : 112;
  return (
    <div className="relative mb-4" style={{ width: tam + 24, height: tam }} aria-hidden>
      {/* sombra no chão */}
      <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-2 rounded-full bg-black/20 blur-[2px]" style={{ width: tam * 0.5 }} />
      <svg viewBox="0 0 120 104" className="absolute left-3 top-0" style={{ width: tam, height: tam }}>
        <Desenho tom={tom} />
      </svg>
      <span
        className="absolute right-0 top-1 rounded-full bg-base-900 border border-base-600 flex items-center justify-center animate-boiar shadow-lg shadow-black/20"
        style={{ width: tam * 0.36, height: tam * 0.36, fontSize: tam * 0.2, animationDelay: "0.6s" }}
      >
        {emoji}
      </span>
      {/* brilhinhos */}
      {[
        [0, tam * 0.2, 6, 0],
        [tam * 0.18, tam * 0.85, 4, 1.4],
        [tam + 14, tam * 0.7, 5, 2.1],
      ].map(([x, y, r, atraso], i) => (
        <span
          key={i}
          className="absolute rounded-full animate-cintilar"
          style={{ left: x, top: y, width: r, height: r, background: COR_AREA[tom], animationDelay: `${atraso}s` }}
        />
      ))}
    </div>
  );
}

export function EstadoVazio({
  emoji,
  titulo,
  texto,
  acao,
  tom = "neutro",
  compacto = false,
  className = "",
}: {
  emoji: string;
  titulo: string;
  texto?: string;
  acao?: { rotulo: string; href: string };
  tom?: TomVazio;
  /** dentro de um cartão: sem borda, menor */
  compacto?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`animate-surgir flex flex-col items-center text-center ${
        compacto ? "py-6" : "bg-base-800 border border-dashed border-base-600 rounded-3xl px-6 py-10 mb-6"
      } ${className}`}
    >
      <Ilustracao emoji={emoji} tom={tom} pequeno={compacto} />
      <p className={compacto ? "text-base font-semibold" : "text-lg font-semibold"}>{titulo}</p>
      {texto && <p className={`text-ink-400 mt-1 max-w-xs ${compacto ? "text-sm" : "text-base"}`}>{texto}</p>}
      {acao && (
        <Link
          href={acao.href}
          className={`mt-5 rounded-2xl px-5 py-3 text-base font-semibold hover:opacity-90 transition ${
            tom === "habito" ? "bg-habito text-base-900" : tom === "financa" ? "bg-financa text-base-900" : "bg-ink-100 text-base-900"
          }`}
        >
          {acao.rotulo}
        </Link>
      )}
    </div>
  );
}
