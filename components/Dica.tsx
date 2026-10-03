"use client";

// Etapa 250 — dica do dia no lugar certo. Dá pra fechar (volta outro dia, com outra dica).
import { useEffect, useState } from "react";
import { Lightbulb, X } from "lucide-react";
import { dicaDoDia, type ContextoDica } from "@/lib/geral/dicas";

export function Dica({ contexto, className = "" }: { contexto: ContextoDica; className?: string }) {
  const [hoje, setHoje] = useState<string | null>(null);
  const [fechada, setFechada] = useState(true);
  const chave = `vidatrack-dica-${contexto}`;

  useEffect(() => {
    const h = new Date().toLocaleDateString("sv-SE");
    setHoje(h);
    try {
      setFechada(localStorage.getItem(chave) === h);
    } catch {
      setFechada(false);
    }
  }, [chave]);

  if (!hoje || fechada) return null;

  return (
    <div className={`animate-surgir flex items-start gap-3 bg-base-800 border border-base-600 rounded-2xl p-3.5 mb-6 ${className}`}>
      <span className="w-8 h-8 rounded-lg bg-financa/15 text-financa flex items-center justify-center shrink-0">
        <Lightbulb size={16} />
      </span>
      <p className="flex-1 text-sm text-ink-400">
        <span className="text-ink-100 font-medium">Dica: </span>
        {dicaDoDia(contexto, hoje)}
      </p>
      <button
        type="button"
        aria-label="Fechar dica"
        onClick={() => {
          setFechada(true);
          try {
            localStorage.setItem(chave, hoje);
          } catch {}
        }}
        className="text-ink-400 hover:text-ink-100 p-1 -m-1"
      >
        <X size={14} />
      </button>
    </div>
  );
}
