"use client";

// Etapa 261 — aviso animado de conexão, em qualquer tela:
// caiu a internet → cartãozinho com o logo "desmontado" boiando;
// voltou → o logo se monta de novo, brilha e some sozinho.
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { LogoAnimado } from "@/components/LogoAnimado";
import { vibrar } from "@/lib/app/vibrar";
import { lerFila, EVENTO_FILA_MUDOU } from "@/lib/offline/fila";

type Estado = "oculto" | "offline" | "voltou";

export function IndicadorConexao() {
  const [estado, setEstado] = useState<Estado>("oculto");
  const [minimizado, setMinimizado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Etapa 276 — quantas alterações estão guardadas esperando internet
  const [naFila, setNaFila] = useState(0);
  useEffect(() => {
    setNaFila(lerFila().length);
    const aoMudar = (e: Event) => setNaFila(Number((e as CustomEvent<number>).detail) || 0);
    window.addEventListener(EVENTO_FILA_MUDOU, aoMudar);
    return () => window.removeEventListener(EVENTO_FILA_MUDOU, aoMudar);
  }, []);

  useEffect(() => {
    // espera um pouquinho antes de avisar (quedas de 1–2s não precisam de aviso)
    let atraso: ReturnType<typeof setTimeout> | null = null;
    const caiu = () => {
      if (atraso) clearTimeout(atraso);
      atraso = setTimeout(() => {
        if (!navigator.onLine) {
          if (timer.current) clearTimeout(timer.current);
          setMinimizado(false);
          setEstado("offline");
        }
      }, 1500);
    };
    const voltou = () => {
      if (atraso) clearTimeout(atraso);
      setEstado((e) => {
        if (e !== "offline") return e;
        vibrar([10, 30, 20]);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setEstado("oculto"), 3200);
        return "voltou";
      });
    };
    if (!navigator.onLine) caiu();
    window.addEventListener("offline", caiu);
    window.addEventListener("online", voltou);
    return () => {
      window.removeEventListener("offline", caiu);
      window.removeEventListener("online", voltou);
      if (atraso) clearTimeout(atraso);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (estado === "oculto") return null;

  // minimizado: só uma bolinha no canto
  if (estado === "offline" && minimizado) {
    return (
      <button
        type="button"
        onClick={() => setMinimizado(false)}
        aria-label="Sem internet — ver detalhes"
        className="fixed z-[70] right-3 top-3 rounded-2xl shadow-lg shadow-black/40 animate-surgir"
        style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <LogoAnimado estado="offline" tamanho={40} />
        {naFila > 0 && (
          <span
            key={naFila}
            className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-financa text-base-900 text-[11px] font-bold flex items-center justify-center animate-pop"
          >
            {naFila}
          </span>
        )}
      </button>
    );
  }

  const off = estado === "offline";
  return (
    <div
      className="fixed z-[70] left-3 right-3 flex justify-center pointer-events-none animate-surgir"
      style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto w-full max-w-md flex items-center gap-3 rounded-3xl border p-3 pr-4 shadow-xl shadow-black/40 backdrop-blur transition-colors duration-500 ${
          off ? "bg-base-800/95 border-base-600" : "bg-base-800/95 border-habito/50"
        }`}
      >
        <LogoAnimado estado={off ? "offline" : "online"} tamanho={56} />
        <div className="flex-1 min-w-0">
          <p className={`text-base font-semibold ${off ? "" : "text-habito"}`}>{off ? "Sem internet" : "Conectado de novo! ✨"}</p>
          <p className="text-xs text-ink-400">
            {off ? "Pode continuar usando: o que você marcar fica salvo e sincroniza quando voltar." : "Sincronizando o que você fez enquanto estava offline."}
          </p>
          {off && naFila > 0 && (
            <p key={naFila} className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-financa bg-financa/10 rounded-full px-2.5 py-0.5 animate-pop">
              📦 {naFila} {naFila === 1 ? "alteração guardada" : "alterações guardadas"} esperando internet
            </p>
          )}
        </div>
        {off && (
          <button type="button" onClick={() => setMinimizado(true)} aria-label="Minimizar" className="text-ink-400 hover:text-ink-100 p-1 -m-1 shrink-0">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
