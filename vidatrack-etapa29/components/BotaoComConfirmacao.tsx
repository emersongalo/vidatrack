"use client";

import { useState, useTransition } from "react";

export function BotaoComConfirmacao({
  acao,
  textoBotao,
  textoConfirmacao = "Tem certeza?",
  classeBotao = "text-ink-400 hover:text-red-400 transition text-xs",
}: {
  acao: () => void | Promise<void>;
  textoBotao: string;
  textoConfirmacao?: string;
  classeBotao?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciarTransicao] = useTransition();

  function confirmar() {
    iniciarTransicao(async () => {
      await acao();
      setAberto(false);
    });
  }

  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className={classeBotao}>
        {textoBotao}
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60"
          onClick={() => !pendente && setAberto(false)}
        >
          <div
            className="bg-base-800 border border-base-600 rounded-xl2 p-5 max-w-xs w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-ink-100 mb-4">{textoConfirmacao}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAberto(false)}
                disabled={pendente}
                className="flex-1 border border-base-600 rounded-lg py-2 text-sm hover:bg-base-700 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={pendente}
                className="flex-1 bg-red-400 text-base-900 font-medium rounded-lg py-2 text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {pendente ? "..." : "Sim, confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
