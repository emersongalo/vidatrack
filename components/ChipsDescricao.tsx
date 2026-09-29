"use client";

import { formatarMoeda } from "@/lib/financas/formatacao";
import type { DescricaoSugerida } from "@/lib/financas/sugestaoDescricao";

// Etapa 217 — sugestões de descrição (toque = preenche tudo)
export function ChipsDescricao({
  sugestoes,
  titulo,
  aoEscolher,
}: {
  sugestoes: DescricaoSugerida[];
  titulo?: string;
  aoEscolher: (s: DescricaoSugerida) => void;
}) {
  if (!sugestoes.length) return null;
  return (
    <div className="mt-2">
      {titulo && <p className="text-xs text-ink-400 mb-1">{titulo}</p>}
      <div className="flex flex-wrap gap-1.5">
        {sugestoes.map((s) => (
          <button
            key={s.descricao}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => aoEscolher(s)}
            className="text-xs rounded-full border border-financa/40 bg-financa/10 text-ink-100 px-2.5 py-1 hover:border-financa transition max-w-full truncate"
          >
            {s.descricao}
            <span className="text-ink-400 ml-1.5 font-mono">{formatarMoeda(s.ultimoValor)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
