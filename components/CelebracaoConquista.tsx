"use client";

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
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70"
      onClick={onFechar}
    >
      <div
        className="bg-base-800 border border-habito rounded-xl2 p-6 max-w-sm w-full text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-4xl mb-3">🎉</p>
        <p className="text-3xl font-display font-bold text-habito mb-2">{marco} dias</p>
        <p className="text-sm text-ink-400 mb-1">{nomeHabito}</p>
        <p className="text-sm mb-6">{MENSAGENS[marco] ?? "Sequência incrível!"}</p>
        <button
          onClick={onFechar}
          className="w-full bg-habito text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
