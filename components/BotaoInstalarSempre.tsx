"use client";

import { useEffect, useState } from "react";

type EventoInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Etapa 157 — antes isso tentava aparecer em qualquer celular, e
 * ficava "surgindo e sumindo" logo na entrada (só decidia se tinha
 * espaço/já tava instalado depois do primeiro render, então piscava
 * uma vez ao montar — e em alguns casos remontava mais de uma vez).
 * Simplificado: Android tem o APK de verdade pra baixar, então esse
 * aviso de "instalar como PWA" não faz sentido pra quem tá nele —
 * só mostra mesmo pra iPhone, que não tem outro caminho de
 * instalação. E nunca aparece dentro do app instalado (óbvio, mas
 * de propósito).
 */
export function BotaoInstalarSempre() {
  const [eventoAndroid, setEventoAndroid] = useState<EventoInstalacao | null>(null);
  const [mostrarInstrucoes, setMostrarInstrucoes] = useState(false);
  const [podeMostrar, setPodeMostrar] = useState(false);

  useEffect(() => {
    const noAppNativo = !!(window as any).Capacitor?.isNativePlatform?.();
    const jaInstalado =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    const ehIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    setPodeMostrar(!noAppNativo && !jaInstalado && ehIOS);

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
    setMostrarInstrucoes(true);
  }

  if (!podeMostrar) return null;

  return (
    <div className="mb-6">
      <button
        onClick={clicar}
        className="w-full flex items-center justify-center gap-2 bg-base-800 border border-base-600 rounded-lg py-2.5 text-sm hover:border-habito transition"
      >
        📲 Instalar o VidaTrack no iPhone
      </button>

      {mostrarInstrucoes && (
        <p className="text-xs text-ink-400 mt-2 text-center">
          Toque em <strong className="text-ink-100">Compartilhar</strong> (ícone com a seta ⬆️) e
          depois em <strong className="text-ink-100">"Adicionar à Tela de Início"</strong>.
        </p>
      )}
    </div>
  );
}
