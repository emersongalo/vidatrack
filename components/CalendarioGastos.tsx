import Link from "next/link";
import { formatarMoeda } from "@/lib/financas/formatacao";
import type { DiaComGasto } from "@/lib/financas/consulta";

const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const LETRAS_DIA = ["D", "S", "T", "Q", "Q", "S", "S"];

export function CalendarioGastos({
  anoMesISO,
  gastosPorDia,
  diasComContaAPagar,
}: {
  anoMesISO: string;
  gastosPorDia: DiaComGasto[];
  diasComContaAPagar: number[];
}) {
  const [ano, mes] = anoMesISO.split("-").map(Number);
  const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay();
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const hoje = new Date();
  const ehMesAtual = hoje.getFullYear() === ano && hoje.getMonth() + 1 === mes;

  const mapaGastos = new Map(gastosPorDia.map((g) => [g.dia, g.total]));
  const setContaAPagar = new Set(diasComContaAPagar);

  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  function mesAnterior() {
    const d = new Date(ano, mes - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  function proximoMes() {
    const d = new Date(ano, mes, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  return (
    <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
      <div className="flex items-center justify-between mb-3">
        <Link
          href={`/financas?mesCalendario=${mesAnterior()}`}
          className="text-ink-400 hover:text-ink-100 transition px-1"
        >
          ‹
        </Link>
        <p className="text-sm font-medium">
          {NOMES_MES[mes - 1]} {ano}
        </p>
        <Link
          href={`/financas?mesCalendario=${proximoMes()}`}
          className="text-ink-400 hover:text-ink-100 transition px-1"
        >
          ›
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {LETRAS_DIA.map((l, i) => (
          <span key={i} className="text-[10px] text-ink-400">
            {l}
          </span>
        ))}
        {celulas.map((dia, i) => {
          const gasto = dia ? mapaGastos.get(dia) : undefined;
          const temGasto = !!gasto;
          const temContaAPagar = dia ? setContaAPagar.has(dia) : false;
          const ehHoje = ehMesAtual && dia === hoje.getDate();

          let classeCirculo = "text-ink-100";
          if (ehHoje) {
            classeCirculo = "bg-financa text-base-900 font-semibold";
          } else if (temGasto && temContaAPagar) {
            classeCirculo = "bg-red-400/25 text-red-300 font-semibold ring-2 ring-financa";
          } else if (temGasto) {
            classeCirculo = "bg-red-400/25 text-red-300 font-semibold";
          } else if (temContaAPagar) {
            classeCirculo = "ring-2 ring-financa text-financa font-semibold";
          }

          const titulo = [
            temGasto ? `Gasto: ${formatarMoeda(gasto!)}` : null,
            temContaAPagar ? "Tem conta a pagar" : null,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <div key={i} className="flex flex-col items-center min-h-[30px]">
              {dia && (
                <span
                  title={titulo || undefined}
                  className={`text-xs w-7 h-7 rounded-full flex items-center justify-center transition ${classeCirculo}`}
                >
                  {dia}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-base-600 text-[11px] text-ink-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400/25 ring-1 ring-red-400/60" /> Dia com gasto
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full ring-2 ring-financa" /> Conta a pagar
        </span>
      </div>
    </div>
  );
}
