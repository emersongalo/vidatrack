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
  const [confirmando, setConfirmando] = useState(false);
  const [pendente, iniciarTransicao] = useTransition();

  if (confirmando) {
    return (
      <span className="inline-flex items-center gap-2 text-xs whitespace-nowrap">
        <span className="text-ink-400">{textoConfirmacao}</span>
        <button
          type="button"
          disabled={pendente}
          onClick={() =>
            iniciarTransicao(async () => {
              await acao();
              setConfirmando(false);
            })
          }
          className="text-red-400 font-medium hover:underline disabled:opacity-50"
        >
          {pendente ? "..." : "Sim"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="text-ink-400 hover:underline"
        >
          Não
        </button>
      </span>
    );
  }

  return (
    <button type="button" onClick={() => setConfirmando(true)} className={classeBotao}>
      {textoBotao}
    </button>
  );
}
