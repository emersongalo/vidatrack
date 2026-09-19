"use client";

import { useState } from "react";
import { Mic, Loader2 } from "lucide-react";
import { interpretarFala, type ResultadoFala } from "@/lib/financas/parseFala";

/**
 * Etapa 141 — usa o reconhecimento de fala que já vem embutido no
 * navegador (a mesma engine do Chrome/Android) — sem custo nenhum,
 * sem chave de API. O que a gente escreveu é só a parte de
 * "entender" o texto reconhecido (lib/financas/parseFala.ts).
 */
export function BotaoDitarTransacao({ aoReconhecer }: { aoReconhecer: (resultado: ResultadoFala) => void }) {
  const [ouvindo, setOuvindo] = useState(false);
  const [semSuporte, setSemSuporte] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function iniciar() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSemSuporte(true);
      return;
    }

    setErro(null);
    const reconhecimento = new SpeechRecognition();
    reconhecimento.lang = "pt-BR";
    reconhecimento.interimResults = false;
    reconhecimento.maxAlternatives = 1;

    reconhecimento.onstart = () => setOuvindo(true);
    reconhecimento.onend = () => setOuvindo(false);
    reconhecimento.onerror = () => {
      setOuvindo(false);
      setErro("Não consegui ouvir. Tenta de novo?");
    };
    reconhecimento.onresult = (evento: any) => {
      const texto = evento.results[0][0].transcript as string;
      aoReconhecer(interpretarFala(texto));
    };

    reconhecimento.start();
  }

  if (semSuporte) return null; // navegador sem suporte — some sem quebrar nada

  return (
    <div>
      <button
        type="button"
        onClick={iniciar}
        disabled={ouvindo}
        aria-label="Ditar lançamento por voz"
        className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border transition ${
          ouvindo ? "border-financa text-financa" : "border-base-600 text-ink-400 hover:text-ink-100 hover:border-ink-400"
        }`}
      >
        {ouvindo ? <Loader2 size={16} strokeWidth={2} className="animate-spin" /> : <Mic size={16} strokeWidth={2} />}
        {ouvindo ? "Ouvindo..." : "Falar o lançamento"}
      </button>
      {erro && <p className="text-xs text-red-400 mt-1.5">{erro}</p>}
    </div>
  );
}
