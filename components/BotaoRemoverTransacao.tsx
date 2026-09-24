"use client";

import { removerTransacao } from "@/app/financas/actions";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";

export function BotaoRemoverTransacao({
  transacaoId,
  aoConcluir,
}: {
  transacaoId: string;
  /** Etapa 177 — sem isso, a tela não sabia que precisava se
   *  atualizar depois de excluir: o lançamento sumia do banco mas
   *  continuava aparecendo na lista até a página recarregar sozinha
   *  por outro motivo. */
  aoConcluir?: () => void;
}) {
  return (
    <BotaoComConfirmacao
      acao={removerTransacao.bind(null, transacaoId)}
      textoBotao="✕"
      classeBotao="text-ink-400 hover:text-red-400 transition text-sm px-1"
      aoConcluir={aoConcluir}
    />
  );
}
