import Link from "next/link";

// Etapa 230 — um jeito só de dizer "não tem nada aqui ainda" em todo o app
// Etapa 248 — ilustração: o emoji flutua num círculo colorido com
// brilhinhos em volta, e tem uma versão compacta pra dentro de cartões.
const TOM = {
  habito: { fundo: "radial-gradient(circle at 35% 30%, #A8D8B6, #7FB894 60%, #5E9A75)", brilho: "#7FB894" },
  financa: { fundo: "radial-gradient(circle at 35% 30%, #F6D58B, #E8B04B 60%, #C98E2C)", brilho: "#E8B04B" },
  nota: { fundo: "radial-gradient(circle at 35% 30%, #C9C0F2, #9C8FD9 60%, #7B6EC0)", brilho: "#9C8FD9" },
  neutro: { fundo: "radial-gradient(circle at 35% 30%, rgb(var(--c-ink-400) / 0.45), rgb(var(--c-ink-400) / 0.2))", brilho: "rgb(var(--c-ink-400))" },
} as const;

export type TomVazio = keyof typeof TOM;

function Ilustracao({ emoji, tom, pequeno }: { emoji: string; tom: TomVazio; pequeno?: boolean }) {
  const t = TOM[tom];
  const tam = pequeno ? 64 : 96;
  return (
    <div className="relative mb-4" style={{ width: tam + 32, height: tam + 16 }} aria-hidden>
      {/* sombra no chão */}
      <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-2.5 rounded-full bg-black/20 blur-[2px]" style={{ width: tam * 0.6 }} />
      <span className="absolute left-4 top-0 rounded-full opacity-30" style={{ width: tam, height: tam, background: t.fundo }} />
      <span className="absolute left-4 top-0 flex items-center justify-center animate-boiar" style={{ width: tam, height: tam, fontSize: tam * 0.48 }}>
        {emoji}
      </span>
      {/* brilhinhos */}
      {[
        [2, 10, 8, 0],
        [tam + 22, 18, 6, 0.8],
        [tam + 12, tam - 14, 5, 1.6],
        [8, tam - 22, 4, 2.2],
      ].map(([x, y, r, atraso], i) => (
        <span
          key={i}
          className="absolute rounded-full animate-cintilar"
          style={{ left: x, top: y, width: r, height: r, background: t.brilho, animationDelay: `${atraso}s` }}
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
