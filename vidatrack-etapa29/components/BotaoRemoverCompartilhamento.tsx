"use client";

import { removerCompartilhamento } from "@/lib/compartilhamento/actions";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";

export function BotaoRemoverCompartilhamento({
  compartilhamentoId,
  caminhoRetorno,
}: {
  compartilhamentoId: string;
  caminhoRetorno: string;
}) {
  return (
    <BotaoComConfirmacao
      acao={removerCompartilhamento.bind(null, compartilhamentoId, caminhoRetorno)}
      textoBotao="Remover"
      textoConfirmacao="Essa pessoa perde o acesso:"
    />
  );
}
