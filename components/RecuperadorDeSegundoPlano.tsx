"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Depois de quanto tempo escondido a gente prefere recarregar a
// página inteira, em vez de só atualizar os dados — passado esse
// tempo, é mais seguro garantir um estado limpo do zero do que
// confiar que tudo (conexões, temporizadores, sessão) sobreviveu
// certinho ao período em segundo plano.
const LIMITE_PARA_RECARGA_TOTAL_MS = 2 * 60 * 1000;

export function RecuperadorDeSegundoPlano() {
  const router = useRouter();
  const escondidoDesde = useRef<number | null>(null);

  useEffect(() => {
    function aoMudarVisibilidade() {
      if (document.visibilityState === "hidden") {
        escondidoDesde.current = Date.now();
        return;
      }

      // Voltou a ficar visível
      if (escondidoDesde.current === null) return;
      const tempoEscondido = Date.now() - escondidoDesde.current;
      escondidoDesde.current = null;

      if (tempoEscondido > LIMITE_PARA_RECARGA_TOTAL_MS) {
        window.location.reload();
      } else {
        router.refresh();
      }
    }

    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  }, [router]);

  return null;
}
