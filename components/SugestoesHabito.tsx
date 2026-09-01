"use client";

import { useTransition } from "react";
import { criarHabitoRapido } from "@/app/habitos/actions";

const SUGESTOES = [
  { nome: "Beber água", icone: "💧" },
  { nome: "Exercitar-se", icone: "🏃" },
  { nome: "Ler", icone: "📖" },
  { nome: "Meditar", icone: "🧘" },
  { nome: "Dormir cedo", icone: "😴" },
];

export function SugestoesHabito() {
  const [pendente, iniciarTransicao] = useTransition();

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      {SUGESTOES.map((s) => (
        <button
          key={s.nome}
          disabled={pendente}
          onClick={() => iniciarTransicao(() => criarHabitoRapido(s.nome))}
          className="text-sm border border-base-600 rounded-full px-3 py-1.5 hover:border-habito hover:text-habito transition disabled:opacity-50"
        >
          {s.icone} {s.nome}
        </button>
      ))}
    </div>
  );
}
