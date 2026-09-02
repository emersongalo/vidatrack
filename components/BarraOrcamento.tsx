import { ValorMonetario } from "@/components/ValorMonetario";

export function BarraOrcamento({
  nome,
  gasto,
  meta,
}: {
  nome: string;
  gasto: number;
  meta: number;
}) {
  const percentual = Math.min(100, Math.round((gasto / meta) * 100));
  const estourou = gasto > meta;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm">{nome}</span>
        <span className={`text-xs font-mono ${estourou ? "text-red-400" : "text-ink-400"}`}>
          <ValorMonetario valor={gasto} /> / <ValorMonetario valor={meta} />
        </span>
      </div>
      <div className="h-1.5 bg-base-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${estourou ? "bg-red-400" : "bg-financa"}`}
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  );
}
