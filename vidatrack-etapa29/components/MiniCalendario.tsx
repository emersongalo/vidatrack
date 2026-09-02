"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const LETRAS_DIA = ["D", "S", "T", "Q", "Q", "S", "S"];

export function MiniCalendario() {
  const router = useRouter();
  const hoje = new Date();
  const [mesVisivel, setMesVisivel] = useState(hoje.getMonth());
  const [anoVisivel, setAnoVisivel] = useState(hoje.getFullYear());

  const primeiroDiaSemana = new Date(anoVisivel, mesVisivel, 1).getDay();
  const diasNoMes = new Date(anoVisivel, mesVisivel + 1, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  function mudarMes(delta: number) {
    let novoMes = mesVisivel + delta;
    let novoAno = anoVisivel;
    if (novoMes < 0) {
      novoMes = 11;
      novoAno--;
    } else if (novoMes > 11) {
      novoMes = 0;
      novoAno++;
    }
    setMesVisivel(novoMes);
    setAnoVisivel(novoAno);
  }

  function irParaDia(dia: number) {
    const iso = `${anoVisivel}-${String(mesVisivel + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    router.push(`/habitos?data=${iso}`);
  }

  return (
    <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => mudarMes(-1)} className="text-ink-400 hover:text-ink-100 transition px-1">
          ‹
        </button>
        <p className="text-sm font-medium">
          {NOMES_MES[mesVisivel]} {anoVisivel}
        </p>
        <button onClick={() => mudarMes(1)} className="text-ink-400 hover:text-ink-100 transition px-1">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {LETRAS_DIA.map((l, i) => (
          <span key={i} className="text-[10px] text-ink-400">
            {l}
          </span>
        ))}
        {celulas.map((dia, i) => {
          const ehHoje =
            dia === hoje.getDate() && mesVisivel === hoje.getMonth() && anoVisivel === hoje.getFullYear();
          return (
            <button
              key={i}
              disabled={!dia}
              onClick={() => dia && irParaDia(dia)}
              className={`text-xs h-7 w-7 mx-auto rounded-full flex items-center justify-center transition ${
                !dia
                  ? ""
                  : ehHoje
                    ? "bg-habito text-base-900 font-semibold"
                    : "hover:bg-base-700 text-ink-100"
              }`}
            >
              {dia ?? ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
