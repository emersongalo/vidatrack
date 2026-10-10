"use client";

// Etapa 281 — mantém o tema certo enquanto o app está aberto: no modo
// "igual ao celular" acompanha a troca do sistema; no "por horário"
// confere a cada minuto (e ao voltar pro app).
import { useEffect } from "react";
import { lerPreferenciaTema, sistemaEstaEscuro, temaEfetivo } from "@/lib/preferencias/tema";

export function TemaAutomatico() {
  useEffect(() => {
    function conferir() {
      const pref = lerPreferenciaTema();
      if (pref !== "auto" && pref !== "horario") return;
      const t = temaEfetivo(pref, new Date().getHours(), sistemaEstaEscuro());
      if (document.documentElement.getAttribute("data-theme") !== t) document.documentElement.setAttribute("data-theme", t);
    }
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", conferir);
    const i = setInterval(conferir, 60_000);
    const aoVoltar = () => document.visibilityState === "visible" && conferir();
    document.addEventListener("visibilitychange", aoVoltar);
    conferir();
    return () => {
      mq?.removeEventListener?.("change", conferir);
      clearInterval(i);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, []);
  return null;
}
