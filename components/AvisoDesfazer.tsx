"use client";

// Etapa 276 — aviso "Excluído · Desfazer" embaixo da tela, com a
// barrinha do tempo correndo.
import { useEffect, useState } from "react";
import { Undo2 } from "lucide-react";
import { EVENTO_DESFAZER, desfazerAgora, executarPendentes, listaPendentes, type ItemDesfazer } from "@/lib/app/desfazer";
import { vibrar } from "@/lib/app/vibrar";

export function AvisoDesfazer() {
  const [itens, setItens] = useState<ItemDesfazer[]>([]);

  useEffect(() => {
    setItens(listaPendentes());
    const aoMudar = (e: Event) => setItens((e as CustomEvent<ItemDesfazer[]>).detail);
    // app indo pro fundo/fechando: não deixa exclusão "pendurada"
    const aoEsconder = () => {
      if (document.visibilityState === "hidden") executarPendentes();
    };
    window.addEventListener(EVENTO_DESFAZER, aoMudar);
    document.addEventListener("visibilitychange", aoEsconder);
    window.addEventListener("pagehide", executarPendentes);
    return () => {
      window.removeEventListener(EVENTO_DESFAZER, aoMudar);
      document.removeEventListener("visibilitychange", aoEsconder);
      window.removeEventListener("pagehide", executarPendentes);
    };
  }, []);

  const item = itens[itens.length - 1];
  if (!item) return null;
  const duracao = Math.max(0, item.ate - Date.now());

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] lg:pb-6 pointer-events-none">
      <div
        key={item.id}
        role="status"
        className="pointer-events-auto relative overflow-hidden w-full max-w-sm flex items-center gap-3 rounded-2xl bg-ink-100 text-base-900 shadow-2xl pl-4 pr-2 py-2.5 animate-descer"
      >
        <span className="flex-1 min-w-0 text-sm font-medium truncate">
          {item.texto}
          {itens.length > 1 && <span className="opacity-60"> (+{itens.length - 1})</span>}
        </span>
        <button
          type="button"
          onClick={() => {
            vibrar(10);
            void desfazerAgora(item.id);
          }}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold bg-base-900/10 hover:bg-base-900/20 active:scale-95 transition"
        >
          <Undo2 size={16} /> Desfazer
        </button>
        <span
          aria-hidden
          className="absolute left-0 bottom-0 h-0.5 bg-nota"
          style={{ animation: `vt-tempo-desfazer ${duracao}ms linear forwards` }}
        />
      </div>
      <style>{`@keyframes vt-tempo-desfazer { from { width: 100%; } to { width: 0%; } }`}</style>
    </div>
  );
}
