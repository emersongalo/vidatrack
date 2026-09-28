"use client";

import { useEffect } from "react";

/**
 * Etapa 214 — qualquer erro de JavaScript que escapar numa tela (o
 * tipo que deixa um botão "morto" sem mensagem nenhuma) é registrado,
 * anônimo, pro Painel de erros (/admin/erros). No máximo 5 por sessão
 * e sem repetir a mesma mensagem, pra não inundar a tabela.
 */
export function ErrosGlobais() {
  useEffect(() => {
    const vistos = new Set<string>();
    function registrar(tipo: string, mensagem: string) {
      const msg = `erro-js ${location.pathname}: ${tipo} ${mensagem}`.slice(0, 200);
      if (vistos.has(msg) || vistos.size >= 5) return;
      vistos.add(msg);
      try {
        fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pagina: msg }),
          keepalive: true,
        });
      } catch {}
    }
    const aoErro = (e: ErrorEvent) => registrar("", e.message || "erro");
    const aoPromessa = (e: PromiseRejectionEvent) => {
      const r: any = e.reason;
      registrar("(promise)", String(r?.message ?? r ?? "rejeitada"));
    };
    window.addEventListener("error", aoErro);
    window.addEventListener("unhandledrejection", aoPromessa);
    return () => {
      window.removeEventListener("error", aoErro);
      window.removeEventListener("unhandledrejection", aoPromessa);
    };
  }, []);
  return null;
}
