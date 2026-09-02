"use client";

import { useEffect, useState } from "react";

export function ConfirmarSaidaApp() {
  const [avisoVisivel, setAvisoVisivel] = useState(false);

  useEffect(() => {
    let prontoParaSair = false;
    let idTimeout: ReturnType<typeof setTimeout>;

    function empilharEstado() {
      window.history.pushState({ vidatrackAncora: true }, "", window.location.href);
    }

    // Assim que entra no painel, já empilha um estado extra — é esse
    // estado que o primeiro "voltar" vai consumir, sem sair do app.
    empilharEstado();

    function aoVoltar() {
      if (prontoParaSair) return; // deixa acontecer de verdade dessa vez

      empilharEstado();
      setAvisoVisivel(true);
      prontoParaSair = true;

      clearTimeout(idTimeout);
      idTimeout = setTimeout(() => {
        prontoParaSair = false;
        setAvisoVisivel(false);
      }, 2200);
    }

    window.addEventListener("popstate", aoVoltar);
    return () => {
      window.removeEventListener("popstate", aoVoltar);
      clearTimeout(idTimeout);
    };
  }, []);

  if (!avisoVisivel) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-40 flex justify-center pointer-events-none">
      <div className="bg-base-800 border border-base-600 rounded-full px-4 py-2.5 text-sm shadow-lg">
        Toque em voltar de novo pra sair do VidaTrack
      </div>
    </div>
  );
}
