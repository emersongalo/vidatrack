"use client";

import { useState } from "react";
import { Mic, Loader2 } from "lucide-react";
import { interpretarFala, type ResultadoFala } from "@/lib/financas/parseFala";

function estaNoAppNativo() {
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

/**
 * Etapa 143 — dentro do app instalado, o reconhecimento de voz do
 * NAVEGADOR (usado até a Etapa 141) simplesmente não funciona — a
 * WebView do Android não implementa isso de verdade, então o botão
 * dava erro na hora. A correção: usar o reconhecimento de voz NATIVO
 * do Android (plugin @capacitor-community/speech-recognition) quando
 * estamos dentro do app — ainda gratuito (é o mesmo reconhecimento de
 * voz que já vem no celular, sem chave de API nenhuma), só que
 * precisa de um plugin de verdade em vez da API do navegador.
 * No site/PWA continua usando a API do navegador normalmente, que
 * funciona bem nesse contexto.
 */
export function BotaoDitarTransacao({ aoReconhecer }: { aoReconhecer: (resultado: ResultadoFala) => void }) {
  const [ouvindo, setOuvindo] = useState(false);
  const [semSuporte, setSemSuporte] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function iniciarNativo() {
    const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");

    const permissao = await SpeechRecognition.requestPermissions();
    if (permissao.speechRecognition !== "granted") {
      setErro("Preciso da permissão do microfone pra ouvir.");
      return;
    }

    const { available } = await SpeechRecognition.available();
    if (!available) {
      setErro("Reconhecimento de voz não disponível nesse aparelho.");
      return;
    }

    try {
      setOuvindo(true);
      const { matches } = await SpeechRecognition.start({ language: "pt-BR", maxResults: 1, popup: false });
      setOuvindo(false);
      if (matches && matches[0]) {
        aoReconhecer(interpretarFala(matches[0]));
      } else {
        setErro("Não consegui ouvir. Tenta de novo?");
      }
    } catch {
      setOuvindo(false);
      setErro("Não consegui ouvir. Tenta de novo?");
    }
  }

  function iniciarNavegador() {
    const SpeechRecognitionWeb =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionWeb) {
      setSemSuporte(true);
      return;
    }

    setErro(null);
    const reconhecimento = new SpeechRecognitionWeb();
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

  function iniciar() {
    setErro(null);
    if (estaNoAppNativo()) {
      iniciarNativo();
    } else {
      iniciarNavegador();
    }
  }

  if (semSuporte) return null; // navegador sem suporte — some sem quebrar nada

  return (
    <div>
      <button
        type="button"
        onClick={iniciar}
        disabled={ouvindo}
        aria-label="Ditar lançamento por voz"
        className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition ${
          ouvindo ? "border-financa text-financa" : "border-base-600 text-ink-400 hover:text-ink-100 hover:border-ink-400"
        }`}
      >
        {ouvindo ? <Loader2 size={16} strokeWidth={2} className="animate-spin" /> : <Mic size={16} strokeWidth={2} />}
      </button>
      {erro && <p className="text-xs text-red-400 mt-1">{erro}</p>}
    </div>
  );
}
