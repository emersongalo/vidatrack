"use client";

import type { DescricaoSugerida } from "@/lib/financas/sugestaoDescricao";

function normalizar(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

// Etapa 217 — sugestões de descrição.
// Etapa 228 — viram uma listinha logo abaixo da caixa, só enquanto a
// pessoa digita; tocar preenche a descrição (e a categoria), mas NÃO o
// valor — o valor a pessoa coloca.
export function ChipsDescricao({
  sugestoes,
  titulo,
  aoEscolher,
  textoAtual,
}: {
  sugestoes: DescricaoSugerida[];
  titulo?: string;
  aoEscolher: (s: DescricaoSugerida) => void;
  /** esconde a sugestão que já é igual ao que está escrito */
  textoAtual?: string;
}) {
  const atual = normalizar(textoAtual ?? "");
  const lista = sugestoes.filter((s) => normalizar(s.descricao) !== atual).slice(0, 5);
  if (!lista.length) return null;
  return (
    <div className="mt-1.5 bg-base-800 border border-base-600 rounded-2xl overflow-hidden">
      {titulo && <p className="text-xs text-ink-400 px-4 pt-2">{titulo}</p>}
      <ul className="divide-y divide-base-600">
        {lista.map((s) => (
          <li key={s.descricao}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => aoEscolher(s)}
              className="w-full text-left px-4 py-3 text-base text-ink-100 hover:bg-base-700 transition truncate"
            >
              {s.descricao}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
