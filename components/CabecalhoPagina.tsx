import Link from "next/link";
import type { ReactNode } from "react";

// Etapa 279 — cabeçalho padrão das telas internas: voltar, título,
// subtítulo e uma ação à direita (sempre no mesmo lugar e tamanho).
export function CabecalhoPagina({
  voltarHref,
  voltarTexto,
  titulo,
  subtitulo,
  acao,
  emoji,
}: {
  voltarHref?: string;
  voltarTexto?: string;
  titulo: string;
  subtitulo?: ReactNode;
  acao?: ReactNode;
  emoji?: string;
}) {
  return (
    <header className="mb-6">
      {voltarHref && (
        <Link
          href={voltarHref}
          className="inline-flex items-center gap-1 rounded-full bg-base-800/70 border border-base-600/70 pl-2 pr-3 py-1 text-sm text-ink-400 hover:text-ink-100 transition mb-3"
        >
          <span aria-hidden className="text-base leading-none">‹</span> {voltarTexto ?? "Voltar"}
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-display font-bold leading-tight tracking-tight break-words">
            {emoji && <span className="mr-2">{emoji}</span>}
            {titulo}
          </h1>
          {subtitulo && <p className="text-sm text-ink-400 mt-1">{subtitulo}</p>}
        </div>
        {acao && <div className="shrink-0 pt-1">{acao}</div>}
      </div>
    </header>
  );
}
