import Link from "next/link";

// Etapa 230 — um jeito só de dizer "não tem nada aqui ainda" em todo o app
export function EstadoVazio({
  emoji,
  titulo,
  texto,
  acao,
  className = "",
}: {
  emoji: string;
  titulo: string;
  texto?: string;
  acao?: { rotulo: string; href: string };
  className?: string;
}) {
  return (
    <div className={`animate-surgir flex flex-col items-center text-center bg-base-800 border border-dashed border-base-600 rounded-3xl px-6 py-10 mb-6 ${className}`}>
      <span className="text-5xl mb-3" aria-hidden>
        {emoji}
      </span>
      <p className="text-lg font-semibold">{titulo}</p>
      {texto && <p className="text-base text-ink-400 mt-1 max-w-xs">{texto}</p>}
      {acao && (
        <Link href={acao.href} className="mt-5 bg-ink-100 text-base-900 rounded-2xl px-5 py-3 text-base font-semibold hover:opacity-90 transition">
          {acao.rotulo}
        </Link>
      )}
    </div>
  );
}
