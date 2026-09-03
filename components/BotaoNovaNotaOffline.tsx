"use client";

import { useState } from "react";
import { criarNota } from "@/app/notas/actions";
import { adicionarNaFila } from "@/lib/offline/fila";

export function BotaoNovaNotaOffline() {
  const [modoOffline, setModoOffline] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [criada, setCriada] = useState(false);

  function aoClicar(e: React.MouseEvent) {
    if (navigator.onLine) return; // deixa o <form action={criarNota}> normal cuidar disso
    e.preventDefault();
    setModoOffline(true);
  }

  function salvarOffline() {
    adicionarNaFila({
      id: crypto.randomUUID(),
      tipo: "criar_nota",
      titulo: titulo || "Sem título",
      conteudo,
      notaIdTemporario: crypto.randomUUID(),
    });
    setCriada(true);
    setTimeout(() => {
      setModoOffline(false);
      setCriada(false);
      setTitulo("");
      setConteudo("");
    }, 1800);
  }

  if (modoOffline) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60">
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-5 max-w-sm w-full">
          {criada ? (
            <p className="text-sm text-habito">📦 Guardada — vai aparecer assim que a internet voltar.</p>
          ) : (
            <>
              <p className="text-sm text-ink-400 mb-3">
                Sem conexão — escreve aqui, e a nota é criada de verdade assim que a internet voltar.
              </p>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título"
                autoFocus
                className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-ink-100 transition"
              />
              <textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                placeholder="Escreva algo..."
                rows={6}
                className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-ink-100 transition resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setModoOffline(false)}
                  className="flex-1 border border-base-600 rounded-lg py-2 text-sm hover:bg-base-700 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarOffline}
                  className="flex-1 bg-ink-100 text-base-900 font-medium rounded-lg py-2 text-sm hover:opacity-90 transition"
                >
                  Guardar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <form action={criarNota}>
      <button
        type="submit"
        onClick={aoClicar}
        className="bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition"
      >
        + Nova
      </button>
    </form>
  );
}
