"use client";

// Etapa 275 — nível do hábito: a plantinha cresce a cada dia feito.
import { useEffect, useState } from "react";
import { NIVEIS, nivelPorDias } from "@/lib/habitos/nivel";

export function CartaoNivel({ dias, hex }: { dias: number; hex: string }) {
  const n = nivelPorDias(dias);
  // a barra "enche" ao abrir a tela
  const [largura, setLargura] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setLargura(Math.round(n.progresso * 100)), 80);
    return () => clearTimeout(t);
  }, [n.progresso]);

  return (
    <div className="relative overflow-hidden bg-base-800 border border-base-600 rounded-3xl p-5 mb-6">
      <span aria-hidden className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-25" style={{ background: hex }} />
      <div className="relative flex items-center gap-4">
        <span
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 animate-boiar"
          style={{ background: `${hex}26` }}
          aria-hidden
        >
          {n.atual.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-ink-400">Nível {n.atual.numero}</p>
          <p className="text-xl font-semibold truncate">{n.atual.nome}</p>
          <p className="text-sm text-ink-400">
            {n.proximo
              ? `Faltam ${n.faltam} dia${n.faltam > 1 ? "s" : ""} pra ${n.proximo.emoji} ${n.proximo.nome}`
              : "Nível máximo. Você é lenda! 👑"}
          </p>
        </div>
      </div>

      <div className="relative h-2.5 rounded-full bg-base-900 mt-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${largura}%`, background: `linear-gradient(90deg, ${hex}99, ${hex})` }}
        />
      </div>

      <div className="relative flex justify-between mt-3 text-lg" aria-label="Caminho dos níveis">
        {NIVEIS.map((nv) => (
          <span
            key={nv.numero}
            title={`${nv.nome} · ${nv.minimo} dias`}
            className={`transition ${nv.numero <= n.atual.numero ? "" : "grayscale opacity-30"} ${
              nv.numero === n.atual.numero ? "scale-125" : ""
            }`}
          >
            {nv.emoji}
          </span>
        ))}
      </div>
      <p className="relative text-xs text-ink-400 mt-2">{n.dias} dia{n.dias === 1 ? "" : "s"} feitos no total</p>
    </div>
  );
}
