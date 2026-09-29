"use client";

// Etapa 227 — topo do "Hoje" no mesmo estilo do topo de Finanças:
// anel do dia, sequência, semana e a barra de dias ‹ Ontem · Hoje · Amanhã ›.
import { useState } from "react";
import { AnelProgresso } from "@/components/AnelProgresso";
import { TiraDeDiasAgenda } from "@/components/TiraDeDiasAgenda";
import { rotuloDoDia } from "@/lib/financas/agruparPorDia";

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

export function HeroHoje({
  feitos,
  total,
  sequencia,
  taxaSemana,
  dataSelecionada,
  hoje,
  aoMudarData,
}: {
  feitos: number;
  total: number;
  sequencia: number;
  taxaSemana: number | null;
  dataSelecionada: string;
  hoje: string;
  aoMudarData: (iso: string) => void;
}) {
  const [mostrarDias, setMostrarDias] = useState(false);
  const anterior = somarDias(dataSelecionada, -1);
  const proximo = somarDias(dataSelecionada, 1);
  const botao =
    "w-11 h-11 rounded-full border border-base-600 flex items-center justify-center text-xl text-ink-100 hover:bg-base-700 transition shrink-0";
  const faltam = total - feitos;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 mb-5">
        <AnelProgresso valor={feitos} total={total} />
        <div className="min-w-0">
          <p className="text-2xl font-display font-bold leading-tight">
            {total === 0 ? "Dia livre 🌿" : faltam === 0 ? "Tudo feito! 🎉" : `Faltam ${faltam}`}
          </p>
          <p className="text-base text-ink-400">
            {feitos} de {total} {dataSelecionada === hoje ? "hoje" : "nesse dia"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-base-800 border border-base-600 rounded-2xl px-3.5 py-3">
          <p className="text-sm text-ink-400">🔥 Maior sequência</p>
          <p className="text-lg font-semibold mt-0.5">
            {sequencia} {sequencia === 1 ? "dia" : "dias"}
          </p>
        </div>
        <div className="bg-base-800 border border-base-600 rounded-2xl px-3.5 py-3">
          <p className="text-sm text-ink-400">📈 Últimos 7 dias</p>
          <p className="text-lg font-semibold mt-0.5">{taxaSemana === null ? "—" : `${taxaSemana}%`}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 bg-base-800 border border-base-600 rounded-full px-2 py-2">
        <button onClick={() => aoMudarData(anterior)} aria-label="Dia anterior" className={botao}>
          ‹
        </button>
        <span className="hidden min-[380px]:block text-sm text-ink-400 truncate">{rotuloDoDia(anterior, hoje)}</span>
        <button onClick={() => setMostrarDias((v) => !v)} className="text-center min-w-0 px-1">
          <span className="block text-lg font-semibold truncate">{rotuloDoDia(dataSelecionada, hoje)}</span>
          {dataSelecionada !== hoje ? (
            <span
              role="link"
              onClick={(e) => {
                e.stopPropagation();
                aoMudarData(hoje);
              }}
              className="text-xs text-habito"
            >
              Voltar pra hoje
            </span>
          ) : (
            <span className="text-xs text-ink-400">{mostrarDias ? "fechar" : "ver semana"}</span>
          )}
        </button>
        <span className="hidden min-[380px]:block text-sm text-ink-400 truncate">{rotuloDoDia(proximo, hoje)}</span>
        <button onClick={() => aoMudarData(proximo)} aria-label="Próximo dia" className={botao}>
          ›
        </button>
      </div>

      {mostrarDias && (
        <div className="mt-3">
          <TiraDeDiasAgenda
            dataSelecionada={dataSelecionada}
            hojeISO={hoje}
            aoSelecionarData={(d) => {
              aoMudarData(d);
              setMostrarDias(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
