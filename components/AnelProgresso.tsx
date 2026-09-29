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
  const pct = total > 0 ? Math.min(1, valor / total) : 0;
  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
      <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90">
        <circle cx="42" cy="42" r={r} fill="none" strokeWidth="9" className="stroke-base-700" />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className={`${classeCor} transition-all duration-500`}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-mono font-semibold">
        {texto ?? `${valor}/${total}`}
      </span>
    </div>
  );
}
