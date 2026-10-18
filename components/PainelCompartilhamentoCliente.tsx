"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  convidarPorEmail,
  convidarPessoaConhecida,
  removerCompartilhamento,
  descompartilharHabito,
  removerConvite,
  reenviarConvite,
  alterarPermissaoCompartilhamento,
  alterarPermissaoConvite,
  type TipoItem,
} from "@/lib/compartilhamento/actions";
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
  // Etapa 273 — convites aguardando resposta (ou recusados)
  const [convites, setConvites] = useState<any[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(erroInicial ?? null);
  const [, iniciarTransicao] = useTransition();
  // Etapa 234 — pessoas com quem você já compartilhou algo (ou que compartilharam com você)
  const [conhecidas, setConhecidas] = useState<Conhecida[]>([]);
  const [permissao, setPermissao] = useState("leitura");
  const [enviando, setEnviando] = useState<string | null>(null);
  // Etapa 337 — quem sou eu (só o dono troca a permissão) e qual linha está salvando
  const [eu, setEu] = useState<string | null>(null);
  const [mudando, setMudando] = useState<string | null>(null);

  async function trocarPermissao(tipo: "compartilhamento" | "convite", id: string, nova: string) {
    setErro(null);
    setAviso(null);
    setMudando(id);
    const r = tipo === "compartilhamento" ? await alterarPermissaoCompartilhamento(id, nova) : await alterarPermissaoConvite(id, nova);
    setMudando(null);
    if (!r.ok) setErro(r.erro ?? "Não deu pra mudar a permissão");
    else setAviso(nova === "edicao" ? "Pronto! Agora a pessoa pode editar." : "Pronto! Agora a pessoa só pode ver.");
    buscar();
  }

  function SeletorPermissao({ tipo, id, atual }: { tipo: "compartilhamento" | "convite"; id: string; atual: string }) {
    return (
      <div className="inline-flex bg-base-900 border border-base-600 rounded-full p-0.5 mt-1" role="group" aria-label="Permissão">
        {(["leitura", "edicao"] as const).map((p) => (
          <button
            key={p}
            type="button"
            disabled={mudando === id}
            onClick={() => p !== atual && trocarPermissao(tipo, id, p)}
            className={`text-[11px] rounded-full px-2.5 py-1 transition ${
              p === atual ? "bg-ink-100 text-base-900 font-semibold" : "text-ink-400 hover:text-ink-100"
            } disabled:opacity-60`}
          >
            {p === "leitura" ? "👀 Pode ver" : "✏️ Pode editar"}
          </button>
        ))}
      </div>
    );
  }

  const buscarConhecidas = useCallback(async () => {
    const supabase = createClient();
    const { data: sessao } = await supabase.auth.getSession();
    const eu = sessao.session?.user.id;
    if (!eu) return;
    setEu(eu);
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
    else setAviso("Convite enviado! A pessoa recebe uma notificação pra aceitar.");
    buscar();
  }

  const buscar = useCallback(() => {
    const supabase = createClient();
    supabase
      .from("compartilhamentos")
      .select("id, email_convidado, usuario_convidado_id, permissao, dono_id")
      .eq("tipo_item", tipoItem)
      .eq("item_id", itemId)
      .order("criado_em", { ascending: true })
      .then(({ data }) => setCompartilhamentos(data ?? []));
    supabase
      .from("convites_compartilhamento")
      .select("id, email_convidado, usuario_convidado_id, permissao, status, criado_em, dono_id")
      .eq("tipo_item", tipoItem)
      .eq("item_id", itemId)
      .order("criado_em", { ascending: true })
      .then(({ data }) => setConvites(data ?? []));
  }, [tipoItem, itemId]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  function convidar(formData: FormData) {
    setErro(null);
    setAviso(null);
    const email = String(formData.get("email") ?? "");
    iniciarTransicao(async () => {
      const r = await convidarPorEmail(tipoItem, itemId, caminhoRetorno, email, permissao);
      if (!r.ok) setErro(r.erro ?? "Não deu pra convidar");
      else {
        setAviso("Convite enviado! A pessoa recebe uma notificação pra aceitar ou recusar.");
        const campo = document.getElementById("email-convite") as HTMLInputElement | null;
        if (campo) campo.value = "";
      }
      buscar();
    });
  }

  async function reenviar(id: string) {
    setErro(null);
    const r = await reenviarConvite(id);
    if (!r.ok) setErro(r.erro ?? "Não deu pra reenviar");
    else setAviso("Convite enviado de novo.");
    buscar();
  }

  return (
    <div>
      {erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">{erro}</p>
      )}
      {aviso && !erro && (
        <p className="mb-4 text-sm text-habito bg-habito/10 border border-habito/30 rounded-lg px-3 py-2 animate-surgir">📩 {aviso}</p>
      )}

      {convites.length > 0 && (
        <ul className="space-y-2 mb-4">
          {convites.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 bg-base-800 border border-base-600 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm truncate">{c.email_convidado}</p>
                <p className="text-xs">
                  {!(eu && c.dono_id === eu && c.status !== "recusado") && <span className="text-ink-400">{RÓTULOS_PERMISSAO[c.permissao]} · </span>}
                  {c.status === "recusado" ? (
                    <span className="text-red-400">recusou o convite</span>
                  ) : (
                    <span className="text-financa">⏳ aguardando resposta</span>
                  )}
                </p>
                {eu && c.dono_id === eu && c.status !== "recusado" && <SeletorPermissao tipo="convite" id={c.id} atual={c.permissao} />}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.status === "recusado" && (
                  <button type="button" onClick={() => reenviar(c.id)} className="text-xs text-habito hover:underline">
                    Convidar de novo
                  </button>
                )}
                <BotaoComConfirmacao
                  acao={() => removerConvite(c.id, caminhoRetorno)}
                  textoBotao={c.status === "recusado" ? "Apagar" : "Cancelar"}
                  textoConfirmacao="Cancelar esse convite?"
                  aoConcluir={buscar}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {compartilhamentos === null ? (
        <p className="text-sm text-ink-400 mb-4">Carregando...</p>
      ) : (
        compartilhamentos.length > 0 && (
          <ul className="space-y-2 mb-4">
            {compartilhamentos.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 bg-base-800 border border-base-600 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm truncate">{c.email_convidado}</p>
                  <p className="text-xs text-ink-400">
                    {!(eu && c.dono_id === eu) && <>{RÓTULOS_PERMISSAO[c.permissao]} · </>}
                    <span className="text-habito">✓ aceitou</span>
                  </p>
                  {/* Etapa 337 — o dono troca entre ver e editar a qualquer hora */}
                  {eu && c.dono_id === eu && <SeletorPermissao tipo="compartilhamento" id={c.id} atual={c.permissao} />}
                </div>
                {/* Etapa 303 — hábito: descompartilha avisando a pessoa (ela fica com uma cópia e o histórico dela) */}
                <BotaoComConfirmacao
                  acao={
                    tipoItem === "habito" && c.usuario_convidado_id
                      ? async () => {
                          const r = await descompartilharHabito(itemId, c.usuario_convidado_id);
                          if (!r.ok) setErro(r.erro ?? "Não deu pra descompartilhar");
                          else setAviso(r.saiu ? "Você saiu do hábito compartilhado." : "Descompartilhado — a pessoa foi avisada.");
                        }
                      : () => removerCompartilhamento(c.id, caminhoRetorno)
                  }
                  textoBotao={tipoItem === "habito" ? "Descompartilhar" : "Remover"}
                  textoConfirmacao={
                    tipoItem === "habito"
                      ? "Tem certeza? A pessoa sai do hábito (fica com uma cópia com o histórico dela) e recebe um aviso:"
                      : "Essa pessoa perde o acesso:"
                  }
                  aoConcluir={buscar}
                />
              </li>
            ))}
          </ul>
        )
      )}

      {(() => {
        const jaTem = new Set(
          [...(compartilhamentos ?? []), ...convites].flatMap((c) => [c.usuario_convidado_id, `email:${c.email_convidado}`, c.email_convidado])
        );
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
          id="email-convite"
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
        A pessoa recebe uma notificação e escolhe se aceita ou recusa. Se ela ainda não tem conta no VidaTrack, o
        convite aparece assim que ela se cadastrar com esse e-mail.
      </p>
    </div>
  );
}
