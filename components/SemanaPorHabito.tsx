"use client";

// Etapa 230 — "sua semana por hábito": uma linha por hábito com os
// últimos 7 dias em quadradinhos na cor do hábito.
import Link from "next/link";
import { hexDaCor } from "@/lib/agenda/estilo";
import { ultimosDias } from "@/lib/habitos/detalhe";

const LETRAS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function SemanaPorHabito({ habitos, checkins, hoje }: { habitos: any[]; checkins: any[]; hoje: string }) {
  const lista = habitos.filter((h) => !h.eh_negativo);
  if (!lista.length) return null;
  const dias = ultimosDias(lista[0], [], hoje).map((d) => d.dia);

  return (
    <div className="bg-base-800 border border-base-600 rounded-2xl p-5 mb-6">
      <h2 className="text-lg font-semibold mb-3">Sua semana por hábito</h2>
      <div className="grid grid-cols-[minmax(0,1fr)_repeat(7,1.75rem)] gap-1.5 items-center">
        <span />
        {dias.map((d) => (
          <span key={d} className={`text-xs text-center ${d === hoje ? "text-ink-100 font-semibold" : "text-ink-400"}`}>
            {LETRAS[new Date(d + "T12:00:00").getDay()]}
          </span>
        ))}
        {lista.map((h) => {
          const hex = hexDaCor(h.cor);
          const semana = ultimosDias(h, checkins, hoje);
          const feitos = semana.filter((d) => d.estado === "feito").length;
          return (
            <div key={h.id} className="contents">
              <Link href={`/habitos/${h.id}`} className="text-sm truncate pr-2 hover:text-ink-100">
                {h.nome} <span className="text-xs text-ink-400">{feitos}/7</span>
              </Link>
              {semana.map((d) => (
                <span
                  key={d.dia}
                  title={d.dia.split("-").reverse().slice(0, 2).join("/")}
                  className={`h-7 rounded-lg ${d.estado === "falhou" ? "bg-base-700" : d.estado === "folga" ? "border border-dashed border-base-600" : ""}`}
                  style={d.estado === "feito" ? { backgroundColor: hex } : undefined}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
