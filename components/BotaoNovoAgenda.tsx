"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Repeat, CheckSquare, X } from "lucide-react";

/**
 * Etapa 136 — antes, se você já tinha pelo menos um hábito ou tarefa,
 * não existia NENHUM jeito de adicionar um novo direto da aba "Hoje"
 * (os botões "+ Hábito"/"+ Tarefa" só apareciam na tela vazia, antes
 * do primeiro cadastro). Mesmo padrão do "+" de Finanças: uma folha
 * rápida perguntando o quê, sempre visível, em qualquer aba de Hábitos.
 */
export function BotaoNovoAgenda() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        aria-label="Adicionar"
        className="fixed bottom-24 right-5 lg:bottom-8 lg:right-8 z-20 w-14 h-14 rounded-full bg-habito text-base-900 flex items-center justify-center shadow-lg shadow-habito/30 hover:opacity-90 active:scale-95 transition"
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
              <p className="font-display font-semibold">O que você quer adicionar?</p>
              <button onClick={() => setAberto(false)} aria-label="Fechar" className="text-ink-400 hover:text-ink-100 transition">
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/habitos/novo"
                className="flex items-center gap-3 border border-habito/40 text-habito rounded-xl2 py-3.5 px-4 hover:bg-habito/10 transition"
              >
                <Repeat size={20} strokeWidth={2} />
                <span className="font-medium">Hábito</span>
              </Link>
              <Link
                href="/habitos/tarefas/nova"
                className="flex items-center gap-3 border border-nota/40 text-nota rounded-xl2 py-3.5 px-4 hover:bg-nota/10 transition"
              >
                <CheckSquare size={20} strokeWidth={2} />
                <span className="font-medium">Tarefa</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
