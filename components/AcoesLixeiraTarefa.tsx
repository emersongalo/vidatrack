"use client";

import { useTransition } from "react";
import { restaurarTarefa, excluirTarefaDefinitivamente } from "@/app/habitos/tarefas/actions";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";

export function AcoesLixeiraTarefa({ tarefaId, aoConcluir }: { tarefaId: string; aoConcluir?: () => void }) {
  const [, iniciarTransicao] = useTransition();

  return (
    <div className="flex items-center gap-3 shrink-0">
      <button
        onClick={() => iniciarTransicao(async () => {
          await restaurarTarefa(tarefaId);
          aoConcluir?.();
        })}
        className="text-xs text-nota hover:underline"
      >
        Restaurar
      </button>
      <BotaoComConfirmacao
        acao={() => excluirTarefaDefinitivamente(tarefaId)}
        textoBotao="Excluir de vez"
        textoConfirmacao="Não tem volta:"
        aoConcluir={aoConcluir}
      />
    </div>
  );
}
