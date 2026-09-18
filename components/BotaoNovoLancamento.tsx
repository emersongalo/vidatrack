"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, PiggyBank, X } from "lucide-react";

/**
 * Etapa 135 — antes o "+" ia direto pra tela de novo lançamento (com
 * Despesa já marcada por padrão, e você trocava lá dentro). Igual a
 * apps de finanças conhecidos, agora ele abre uma folha rápida
 * perguntando o quê primeiro — mais rápido pra quem já sabe o que
 * quer lançar, e a próxima tela já abre com o tipo certo marcado.
 */
export function BotaoNovoLancamento() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        aria-label="Novo lançamento"
        className="fixed bottom-24 right-5 lg:bottom-8 lg:right-8 z-20 w-14 h-14 rounded-full bg-financa text-base-900 flex items-center justify-center shadow-lg shadow-financa/30 hover:opacity-90 active:scale-95 transition"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/60"
          onClick={() => setAberto(false)}
        >
          <div
            className="w-full max-w-md bg-base-800 border-t border-base-600 rounded-t-2xl p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="font-display font-semibold">O que você quer lançar?</p>
              <button
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="text-ink-400 hover:text-ink-100 transition"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/financas/nova?tipo=receita"
                onClick={() => setAberto(false)}
                className="flex items-center gap-3 border border-habito/40 text-habito rounded-xl2 py-3.5 px-4 hover:bg-habito/10 transition"
              >
                <TrendingUp size={20} strokeWidth={2} />
                <span className="font-medium">Receita</span>
              </Link>
              <Link
                href="/financas/nova?tipo=despesa"
                onClick={() => setAberto(false)}
                className="flex items-center gap-3 border border-red-400/40 text-red-400 rounded-xl2 py-3.5 px-4 hover:bg-red-400/10 transition"
              >
                <TrendingDown size={20} strokeWidth={2} />
                <span className="font-medium">Despesa</span>
              </Link>
              <Link
                href="/financas/investir"
                onClick={() => setAberto(false)}
                className="flex items-center gap-3 border border-financa/40 text-financa rounded-xl2 py-3.5 px-4 hover:bg-financa/10 transition"
              >
                <PiggyBank size={20} strokeWidth={2} />
                <span className="font-medium">Guardar em investimento</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
