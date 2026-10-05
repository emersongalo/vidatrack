"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";

// Etapa 267 — voltar pro app depois de um tempo parado não dá mais
// "piscada". Antes, passados 2 minutos escondido, a página inteira era
// recarregada (tela apagava e voltava). Como as telas leem do retrato
// salvo no aparelho, dá pra só buscar os dados novos em silêncio: a tela
// fica como está e os números se atualizam sozinhos quando chegam.
//
// Recarregar tudo só depois de MUITO tempo parado (8h — ex: deixou
// aberto de um dia pro outro), e aí com a abertura animada do logo,
// pra parecer que o app abriu de novo, e não uma piscada.
const LIMITE_PARA_RECARGA_TOTAL_MS = 8 * 60 * 60 * 1000;
// abaixo disso nem precisa buscar nada (trocou de app rapidinho)
const MINIMO_PARA_ATUALIZAR_MS = 20 * 1000;

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
      if (tempoEscondido < MINIMO_PARA_ATUALIZAR_MS) return;

      // Etapa 229 — espera um pouco: quando o app volta por um WIDGET ou
      // NOTIFICAÇÃO, o Android já está abrindo a tela certa. Se a página
      // mudar nesse meio tempo, deixa ela abrir em paz.
      const enderecoAntes = window.location.href;
      window.setTimeout(() => {
        if (window.location.href !== enderecoAntes || document.visibilityState !== "visible") return;
        if (tempoEscondido > LIMITE_PARA_RECARGA_TOTAL_MS && navigator.onLine) {
          // mostra a abertura animada no lugar da tela piscando
          try {
            sessionStorage.removeItem("vt-abertura");
          } catch {}
          window.location.reload();
          return;
        }
        // atualização silenciosa: dados novos sem mexer na tela
        atualizarSnapshotEmTodasAsTelas();
        router.refresh();
      }, 900);
    }

    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  }, [router]);

  return null;
}
