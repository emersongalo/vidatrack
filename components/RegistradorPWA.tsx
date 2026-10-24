"use client";

import { useEffect } from "react";
import { TELAS_PRINCIPAIS, TODAS_AS_TELAS } from "@/lib/offline/rotasOffline";

// Etapa 342 — além de registrar, pede pro Service Worker deixar as telas
// guardadas pra abrir sem internet.
// Etapa 348 — agora são TODAS as telas: as principais a cada 1 hora e o
// resto (incluindo os "modelos" das telas de detalhe/editar) a cada 12 horas.
const CHAVE_PRINCIPAIS = "vt-sw-aquecido-v7";
const CHAVE_TODAS = "vt-sw-aquecido-todas-v7";
const UMA_HORA = 3600 * 1000;

function passou(chave: string, intervalo: number) {
  try {
    return Date.now() - Number(localStorage.getItem(chave) ?? "0") >= intervalo;
  } catch {
    return true;
  }
}
function marcar(chave: string) {
  try {
    localStorage.setItem(chave, String(Date.now()));
  } catch {}
}

export function RegistradorPWA() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg: any) => {
        // Etapa 349 — Chrome com o app instalado: atualiza os dados de
        // tempos em tempos, mesmo sem abrir (outros navegadores ignoram)
        try {
          if (reg?.periodicSync) await reg.periodicSync.register("vt-retrato", { minInterval: 4 * UMA_HORA });
        } catch {}
      })
      .catch(() => {
        // Falha silenciosa: o app funciona normalmente sem PWA.
      });
    const aquecer = () => {
      try {
        if (!navigator.onLine) return;
        // só quem está logado tem telas pra guardar
        if (/^\/(login|cadastro|esqueci-senha|verifique-email|redefinir-senha|apresentacao|offline)/.test(location.pathname)) return;
        const todas = passou(CHAVE_TODAS, 12 * UMA_HORA);
        const principais = todas || passou(CHAVE_PRINCIPAIS, UMA_HORA);
        if (!principais) return;
        navigator.serviceWorker.ready.then((reg) => {
          reg.active?.postMessage({ tipo: "aquecer", rotas: todas ? TODAS_AS_TELAS : TELAS_PRINCIPAIS });
          marcar(CHAVE_PRINCIPAIS);
          if (todas) marcar(CHAVE_TODAS);
        });
      } catch {}
    };
    // espera o app terminar de abrir pra não disputar a internet
    const t = setTimeout(aquecer, 8000);
    window.addEventListener("online", aquecer);
    return () => {
      clearTimeout(t);
      window.removeEventListener("online", aquecer);
    };
  }, []);

  return null;
}
