"use client";

import { useEffect, useState } from "react";

const CHAVE = "vidatrack-foto-perfil-cache";

/**
 * Etapa 144 — antes, toda vez que a tela do Painel remontava (ex:
 * voltar de outra tela), a foto começava do zero (ícone padrão) e só
 * trocava pra foto de verdade depois que a busca ao servidor
 * terminava — dava a impressão de "piscar". Guardando a última foto
 * conhecida aqui, ela já aparece certa na hora, e só atualiza
 * silenciosamente se tiver mudado.
 */
export function useFotoPerfilCache() {
  const [urlFoto, setUrlFotoState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(CHAVE);
    } catch {
      return null;
    }
  });

  function setUrlFoto(url: string | null) {
    setUrlFotoState(url);
    try {
      if (url) localStorage.setItem(CHAVE, url);
      else localStorage.removeItem(CHAVE);
    } catch {
      // sem espaço/indisponível — só não fica em cache pra próxima vez
    }
  }

  useEffect(() => {
    if (!navigator.onLine) return;
    fetch("/api/perfil/foto")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.url) setUrlFoto(d.url);
      })
      .catch(() => {});
  }, []);

  return urlFoto;
}
