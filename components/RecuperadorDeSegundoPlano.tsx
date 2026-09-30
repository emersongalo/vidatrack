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

      // Etapa 229 — espera um pouco antes de recarregar: quando o app
      // volta por um WIDGET ou NOTIFICAÇÃO, o Android já está abrindo a
      // tela certa (ex: /financas). Recarregar na hora cancelava essa
      // navegação e o app ficava na aba que estava aberta antes. Se a
      // página mudar nesse meio tempo, não recarrega nada.
      const enderecoAntes = window.location.href;
      window.setTimeout(() => {
        if (window.location.href !== enderecoAntes || document.visibilityState !== "visible") return;
        if (tempoEscondido > LIMITE_PARA_RECARGA_TOTAL_MS) {
          window.location.reload();
        } else {
          router.refresh();
        }
      }, 900);
    }

    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  }, [router]);

  return null;
}
