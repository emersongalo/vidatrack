"use client";

import { useState, useTransition } from "react";
import { salvarOrdemBlocosFinancas } from "@/app/financas/actions";
import { NOMES_BLOCOS_FINANCAS, type BlocoFinancasId } from "@/lib/financas/blocos";

export function ReordenarBlocosFinancas({ ordemInicial }: { ordemInicial: BlocoFinancasId[] }) {
  const [ordem, setOrdem] = useState(ordemInicial);
  const [, iniciarTransicao] = useTransition();

  function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= ordem.length) return;

    const nova = [...ordem];
    [nova[indice], nova[destino]] = [nova[destino], nova[indice]];
    setOrdem(nova);
    iniciarTransicao(() => {
      salvarOrdemBlocosFinancas(nova);
    });
  }

  return (
    <ul className="space-y-2">
      {ordem.map((id, i) => (
        <li
          key={id}
          className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-xl2 p-4"
        >
          <p className="font-medium flex-1">{NOMES_BLOCOS_FINANCAS[id]}</p>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => mover(i, -1)}
              disabled={i === 0}
              aria-label="Mover pra cima"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-700 transition disabled:opacity-30 disabled:hover:bg-transparent"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => mover(i, 1)}
              disabled={i === ordem.length - 1}
              aria-label="Mover pra baixo"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-700 transition disabled:opacity-30 disabled:hover:bg-transparent"
            >
              ↓
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
