"use client";

// Etapa 363 — janelinha oficial de avaliação da Play Store, na hora certa
// (regras em lib/app/avaliacao.ts). Não aparece no navegador nem no iPhone.
import { useEffect } from "react";
import { CHAVE_AVALIACAO, EVENTO_MOMENTO_FELIZ, estadoInicial, marcarPedido, podePedir, registrarDia, type EstadoAvaliacao } from "@/lib/app/avaliacao";

function ler(): EstadoAvaliacao {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE_AVALIACAO) || "null");
    if (v && Array.isArray(v.dias)) return v;
  } catch {}
  return estadoInicial(Date.now());
}
function gravar(e: EstadoAvaliacao) {
  try {
    localStorage.setItem(CHAVE_AVALIACAO, JSON.stringify(e));
  } catch {}
}

export function PedirAvaliacao() {
  useEffect(() => {
    const cap = (window as any).Capacitor;
    if (!cap?.isNativePlatform?.() || cap.getPlatform?.() !== "android") return;
    gravar(registrarDia(ler(), new Date().toLocaleDateString("sv-SE")));

    let espera: ReturnType<typeof setTimeout> | null = null;
    const aoMomentoFeliz = () => {
      if (navigator.onLine === false) return;
      const e = ler();
      if (!podePedir(e, Date.now())) return;
      if (espera) clearTimeout(espera);
      // deixa a comemoração acontecer antes
      espera = setTimeout(async () => {
        try {
          const { AppReview } = await import("@capawesome/capacitor-app-review");
          gravar(marcarPedido(ler(), Date.now()));
          await AppReview.requestReview();
        } catch {
          /* app antigo (sem o plugin): nada */
        }
      }, 2200);
    };
    window.addEventListener(EVENTO_MOMENTO_FELIZ, aoMomentoFeliz);
    return () => {
      window.removeEventListener(EVENTO_MOMENTO_FELIZ, aoMomentoFeliz);
      if (espera) clearTimeout(espera);
    };
  }, []);
  return null;
}
