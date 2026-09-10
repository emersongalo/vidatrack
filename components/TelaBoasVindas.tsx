"use client";

import { useState } from "react";
import Image from "next/image";
import { concluirOnboarding } from "./actions";

const PASSOS = [
  {
    titulo: "Bem-vindo ao VidaTrack",
    texto: "Um app só, sem assinatura, pra cuidar dos seus hábitos e das suas finanças.",
  },
  {
    titulo: "Hábitos",
    texto: "Marque o que fez no dia, acompanhe sua sequência, e veja sua constância crescer com o tempo.",
  },
  {
    titulo: "Finanças",
    texto: "Lance receitas e despesas, separe contas e investimentos, e entenda pra onde vai seu dinheiro.",
  },
];

export function TelaBoasVindas() {
  const [passo, setPasso] = useState(0);
  const ultimoPasso = passo === PASSOS.length - 1;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <Image src="/icons/icon-192.png" alt="VidaTrack" width={96} height={96} className="rounded-2xl mb-8" />

      <h1 className="text-2xl font-display font-semibold mb-3">{PASSOS[passo].titulo}</h1>
      <p className="text-ink-400 max-w-xs mb-10">{PASSOS[passo].texto}</p>

      <div className="flex gap-1.5 mb-8">
        {PASSOS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === passo ? "w-6 bg-habito" : "w-1.5 bg-base-600"
            }`}
          />
        ))}
      </div>

      {ultimoPasso ? (
        <form action={concluirOnboarding} className="w-full max-w-xs">
          <button
            type="submit"
            className="w-full bg-ink-100 text-base-900 font-medium rounded-lg py-3 hover:opacity-90 transition"
          >
            Começar
          </button>
        </form>
      ) : (
        <button
          onClick={() => setPasso((p) => p + 1)}
          className="w-full max-w-xs bg-ink-100 text-base-900 font-medium rounded-lg py-3 hover:opacity-90 transition"
        >
          Próximo
        </button>
      )}

      {!ultimoPasso && (
        <form action={concluirOnboarding} className="mt-4">
          <button type="submit" className="text-sm text-ink-400 hover:text-ink-100 transition">
            Pular
          </button>
        </form>
      )}
    </main>
  );
}
