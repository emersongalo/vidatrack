"use client";

// Etapa 221 — falar em vez de digitar no assistente ("gastei 30 no
// mercado"). Usa o reconhecimento de voz do próprio navegador (Chrome,
// Edge, Safari) — de graça, sem mandar áudio pra servidor nosso. Onde
// o navegador não tem isso (ex: dentro do app Android), o botão nem
// aparece; lá dá pra usar o microfone do teclado.
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

export function BotaoVoz({ aoOuvir }: { aoOuvir: (texto: string) => void }) {
  const [suportado, setSuportado] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const reconhecedor = useRef<any>(null);

  useEffect(() => {
    const w = window as any;
    setSuportado(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => reconhecedor.current?.abort?.();
  }, []);

  if (!suportado) return null;

  function alternar() {
    if (ouvindo) {
      reconhecedor.current?.stop();
      return;
    }
    const w = window as any;
    const R = w.SpeechRecognition || w.webkitSpeechRecognition;
    const r = new R();
    r.lang = "pt-BR";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e: any) => {
      const texto = String(e.results?.[0]?.[0]?.transcript ?? "").trim();
      if (texto) aoOuvir(texto);
    };
    r.onerror = (e: any) => {
      setErro(e?.error === "not-allowed" ? "Permita o microfone pra usar a voz." : "Não entendi. Tente de novo.");
      setTimeout(() => setErro(null), 3000);
    };
    r.onend = () => setOuvindo(false);
    reconhecedor.current = r;
    setErro(null);
    setOuvindo(true);
    try {
      r.start();
    } catch {
      setOuvindo(false);
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={alternar}
        aria-label={ouvindo ? "Parar de ouvir" : "Falar"}
        className={`w-11 h-full min-h-[42px] rounded-lg flex items-center justify-center border transition ${
          ouvindo ? "bg-red-400/20 border-red-400 text-red-400 animate-pulse" : "border-base-600 text-ink-400 hover:text-ink-100"
        }`}
      >
        {ouvindo ? <MicOff size={18} /> : <Mic size={18} />}
      </button>
      {erro && (
        <span className="absolute bottom-full mb-2 right-0 whitespace-nowrap text-[11px] bg-base-700 border border-base-600 rounded px-2 py-1">
          {erro}
        </span>
      )}
    </div>
  );
}
