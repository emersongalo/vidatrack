"use client";

import { useEffect } from "react";

// Etapa 342 — além de registrar, pede pro Service Worker deixar as telas
// principais (e a tela offline) guardadas, no máximo a cada 6 horas.
const TELAS = ["/dashboard", "/habitos", "/tarefas", "/financas", "/tarefas/agenda"];
const CHAVE = "vt-sw-aquecido-v6";

export function RegistradorPWA() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Falha silenciosa: o app funciona normalmente sem PWA.
    });
    const aquecer = () => {
      try {
        if (!navigator.onLine) return;
        const ultima = Number(localStorage.getItem(CHAVE) ?? "0");
        if (Date.now() - ultima < 6 * 3600 * 1000) return;
        navigator.serviceWorker.ready.then((reg) => {
          reg.active?.postMessage({ tipo: "aquecer", rotas: TELAS });
          localStorage.setItem(CHAVE, String(Date.now()));
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
