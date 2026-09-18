"use client";

import { useTransition } from "react";
import { restaurarHabito, excluirHabitoDefinitivamente } from "@/app/habitos/actions";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";

export function AcoesLixeiraHabito({ habitoId, aoConcluir }: { habitoId: string; aoConcluir?: () => void }) {
  const [, iniciarTransicao] = useTransition();

  return (
    <div className="flex items-center gap-3 shrink-0">
      <button
        onClick={() => iniciarTransicao(async () => {
          await restaurarHabito(habitoId);
          aoConcluir?.();
        })}
        className="text-xs text-habito hover:underline"
      >
        Restaurar
      </button>
      <BotaoComConfirmacao
        acao={() => excluirHabitoDefinitivamente(habitoId)}
        textoBotao="Excluir de vez"
        textoConfirmacao="Não tem volta:"
        aoConcluir={aoConcluir}
      />
    </div>
  );
}
