"use client";

// Etapa 239 — na página de apresentação: a cena do "Juntos" ao vivo,
// com plantinhas de exemplo e o céu da hora de quem está vendo.
import { useEffect, useState } from "react";
import { CenaJuntos } from "@/components/CenaJuntos";
import { CarinhaDupla } from "@/components/CarinhaDupla";
import { PlantaDupla } from "@/components/PlantaDupla";
import { periodoDoDia, type PeriodoDoDia } from "@/lib/painel/periodo";
import type { HumorDupla } from "@/lib/habitos/dupla";

const VAZIO_ACIMA = [58, 54, 44, 32, 24, 18, 8];
const EXEMPLOS: { nome: string; estagio: number; humor: HumorDupla; texto: string }[] = [
  { nome: "Bíblia", estagio: 5, humor: "festa", texto: "🔥 32 juntos" },
  { nome: "Caminhar", estagio: 3, humor: "esperandoVoce", texto: "Ana já fez" },
  { nome: "Ler", estagio: 1, humor: "esperandoParceiro", texto: "Falta o Léo" },
];

export function DemoJuntos() {
  const [periodo, setPeriodo] = useState<PeriodoDoDia>("dia");
  useEffect(() => setPeriodo(periodoDoDia(new Date().getHours())), []);
  const tamanho = 80;
  const escala = (tamanho * 1.2) / 96;

  return (
    <div className="bg-base-800 border border-base-700 rounded-3xl p-4 shadow-2xl shadow-black/40">
      <CenaJuntos periodo={periodo} festa>
        {EXEMPLOS.map((e, i) => (
          <div key={e.nome} className="flex flex-col items-center">
            <span className="animate-boiar relative z-10" style={{ marginBottom: -(Math.round(VAZIO_ACIMA[e.estagio] * escala) - 6), animationDelay: `${-i * 0.6}s` }}>
              <CarinhaDupla humor={e.humor} tamanho={34} />
            </span>
            <PlantaDupla estagio={e.estagio} saude={2} tamanho={tamanho} />
          </div>
        ))}
      </CenaJuntos>
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        {EXEMPLOS.map((e) => (
          <div key={e.nome}>
            <p className="text-sm font-medium">{e.nome}</p>
            <p className="text-xs text-ink-400">{e.texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
