import { DiaPrevisao, traduzirCodigoTempo } from "@/lib/clima/consulta";

const ABREVIACOES_DIA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function WidgetClima({ previsao, localNome }: { previsao: DiaPrevisao[]; localNome: string }) {
  return (
    <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
      <p className="text-xs text-ink-400 mb-3">📍 {localNome}</p>
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {previsao.map((dia, i) => {
          const { emoji } = traduzirCodigoTempo(dia.codigo);
          const diaSemana = new Date(dia.data + "T12:00:00").getDay();
          return (
            <div key={dia.data} className="flex flex-col items-center gap-1 px-2 py-1 shrink-0 min-w-[52px]">
              <span className="text-[11px] text-ink-400">
                {i === 0 ? "Hoje" : ABREVIACOES_DIA[diaSemana]}
              </span>
              <span className="text-xl">{emoji}</span>
              <span className="text-xs font-mono">{dia.tempMax}°</span>
              <span className="text-xs font-mono text-ink-400">{dia.tempMin}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
