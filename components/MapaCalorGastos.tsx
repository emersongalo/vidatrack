"use client";

import { formatarMoeda } from "@/lib/financas/formatacao";

const LETRAS_DIA = ["D", "S", "T", "Q", "Q", "S", "S"];
// Do mais fraco pro mais intenso — mesma ideia do mapa de calor que
// você mandou de referência, só que nas cores do próprio app.
const NIVEIS = ["bg-base-700", "bg-financa/25", "bg-financa/50", "bg-financa/75", "bg-red-400/70"];

/** "1234" → "1,2k", "85" → "85", "999" → "999" — os quadradinhos são
 *  pequenos demais pra "R$ 1.234,56" caber, então mostra arredondado. */
function formatarValorCompacto(valor: number): string {
  if (valor >= 1000) return `${(valor / 1000).toFixed(1).replace(".", ",")}k`;
  return String(Math.round(valor));
}

/**
 * Etapa 175 — "mapa de calor" de gastos por dia, inspirado num print
 * que você mandou de outro app (TaskLine): cada quadrado é um dia do
 * mês, quanto mais escuro/intenso, mais alto foi o gasto naquele dia
 * — dá pra ver o padrão (fim de semana mais caro, um pico isolado
 * etc.) só de bater o olho, sem ler número nenhum.
 */
export function MapaCalorGastos({
  anoMesISO,
  gastoPorDia,
}: {
  anoMesISO: string;
  /** dia do mês (1-31) → total gasto naquele dia */
  gastoPorDia: Map<number, number>;
}) {
  const [ano, mes] = anoMesISO.split("-").map(Number);
  const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay();
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const hoje = new Date();
  const ehMesAtual = hoje.getFullYear() === ano && hoje.getMonth() + 1 === mes;
  const diaDeHoje = ehMesAtual ? hoje.getDate() : null;

  const valores = Array.from(gastoPorDia.values()).filter((v) => v > 0);
  const maiorGasto = valores.length > 0 ? Math.max(...valores) : 0;

  function nivelDoDia(valor: number): number {
    if (valor <= 0 || maiorGasto === 0) return 0;
    const proporcao = valor / maiorGasto;
    if (proporcao > 0.75) return 4;
    if (proporcao > 0.5) return 3;
    if (proporcao > 0.25) return 2;
    return 1;
  }

  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center mb-1">
        {LETRAS_DIA.map((l, i) => (
          <span key={i} className="text-[10px] text-ink-400">
            {l}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {celulas.map((dia, i) => {
          if (!dia) return <div key={i} />;
          const valor = gastoPorDia.get(dia) ?? 0;
          const nivel = nivelDoDia(valor);
          const ehHoje = dia === diaDeHoje;
          return (
            <div
              key={i}
              title={valor > 0 ? `Dia ${dia}: ${formatarMoeda(valor)}` : `Dia ${dia}: sem gasto`}
              className={`aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 text-[10px] leading-none ${NIVEIS[nivel]} ${
                ehHoje ? "ring-2 ring-financa" : ""
              } ${nivel >= 3 ? "text-ink-100" : "text-ink-400"}`}
            >
              <span>{dia}</span>
              {valor > 0 && (
                <span className={`text-[9px] font-mono ${nivel >= 3 ? "text-ink-100" : "text-ink-300"}`}>
                  {formatarValorCompacto(valor)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-[11px] text-ink-400">
        <span>menos</span>
        {NIVEIS.map((cor, i) => (
          <span key={i} className={`w-3.5 h-3.5 rounded-sm ${cor}`} />
        ))}
        <span>mais</span>
      </div>
    </div>
  );
}
