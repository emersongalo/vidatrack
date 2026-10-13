"use client";

// Etapa 235 — tela de montar o Início: escolher o modelo (hábitos,
// finanças ou os dois), ligar/desligar cada bloco e mudar a ordem.
// Etapa 317 — separado por área (Hábitos, Tarefas, Finanças, Geral) com
// chavinha liga/desliga em cada bloco; a ordem fica numa lista à parte.
import { useState } from "react";
import { ChevronDown, ChevronUp, X, EyeOff } from "lucide-react";
import { BLOCOS, MODELOS, alternarBloco, moverBloco, type AreaBloco, type IdBloco } from "@/lib/painel/blocos";

const NOME_AREA: Record<AreaBloco, string> = { habitos: "Hábitos", tarefas: "Tarefas", financas: "Finanças", geral: "Geral" };
const EMOJI_AREA: Record<AreaBloco, string> = { habitos: "✅", tarefas: "📝", financas: "💰", geral: "🧩" };
const AREAS: AreaBloco[] = ["habitos", "tarefas", "financas", "geral"];
const COR_AREA: Record<AreaBloco, string> = {
  habitos: "bg-habito/15 text-habito",
  tarefas: "bg-nota/15 text-nota",
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
  const [area, setArea] = useState<AreaBloco>("habitos");
  const [ordenar, setOrdenar] = useState(false);

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
          {/* Etapa 317 — escolher por área */}
          {/* Etapa 318 — sem os "modelos" repetidos: só as áreas com as chavinhas */}
          <p className="text-base text-ink-400 mb-2">Escolha o que aparece no Início</p>
          <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-base-800 border border-base-600 mb-3">
            {AREAS.map((a) => {
              const ligados = BLOCOS.filter((b) => b.area === a && lista.includes(b.id)).length;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setArea(a)}
                  className={`rounded-xl py-2 text-center transition ${area === a ? "bg-base-600" : ""}`}
                >
                  <span className="block text-lg leading-none">{EMOJI_AREA[a]}</span>
                  <span className={`block text-[11px] font-semibold mt-1 ${area === a ? "text-ink-100" : "text-ink-400"}`}>{NOME_AREA[a]}</span>
                  <span className="block text-[10px] text-ink-500">{ligados} na tela</span>
                </button>
              );
            })}
          </div>
          {(() => {
            const daArea = BLOCOS.filter((b) => b.area === area);
            const ligados = daArea.filter((b) => lista.includes(b.id)).length;
            const todos = ligados === daArea.length;
            return (
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-sm text-ink-400">
                  {ligados} de {daArea.length} ligados
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setLista(todos ? lista.filter((id) => !daArea.some((b) => b.id === id)) : [...lista, ...daArea.map((b) => b.id).filter((id) => !lista.includes(id))])
                  }
                  className="text-sm font-semibold text-habito"
                >
                  {todos ? "Desligar todos" : "Ligar todos"}
                </button>
              </div>
            );
          })()}
          <ul className="space-y-2 mb-6">
            {BLOCOS.filter((b) => b.area === area).map((b) => {
              const ligado = lista.includes(b.id);
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ligado}
                    onClick={() => setLista(alternarBloco(lista, b.id))}
                    className={`w-full flex items-center gap-3 text-left rounded-2xl px-3 py-2.5 border transition ${
                      ligado ? "bg-base-800 border-habito/40" : "bg-base-800/50 border-dashed border-base-600"
                    }`}
                  >
                    <span className={`text-2xl ${ligado ? "" : "grayscale opacity-60"}`}>{b.emoji}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-base font-medium">{b.nome}</span>
                      <span className="block text-sm text-ink-400">{b.texto}</span>
                    </span>
                    <span className={`relative w-11 h-6 rounded-full shrink-0 transition ${ligado ? "bg-habito" : "bg-base-600"}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${ligado ? "left-[22px]" : "left-0.5"}`} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => setOrdenar(!ordenar)}
            aria-expanded={ordenar}
            className="w-full flex items-center justify-between rounded-2xl border border-base-600 bg-base-800 px-4 py-3 mb-2"
          >
            <span className="text-base font-medium">↕️ Mudar a ordem ({lista.length})</span>
            <ChevronDown size={18} className={`text-ink-400 transition-transform ${ordenar ? "rotate-180" : ""}`} />
          </button>
          {!ordenar ? null : lista.length === 0 ? (
            <p className="text-sm text-ink-400 border border-dashed border-base-600 rounded-2xl p-4 mb-6">Nada escolhido — ligue alguns blocos aqui em cima.</p>
          ) : (
            <ul className="space-y-2 mb-2">
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
