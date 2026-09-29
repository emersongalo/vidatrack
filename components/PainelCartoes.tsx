"use client";

// Etapa 220 — resumos do topo do Painel, escolhidos e ordenados pela
// própria pessoa. A escolha fica salva só neste aparelho.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import {
  CARTOES,
  CHAVE_PAINEL,
  PADRAO_PAINEL,
  alternarCartao,
  lerPreferenciaPainel,
  moverCartao,
  valorDoCartao,
  type IdCartao,
} from "@/lib/painel/cartoes";

export function PainelCartoes() {
  const { snapshot } = useSnapshotOffline();
  const [lista, setLista] = useState<IdCartao[]>(PADRAO_PAINEL);
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    try {
      setLista(lerPreferenciaPainel(localStorage.getItem(CHAVE_PAINEL)));
    } catch {
      /* sem localStorage: fica o padrão */
    }
  }, []);

  function salvar(nova: IdCartao[]) {
    setLista(nova);
    try {
      localStorage.setItem(CHAVE_PAINEL, JSON.stringify(nova));
    } catch {
      /* ignora */
    }
  }

  const hoje = hojeISO();
  const valores = useMemo(
    () => (snapshot ? lista.map((id) => ({ id, ...valorDoCartao(id, snapshot, hoje) })) : []),
    [snapshot, lista, hoje]
  );

  if (!snapshot) return null;

  return (
    <section className="mt-3 mb-1">
      {!editando && (
        <div className="flex gap-2 overflow-x-auto snap-x pb-1 -mx-1 px-1 [scrollbar-width:none]">
          {valores.map((v) => (
            <Link
              key={v.id}
              href={v.href}
              className={`snap-start shrink-0 w-[11rem] bg-base-800 border rounded-2xl p-4 hover:border-ink-400 transition ${
                v.alerta ? "border-red-400/60" : "border-base-600"
              }`}
            >
              <p className="text-sm text-ink-400 truncate">
                {CARTOES.find((c) => c.id === v.id)?.emoji} {v.titulo}
              </p>
              <p className={`text-xl font-mono font-semibold truncate mt-1 ${v.alerta ? "text-red-400" : ""}`}>{v.valor}</p>
              {v.detalhe && <p className="text-sm text-ink-400 truncate">{v.detalhe}</p>}
            </Link>
          ))}
          <button
            onClick={() => setEditando(true)}
            aria-label="Personalizar o painel"
            className="snap-start shrink-0 w-14 rounded-2xl border border-dashed border-base-600 text-ink-400 hover:text-ink-100 flex items-center justify-center"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      )}

      {editando && (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">O que mostrar no Painel</p>
            <button onClick={() => setEditando(false)} className="text-xs text-habito px-2 py-1">
              Pronto
            </button>
          </div>
          <ul className="space-y-1">
            {[...lista, ...CARTOES.map((c) => c.id).filter((id) => !lista.includes(id))].map((id) => {
              const c = CARTOES.find((x) => x.id === id)!;
              const ativo = lista.includes(id);
              const i = lista.indexOf(id);
              return (
                <li key={id} className="flex items-center gap-2">
                  <label className="flex items-center gap-2 flex-1 min-w-0 py-1.5 cursor-pointer">
                    <input type="checkbox" checked={ativo} onChange={() => salvar(alternarCartao(lista, id))} className="accent-current" />
                    <span className="text-sm truncate">
                      {c.emoji} {c.nome}
                    </span>
                  </label>
                  {ativo && (
                    <>
                      <button
                        aria-label="Subir"
                        disabled={i === 0}
                        onClick={() => salvar(moverCartao(lista, id, -1))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100 disabled:opacity-30"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        aria-label="Descer"
                        disabled={i === lista.length - 1}
                        onClick={() => salvar(moverCartao(lista, id, 1))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100 disabled:opacity-30"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          <button onClick={() => salvar([...PADRAO_PAINEL])} className="text-xs text-ink-400 hover:text-ink-100 mt-2">
            Voltar ao padrão
          </button>
        </div>
      )}
    </section>
  );
}
