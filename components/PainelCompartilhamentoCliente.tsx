"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { convidarCompartilhamento, removerCompartilhamento, type TipoItem } from "@/lib/compartilhamento/actions";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";

const RÓTULOS_PERMISSAO: Record<string, string> = {
  leitura: "Pode ver",
  edicao: "Pode editar",
};

/**
 * Etapa 132 — versão client da antiga PainelCompartilhamento (que era
 * um Server Component). Quem tem acesso a algo seu é dado sensível —
 * então, diferente da maioria das outras telas, essa busca direto no
 * servidor sempre (não entra no retrato local), pra nunca mostrar uma
 * lista de acesso desatualizada.
 */
export function PainelCompartilhamentoCliente({
  tipoItem,
  itemId,
  caminhoRetorno,
  erroInicial,
}: {
  tipoItem: TipoItem;
  itemId: string;
  caminhoRetorno: string;
  erroInicial?: string | null;
}) {
  const [compartilhamentos, setCompartilhamentos] = useState<any[] | null>(null);
  const [erro, setErro] = useState<string | null>(erroInicial ?? null);
  const [, iniciarTransicao] = useTransition();

  const buscar = useCallback(() => {
    createClient()
      .from("compartilhamentos")
      .select("id, email_convidado, usuario_convidado_id, permissao")
      .eq("tipo_item", tipoItem)
      .eq("item_id", itemId)
      .order("criado_em", { ascending: true })
      .then(({ data }) => setCompartilhamentos(data ?? []));
  }, [tipoItem, itemId]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  function convidar(formData: FormData) {
    setErro(null);
    iniciarTransicao(async () => {
      await convidarCompartilhamento(tipoItem, itemId, caminhoRetorno, formData);
      buscar();
    });
  }

  return (
    <div>
      {erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">{erro}</p>
      )}

      {compartilhamentos === null ? (
        <p className="text-sm text-ink-400 mb-4">Carregando...</p>
      ) : (
        compartilhamentos.length > 0 && (
          <ul className="space-y-2 mb-4">
            {compartilhamentos.map((c) => (
              <li key={c.id} className="flex items-center justify-between bg-base-800 border border-base-600 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm truncate">{c.email_convidado}</p>
                  <p className="text-xs text-ink-400">
                    {RÓTULOS_PERMISSAO[c.permissao]} · {c.usuario_convidado_id ? "aceito" : "convite pendente"}
                  </p>
                </div>
                <BotaoComConfirmacao
                  acao={() => removerCompartilhamento(c.id, caminhoRetorno)}
                  textoBotao="Remover"
                  textoConfirmacao="Essa pessoa perde o acesso:"
                  aoConcluir={buscar}
                />
              </li>
            ))}
          </ul>
        )
      )}

      <form action={convidar} className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="e-mail da pessoa"
          className="flex-1 min-w-0 bg-base-800 border border-base-600 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none transition"
        />
        <select
          name="permissao"
          className="bg-base-800 border border-base-600 rounded-lg px-2 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none transition"
        >
          <option value="leitura">Pode ver</option>
          <option value="edicao">Pode editar</option>
        </select>
        <button type="submit" className="bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-3 py-2 hover:opacity-90 transition shrink-0">
          Convidar
        </button>
      </form>
      <p className="text-xs text-ink-400 mt-2">
        Se a pessoa ainda não tem conta no VidaTrack, o convite fica pendente e libera sozinho assim que ela se
        cadastrar com esse e-mail.
      </p>
    </div>
  );
}
