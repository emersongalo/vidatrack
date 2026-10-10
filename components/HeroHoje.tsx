"use client";

// Etapa 227 — topo do "Hoje" no mesmo estilo do topo de Finanças:
// anel do dia, sequência, semana e a barra de dias ‹ Ontem · Hoje · Amanhã ›.
import { useState } from "react";
import { AnelProgresso } from "@/components/AnelProgresso";
import { NumeroAnimado } from "@/components/NumeroAnimado";
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
    "w-10 h-10 rounded-full bg-base-800 border border-base-600 flex items-center justify-center text-xl text-ink-100 hover:bg-base-700 active:scale-95 transition shrink-0";
  const faltam = total - feitos;
  const ceu = ceuDaHora(dataSelecionada === hoje ? new Date().getHours() : null);

  return (
    <div className="mb-6">
      {/* Etapa 285 — um cartão só: anel, quanto falta e os números do lado */}
      <div className={`relative overflow-hidden rounded-3xl border p-4 mb-3 transition-colors duration-700 ${ceu.borda}`} style={{ background: ceu.fundo }}>
        {/* Etapa 286 — o céu do topo muda com a hora do dia */}
        <span aria-hidden className="absolute right-4 top-3 text-2xl opacity-80 animate-boiar pointer-events-none">
          {ceu.astro}
        </span>
        {ceu.estrelas &&
          [
            [62, 18, 0],
            [74, 46, 0.8],
            [86, 30, 1.6],
            [54, 62, 2.2],
            [92, 70, 1.1],
          ].map(([x, y, d], i) => (
            <span
              key={i}
              aria-hidden
              className="absolute w-1 h-1 rounded-full bg-white animate-cintilar pointer-events-none"
              style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }}
            />
          ))}
        <div className="flex items-center gap-4">
          <AnelProgresso valor={feitos} total={total} tamanho={76} />
          <div className="min-w-0 flex-1 pr-7">
            <p key={faltam} className="text-2xl font-display font-bold leading-tight animate-surgir">
              {total === 0 ? "Dia livre 🌿" : faltam === 0 ? "Tudo feito! 🎉" : `Faltam ${faltam}`}
            </p>
            <p className="text-sm text-ink-400">
              {feitos} de {total} {dataSelecionada === hoje ? "hoje" : "nesse dia"}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  sequencia >= 30 ? "bg-amber-400/20 text-amber-300" : "bg-base-900/40"
                }`}
              >
                {/* Etapa 286 — a chama cresce com a sequência (7+ balança, 30+ fica dourada) */}
                <span
                  className={`inline-block origin-bottom ${sequencia >= 7 ? "animate-chama" : ""} ${sequencia >= 30 ? "chama-ouro" : ""}`}
                  style={{ fontSize: sequencia >= 30 ? "1.35em" : sequencia >= 7 ? "1.18em" : "1em" }}
                >
                  🔥
                </span>
                <NumeroAnimado valor={sequencia} /> {sequencia === 1 ? "dia" : "dias"}
              </span>
              {taxaSemana !== null && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-base-900/40">
                  📈 <NumeroAnimado valor={taxaSemana} sufixo="%" /> na semana
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* dias: ‹ dia › com a semana a um toque */}
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => aoMudarData(anterior)} aria-label="Dia anterior" className={botao}>
          ‹
        </button>
        <button onClick={() => setMostrarDias((v) => !v)} className="flex-1 text-center min-w-0 px-1 py-1 rounded-full hover:bg-base-800 transition">
          <span className="block text-base font-semibold truncate">{rotuloDoDia(dataSelecionada, hoje)}</span>
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
            <span className="text-xs text-ink-400">{mostrarDias ? "fechar semana" : "ver semana"}</span>
          )}
        </button>
        <button onClick={() => aoMudarData(proximo)} aria-label="Próximo dia" className={botao}>
          ›
        </button>
      </div>

      {mostrarDias && (
        <div className="mt-3 animate-surgir">
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

/** Etapa 286 — cor do topo conforme a hora: manhã amarelada, tarde
 *  alaranjada, noite azul com lua e estrelas. Outro dia: verde de sempre. */
export function ceuDaHora(hora: number | null): { fundo: string; borda: string; astro: string; estrelas: boolean } {
  if (hora === null)
    return {
      fundo: "linear-gradient(135deg, rgb(var(--c-habito) / 0.20), rgb(var(--c-habito) / 0.04))",
      borda: "border-habito/30",
      astro: "🌿",
      estrelas: false,
    };
  if (hora >= 5 && hora < 12)
    return {
      fundo: "linear-gradient(140deg, rgba(250, 204, 21, 0.24), rgba(127, 184, 148, 0.10) 60%, rgb(var(--c-habito) / 0.04))",
      borda: "border-amber-300/30",
      astro: "☀️",
      estrelas: false,
    };
  if (hora >= 12 && hora < 18)
    return {
      fundo: "linear-gradient(140deg, rgba(251, 146, 60, 0.24), rgba(244, 114, 182, 0.08) 60%, rgb(var(--c-habito) / 0.04))",
      borda: "border-orange-300/30",
      astro: "🌤️",
      estrelas: false,
    };
  return {
    fundo: "linear-gradient(160deg, rgba(49, 46, 129, 0.45), rgba(30, 58, 138, 0.22) 55%, rgba(15, 23, 42, 0.10))",
    borda: "border-indigo-300/25",
    astro: "🌙",
    estrelas: true,
  };
}
