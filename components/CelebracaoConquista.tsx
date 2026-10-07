"use client";

// Etapa 273 — conquista de sequência com confete, número que conta e
// chama tremulando.
import { useEffect } from "react";
import { chuvaDeConfete } from "@/lib/app/festa";
import { NumeroAnimado } from "@/components/NumeroAnimado";

const MENSAGENS: Record<number, string> = {
  7: "Uma semana inteira seguida!",
  30: "Um mês inteiro seguido — isso já é hábito de verdade!",
  100: "100 dias seguidos. Sério, isso é notável.",
  365: "Um ano inteiro seguido. 🏆",
};

export function CelebracaoConquista({
  marco,
  nomeHabito,
  onFechar,
}: {
  marco: number;
  nomeHabito: string;
  onFechar: () => void;
}) {
  useEffect(() => {
    chuvaDeConfete({ quantidade: 90, duracao: 3000 });
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 animate-fundo" onClick={onFechar}>
      <div
        className="animate-quicar bg-base-800 border border-habito rounded-xl2 p-6 max-w-sm w-full text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-5xl mb-3 inline-block animate-chama">🔥</p>
        <p className="text-3xl font-display font-bold text-habito mb-2">
          <NumeroAnimado valor={marco} /> dias
        </p>
        <p className="text-sm text-ink-400 mb-1">{nomeHabito}</p>
        <p className="text-sm mb-6">{MENSAGENS[marco] ?? "Sequência incrível!"}</p>
        <button
          onClick={onFechar}
          className="w-full bg-habito text-base-900 font-medium rounded-2xl py-3.5 hover:opacity-90 active:scale-95 transition"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
