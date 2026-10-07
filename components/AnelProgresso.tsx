"use client";

import { useContagem } from "@/components/NumeroAnimado";

// Etapa 227 — anel de progresso (usado no topo do Hoje e no detalhe do hábito)
export function AnelProgresso({
  valor,
  total,
  tamanho = 84,
  texto,
  classeCor = "stroke-habito",
}: {
  valor: number;
  total: number;
  tamanho?: number;
  texto?: string;
  classeCor?: string;
}) {
  const r = 34;
  const c = 2 * Math.PI * r;
  // Etapa 230 — o anel "enche" ao abrir a tela e quando o valor muda
  const pct = useContagem(total > 0 ? Math.min(1, valor / total) : 0, 700);
  return (
    // Etapa 273 — completo: o anel brilha e "respira"
    <div
      className={`relative shrink-0 rounded-full ${total > 0 && valor >= total ? "animate-brilhar" : ""}`}
      style={{ width: tamanho, height: tamanho }}
    >
      <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90">
        <circle cx="42" cy="42" r={r} fill="none" strokeWidth="9" className="stroke-base-700" />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className={classeCor}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span
        key={valor}
        className={`absolute inset-0 flex items-center justify-center text-lg font-mono font-semibold ${valor > 0 ? "animate-pop" : ""}`}
      >
        {texto ?? `${valor}/${total}`}
      </span>
    </div>
  );
}
