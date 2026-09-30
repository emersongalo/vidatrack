"use client";

// Etapa 235 — tela de montar o Início: escolher o modelo (hábitos,
// finanças ou os dois), ligar/desligar cada bloco e mudar a ordem.
import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, X, EyeOff } from "lucide-react";
import { BLOCOS, MODELOS, alternarBloco, modoDaLista, moverBloco, type AreaBloco, type IdBloco, type ModoInicio } from "@/lib/painel/blocos";

const NOME_AREA: Record<AreaBloco, string> = { habitos: "Hábitos", financas: "Finanças", geral: "Geral" };
const COR_AREA: Record<AreaBloco, string> = {
  habitos: "bg-habito/15 text-habito",
  financas: "bg-financa/15 text-financa",
  geral: "bg-base-700 text-ink-400",
};

export function PersonalizarInicio({
  inicial,
  aoSalvar,
  aoFechar,
}: {
  inicial: IdBloco[];
  aoSalvar: (lista: IdBloco[]) => Promise<void> | void;
  aoFechar: () => void;
}) {
  const [lista, setLista] = useState<IdBloco[]>(inicial);
  const [salvando, setSalvando] = useState(false);
  const modo = modoDaLista(lista);
  const fora = BLOCOS.filter((b) => !lista.includes(b.id));

  async function salvar() {
    setSalvando(true);
    await aoSalvar(lista);
    setSalvando(false);
    aoFechar();
  }

  const botao = "w-9 h-9 rounded-xl flex items-center justify-center bg-base-700 text-ink-100 disabled:opacity-30";

  return (
    <div className="animate-fundo fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center" onClick={aoFechar}>
      <div
        className="animate-folha w-full max-w-lg max-h-[92dvh] flex flex-col bg-base-900 border border-base-600 rounded-t-3xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-2xl font-display font-bold">Personalizar Início</h2>
          <button onClick={aoFechar} aria-label="Fechar" className="text-ink-400 hover:text-ink-100 p-1">
            <X size={22} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-4 flex-1">
          <p className="text-base text-ink-400 mb-2">O que você quer ver?</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {(Object.keys(MODELOS) as ModoInicio[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setLista([...MODELOS[m].blocos])}
                className={`rounded-2xl border px-2 py-3 text-center transition ${
                  modo === m ? "border-habito bg-habito/10" : "border-base-600 bg-base-800 hover:border-ink-400"
                }`}
              >
                <span className="block text-2xl">{MODELOS[m].emoji}</span>
                <span className="block text-sm font-semibold mt-1">{MODELOS[m].nome}</span>
              </button>
            ))}
          </div>

          <p className="text-base text-ink-400 mb-2">Na sua tela ({lista.length})</p>
          {lista.length === 0 ? (
            <p className="text-sm text-ink-400 border border-dashed border-base-600 rounded-2xl p-4 mb-6">Nada escolhido — adicione blocos aqui embaixo.</p>
          ) : (
            <ul className="space-y-2 mb-6">
              {lista.map((id, i) => {
                const b = BLOCOS.find((x) => x.id === id)!;
                return (
                  <li key={id} className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-2xl pl-3 pr-2 py-2">
                    <span className="text-2xl">{b.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium truncate">{b.nome}</p>
                      <span className={`text-xs rounded-full px-2 py-0.5 ${COR_AREA[b.area]}`}>{NOME_AREA[b.area]}</span>
                    </div>
                    <button className={botao} disabled={i === 0} onClick={() => setLista(moverBloco(lista, id, -1))} aria-label="Subir">
                      <ChevronUp size={18} />
                    </button>
                    <button className={botao} disabled={i === lista.length - 1} onClick={() => setLista(moverBloco(lista, id, 1))} aria-label="Descer">
                      <ChevronDown size={18} />
                    </button>
                    <button className={botao} onClick={() => setLista(alternarBloco(lista, id))} aria-label="Tirar da tela">
                      <EyeOff size={17} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {fora.length > 0 && (
            <>
              <p className="text-base text-ink-400 mb-2">Adicionar</p>
              {(["habitos", "financas", "geral"] as AreaBloco[]).map((area) => {
                const blocos = fora.filter((b) => b.area === area);
                if (!blocos.length) return null;
                return (
                  <div key={area} className="mb-4">
                    <p className={`inline-block text-xs rounded-full px-2 py-0.5 mb-2 ${COR_AREA[area]}`}>{NOME_AREA[area]}</p>
                    <ul className="space-y-2">
                      {blocos.map((b) => (
                        <li key={b.id}>
                          <button
                            type="button"
                            onClick={() => setLista(alternarBloco(lista, b.id))}
                            className="w-full flex items-center gap-3 text-left bg-base-800/60 border border-dashed border-base-600 rounded-2xl px-3 py-2.5 hover:border-ink-400 transition"
                          >
                            <span className="text-2xl">{b.emoji}</span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-base font-medium">{b.nome}</span>
                              <span className="block text-sm text-ink-400">{b.texto}</span>
                            </span>
                            <span className="w-9 h-9 rounded-xl bg-habito/15 text-habito flex items-center justify-center shrink-0">
                              <Plus size={18} />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-base-600" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <button type="button" onClick={() => setLista([...MODELOS.ambos.blocos])} className="flex-1 rounded-2xl border border-base-600 py-3 text-base">
            Padrão
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="flex-[2] rounded-2xl bg-ink-100 text-base-900 py-3 text-base font-semibold disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
