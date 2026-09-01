"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const CHAVE_DISPENSADO = "vidatrack-instalar-dispensado-em";
const DIAS_ATE_PERGUNTAR_DE_NOVO = 10;
const ROTAS_SEM_PROMPT = ["/login", "/cadastro", "/esqueci-senha", "/redefinir-senha", "/verifique-email"];

type EventoInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PromptInstalarApp() {
  const pathname = usePathname();
  const [eventoAndroid, setEventoAndroid] = useState<EventoInstalacao | null>(null);
  const [mostrarBannerIOS, setMostrarBannerIOS] = useState(false);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (ROTAS_SEM_PROMPT.some((rota) => pathname.startsWith(rota))) return;

    // Já instalado como app? Não mostra nada.
    const jaInstalado =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (jaInstalado) return;

    // Só em telas pequenas (celular) — é o que foi pedido, desktop já
    // usa bem pelo navegador normal.
    const ehTelaPequena = window.matchMedia("(max-width: 820px)").matches;
    if (!ehTelaPequena) return;

    // Se a pessoa já dispensou recentemente, respeita e não insiste.
    const dispensadoEm = localStorage.getItem(CHAVE_DISPENSADO);
    if (dispensadoEm) {
      const diasPassados = (Date.now() - Number(dispensadoEm)) / (1000 * 60 * 60 * 24);
      if (diasPassados < DIAS_ATE_PERGUNTAR_DE_NOVO) return;
    }

    const ehIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    if (ehIOS) {
      // iOS/Safari não tem prompt automático — só dá pra orientar o
      // passo a passo manual (Compartilhar > Adicionar à Tela de Início).
      const ehSafari = /safari/i.test(window.navigator.userAgent) && !/crios|fxios/i.test(window.navigator.userAgent);
      if (ehSafari) {
        setMostrarBannerIOS(true);
        setVisivel(true);
      }
      return;
    }

    // Android/Chrome: escuta o evento nativo de instalação
    function aoFicarInstalavel(e: Event) {
      e.preventDefault();
      setEventoAndroid(e as EventoInstalacao);
      setVisivel(true);
    }

    window.addEventListener("beforeinstallprompt", aoFicarInstalavel);
    return () => window.removeEventListener("beforeinstallprompt", aoFicarInstalavel);
  }, [pathname]);

  function dispensar() {
    localStorage.setItem(CHAVE_DISPENSADO, String(Date.now()));
    setVisivel(false);
  }

  async function instalarAndroid() {
    if (!eventoAndroid) return;
    await eventoAndroid.prompt();
    await eventoAndroid.userChoice; // não precisa checar o resultado — some de qualquer jeito
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-30 max-w-md mx-auto bg-base-800 border border-base-600 rounded-xl2 p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">📲</span>
        <div className="flex-1 min-w-0">
          {mostrarBannerIOS ? (
            <>
              <p className="text-sm font-medium">Instale o VidaTrack no seu iPhone</p>
              <p className="text-xs text-ink-400 mt-1">
                Toque em <span className="text-ink-100">Compartilhar</span> (o ícone com a seta ⬆️
                na barra do Safari) e depois em <span className="text-ink-100">"Adicionar à Tela de
                Início"</span>.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Instalar o VidaTrack</p>
              <p className="text-xs text-ink-400 mt-1">
                Acesso rápido direto da tela inicial, sem precisar abrir o navegador.
              </p>
            </>
          )}
          <div className="flex gap-3 mt-3">
            {!mostrarBannerIOS && (
              <button
                onClick={instalarAndroid}
                className="text-xs bg-ink-100 text-base-900 font-medium rounded-lg px-3 py-1.5 hover:opacity-90 transition"
              >
                Instalar
              </button>
            )}
            <button
              onClick={dispensar}
              className="text-xs text-ink-400 hover:text-ink-100 transition px-1"
            >
              {mostrarBannerIOS ? "Entendi" : "Agora não"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
