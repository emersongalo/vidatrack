"use client";

import { removerTransacao } from "@/app/financas/actions";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";

export function BotaoRemoverTransacao({ transacaoId }: { transacaoId: string }) {
  return (
    <BotaoComConfirmacao
      acao={removerTransacao.bind(null, transacaoId)}
      textoBotao="✕"
      classeBotao="text-ink-400 hover:text-red-400 transition text-sm px-1"
    />
  );
}
