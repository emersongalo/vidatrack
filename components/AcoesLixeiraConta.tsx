"use client";

import { useTransition } from "react";
import { restaurarConta, excluirContaDefinitivamente } from "@/app/financas/actions";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";

export function AcoesLixeiraConta({ contaId }: { contaId: string }) {
  const [, iniciarTransicao] = useTransition();

  return (
    <div className="flex items-center gap-3 shrink-0">
      <button
        onClick={() => iniciarTransicao(() => restaurarConta(contaId))}
        className="text-xs text-financa hover:underline"
      >
        Restaurar
      </button>
      <BotaoComConfirmacao
        acao={() => excluirContaDefinitivamente(contaId)}
        textoBotao="Excluir de vez"
        textoConfirmacao="Apaga todos os lançamentos dela:"
      />
    </div>
  );
}
