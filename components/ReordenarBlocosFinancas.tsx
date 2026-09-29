"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Pin } from "lucide-react";
import { salvarOrdemBlocosFinancas } from "@/app/financas/actions";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import {
  NOMES_BLOCOS_FINANCAS,
  alternarBloco,
  fixarNoTopo,
  moverBloco,
  salvarLayoutBlocos,
  type BlocoFinancas,
} from "@/lib/financas/blocos";

// Etapa 222 — além de subir/descer: fixar no topo e esconder o bloco.
export function ReordenarBlocosFinancas({ layoutInicial }: { layoutInicial: BlocoFinancas[] }) {
  const [layout, setLayout] = useState(layoutInicial);
  const [, iniciarTransicao] = useTransition();

  function aplicar(novo: BlocoFinancas[]) {
    setLayout(novo);
    iniciarTransicao(async () => {
      await salvarOrdemBlocosFinancas(salvarLayoutBlocos(novo));
      atualizarSnapshotEmTodasAsTelas();
    });
  }

  const botao =
    "w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-700 transition disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <ul className="space-y-2">
      {layout.map((b, i) => (
        <li
          key={b.id}
          className={`flex items-center gap-2 bg-base-800 border border-base-600 rounded-xl2 p-3 ${b.visivel ? "" : "opacity-50"}`}
        >
          <p className="font-medium flex-1 min-w-0 truncate">{NOMES_BLOCOS_FINANCAS[b.id]}</p>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => aplicar(fixarNoTopo(layout, i))} disabled={i === 0} aria-label="Fixar no topo" className={botao}>
              <Pin size={15} />
            </button>
            <button type="button" onClick={() => aplicar(moverBloco(layout, i, -1))} disabled={i === 0} aria-label="Mover pra cima" className={botao}>
              ↑
            </button>
            <button
              type="button"
              onClick={() => aplicar(moverBloco(layout, i, 1))}
              disabled={i === layout.length - 1}
              aria-label="Mover pra baixo"
              className={botao}
            >
              ↓
            </button>
            <button type="button" onClick={() => aplicar(alternarBloco(layout, i))} aria-label={b.visivel ? "Esconder" : "Mostrar"} className={botao}>
              {b.visivel ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
