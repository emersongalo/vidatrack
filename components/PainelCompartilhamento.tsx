import { createClient } from "@/lib/supabase/server";
import { convidarCompartilhamento, TipoItem } from "@/lib/compartilhamento/actions";
import { BotaoRemoverCompartilhamento } from "./BotaoRemoverCompartilhamento";

const RÓTULOS_PERMISSAO: Record<string, string> = {
  leitura: "Pode ver",
  edicao: "Pode editar",
};

export async function PainelCompartilhamento({
  tipoItem,
  itemId,
  caminhoRetorno,
  erro,
}: {
  tipoItem: TipoItem;
  itemId: string;
  caminhoRetorno: string;
  erro?: string;
}) {
  const supabase = createClient();

  const { data: compartilhamentos } = await supabase
    .from("compartilhamentos")
    .select("id, email_convidado, usuario_convidado_id, permissao")
    .eq("tipo_item", tipoItem)
    .eq("item_id", itemId)
    .order("criado_em", { ascending: true });

  const convidarComItem = convidarCompartilhamento.bind(null, tipoItem, itemId, caminhoRetorno);

  return (
    <div>
      {erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(erro)}
        </p>
      )}

      {compartilhamentos && compartilhamentos.length > 0 && (
        <ul className="space-y-2 mb-4">
          {compartilhamentos.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between bg-base-800 border border-base-600 rounded-lg px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm truncate">{c.email_convidado}</p>
                <p className="text-xs text-ink-400">
                  {RÓTULOS_PERMISSAO[c.permissao]} ·{" "}
                  {c.usuario_convidado_id ? "aceito" : "convite pendente"}
                </p>
              </div>
              <BotaoRemoverCompartilhamento
                compartilhamentoId={c.id}
                caminhoRetorno={caminhoRetorno}
              />
            </li>
          ))}
        </ul>
      )}

      <form action={convidarComItem} className="flex gap-2">
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
        <button
          type="submit"
          className="bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-3 py-2 hover:opacity-90 transition shrink-0"
        >
          Convidar
        </button>
      </form>
      <p className="text-xs text-ink-400 mt-2">
        Se a pessoa ainda não tem conta no VidaTrack, o convite fica pendente
        e libera sozinho assim que ela se cadastrar com esse e-mail.
      </p>
    </div>
  );
}
