"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { convidarCompartilhamento, convidarPessoaConhecida, removerCompartilhamento, type TipoItem } from "@/lib/compartilhamento/actions";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";

type Conhecida = { chave: string; usuarioId: string | null; email: string | null; nome: string };

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
  // Etapa 234 — pessoas com quem você já compartilhou algo (ou que compartilharam com você)
  const [conhecidas, setConhecidas] = useState<Conhecida[]>([]);
  const [permissao, setPermissao] = useState("leitura");
  const [enviando, setEnviando] = useState<string | null>(null);

  const buscarConhecidas = useCallback(async () => {
    const supabase = createClient();
    const { data: sessao } = await supabase.auth.getSession();
    const eu = sessao.session?.user.id;
    if (!eu) return;
    const { data } = await supabase.from("compartilhamentos").select("email_convidado, usuario_convidado_id, dono_id");
    const mapa = new Map<string, Conhecida>();
    for (const c of data ?? []) {
      if (c.dono_id === eu) {
        const chave = (c.usuario_convidado_id as string) ?? `email:${c.email_convidado}`;
        if (!mapa.has(chave)) mapa.set(chave, { chave, usuarioId: c.usuario_convidado_id, email: c.email_convidado, nome: String(c.email_convidado ?? "").split("@")[0] });
      } else if (c.usuario_convidado_id === eu && c.dono_id) {
        const chave = c.dono_id as string;
        if (!mapa.has(chave)) mapa.set(chave, { chave, usuarioId: c.dono_id, email: null, nome: "..." });
        else mapa.get(chave)!.usuarioId = c.dono_id;
      }
    }
    const lista = [...mapa.values()];
    await Promise.all(
      lista
        .filter((p) => p.usuarioId)
        .map(async (p) => {
          const { data: nome } = await supabase.rpc("nome_do_usuario", { p_user_id: p.usuarioId });
          if (nome) p.nome = String(nome).split("@")[0].split(" ")[0];
        })
    );
    setConhecidas(lista);
  }, []);

  useEffect(() => {
    void buscarConhecidas();
  }, [buscarConhecidas]);

  async function convidarConhecida(p: Conhecida) {
    setErro(null);
    setEnviando(p.chave);
    const r = await convidarPessoaConhecida(tipoItem, itemId, caminhoRetorno, { usuarioId: p.usuarioId, email: p.email }, permissao);
    setEnviando(null);
    if (!r.ok) setErro(r.erro ?? "Não deu pra compartilhar");
    buscar();
  }

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

      {(() => {
        const jaTem = new Set((compartilhamentos ?? []).flatMap((c) => [c.usuario_convidado_id, `email:${c.email_convidado}`, c.email_convidado]));
        const disponiveis = conhecidas.filter((p) => !(p.usuarioId && jaTem.has(p.usuarioId)) && !(p.email && jaTem.has(p.email)));
        if (!disponiveis.length) return null;
        return (
          <div className="mb-4">
            <p className="text-sm text-ink-400 mb-2">Compartilhar com quem você já compartilhou:</p>
            <div className="flex flex-wrap gap-2">
              {disponiveis.map((p) => (
                <button
                  key={p.chave}
                  type="button"
                  disabled={enviando !== null}
                  onClick={() => convidarConhecida(p)}
                  className="flex items-center gap-2 bg-base-800 border border-base-600 rounded-full pl-1 pr-3 py-1 hover:border-habito transition disabled:opacity-50"
                >
                  <span className="w-8 h-8 rounded-full bg-habito/20 text-habito flex items-center justify-center text-sm font-semibold uppercase">
                    {p.nome.slice(0, 1)}
                  </span>
                  <span className="text-sm font-medium">{enviando === p.chave ? "Compartilhando..." : p.nome}</span>
                  <span className="text-habito text-lg leading-none">+</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-400 mt-2">Ou convide alguém novo pelo e-mail:</p>
          </div>
        );
      })()}

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
          value={permissao}
          onChange={(e) => setPermissao(e.target.value)}
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
