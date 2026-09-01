"use client";

import { useTransition } from "react";
import { alternarCheckin } from "@/app/habitos/actions";

const CORES: Record<string, string> = {
  habito: "bg-habito border-habito",
  nota: "bg-nota border-nota",
  financa: "bg-financa border-financa",
};

export function BotaoCheckin({
  habitoId,
  feito,
  cor,
}: {
  habitoId: string;
  feito: boolean;
  cor: string;
}) {
  const [pendente, iniciarTransicao] = useTransition();

  return (
    <button
      onClick={() => iniciarTransicao(() => alternarCheckin(habitoId))}
      disabled={pendente}
      aria-pressed={feito}
      aria-label={feito ? "Desmarcar hábito de hoje" : "Marcar hábito como feito hoje"}
      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition shrink-0 ${
        feito ? CORES[cor] ?? CORES.habito : "border-base-600 hover:border-ink-400"
      } ${pendente ? "opacity-60" : ""}`}
    >
      {feito && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8.5L6.2 11.5L13 4.5"
            stroke="#0F1013"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
