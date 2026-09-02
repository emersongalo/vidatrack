"use client";

import { useTransition } from "react";
import { restaurarNota, excluirNotaDefinitivamente } from "@/app/notas/actions";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";

export function AcoesLixeiraNota({ notaId }: { notaId: string }) {
  const [, iniciarTransicao] = useTransition();

  return (
    <div className="flex items-center gap-3 shrink-0">
      <button
        onClick={() => iniciarTransicao(() => restaurarNota(notaId))}
        className="text-xs text-nota hover:underline"
      >
        Restaurar
      </button>
      <BotaoComConfirmacao
        acao={() => excluirNotaDefinitivamente(notaId)}
        textoBotao="Excluir de vez"
        textoConfirmacao="Apaga os anexos também:"
      />
    </div>
  );
}
