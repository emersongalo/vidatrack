"use client";

import { useTransition } from "react";
import { criarHabitoRapido } from "@/app/habitos/actions";
import { IconeHabito } from "@/components/IconeHabito";

const SUGESTOES = [
  { nome: "Beber água", icone: "Droplet" },
  { nome: "Exercitar-se", icone: "Footprints" },
  { nome: "Ler", icone: "BookOpen" },
  { nome: "Meditar", icone: "Flower2" },
  { nome: "Dormir cedo", icone: "Moon" },
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
          className="flex items-center gap-1.5 text-sm border border-base-600 rounded-full px-3 py-1.5 hover:border-habito hover:text-habito transition disabled:opacity-50"
        >
          <IconeHabito icone={s.icone} tamanho={15} /> {s.nome}
        </button>
      ))}
    </div>
  );
}
