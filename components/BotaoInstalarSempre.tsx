"use client";

import { useEffect, useState } from "react";

type EventoInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function BotaoInstalarSempre() {
  const [eventoAndroid, setEventoAndroid] = useState<EventoInstalacao | null>(null);
  const [mostrarInstrucoes, setMostrarInstrucoes] = useState<"android" | "ios" | null>(null);
  const [jaInstalado, setJaInstalado] = useState(false);
  const [ehMobile, setEhMobile] = useState(false);

  useEffect(() => {
    const instalado =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setJaInstalado(instalado);
    setEhMobile(window.matchMedia("(max-width: 820px)").matches);

    function aoFicarInstalavel(e: Event) {
      e.preventDefault();
      setEventoAndroid(e as EventoInstalacao);
    }
    window.addEventListener("beforeinstallprompt", aoFicarInstalavel);
    return () => window.removeEventListener("beforeinstallprompt", aoFicarInstalavel);
  }, []);

  async function clicar() {
    if (eventoAndroid) {
      await eventoAndroid.prompt();
      await eventoAndroid.userChoice;
      return;
    }

    // O navegador ainda não liberou o prompt automático (isso depende de
    // critérios de engajamento do próprio Chrome, fora do nosso controle)
    // — nesse caso, mostra o caminho manual, que sempre funciona.
    const ehIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setMostrarInstrucoes(ehIOS ? "ios" : "android");
  }

  if (jaInstalado || !ehMobile) return null;

  return (
    <div className="mb-6">
      <button
        onClick={clicar}
        className="w-full flex items-center justify-center gap-2 bg-base-800 border border-base-600 rounded-lg py-2.5 text-sm hover:border-habito transition"
      >
        📲 Instalar o VidaTrack no celular
      </button>

      {mostrarInstrucoes === "android" && (
        <p className="text-xs text-ink-400 mt-2 text-center">
          Toque nos <strong className="text-ink-100">⋮ três pontinhos</strong> do navegador e
          escolha <strong className="text-ink-100">"Instalar app"</strong> ou{" "}
          <strong className="text-ink-100">"Adicionar à tela inicial"</strong>.
        </p>
      )}
      {mostrarInstrucoes === "ios" && (
        <p className="text-xs text-ink-400 mt-2 text-center">
          Toque em <strong className="text-ink-100">Compartilhar</strong> (ícone com a seta ⬆️) e
          depois em <strong className="text-ink-100">"Adicionar à Tela de Início"</strong>.
        </p>
      )}
    </div>
  );
}
