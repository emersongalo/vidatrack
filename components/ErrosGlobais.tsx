"use client";

import { useEffect } from "react";

/**
 * Etapa 214 — qualquer erro de JavaScript que escapar numa tela (o
 * tipo que deixa um botão "morto" sem mensagem nenhuma) é registrado,
 * anônimo, pro Painel de erros (/admin/erros).
 *
 * Etapa 280 — também registra quando o servidor responde com erro
 * (500+) numa ação do app, e marca se foi no app Android ou no
 * navegador. Continua anônimo, no máximo 8 por sessão e sem repetir.
 */
export function ErrosGlobais() {
  useEffect(() => {
    const vistos = new Set<string>();
    const nativo = !!(window as any).Capacitor?.isNativePlatform?.();
    const onde = nativo ? "[app]" : "[web]";

    function registrar(prefixo: string, mensagem: string) {
      const msg = `${prefixo} ${location.pathname}: ${mensagem}`.slice(0, 190) + ` ${onde}`;
      if (vistos.has(msg) || vistos.size >= 8) return;
      vistos.add(msg);
      try {
        originalFetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pagina: msg }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    }

    const aoErro = (e: ErrorEvent) => {
      // ruído de extensões/scripts de fora: ignora
      if (e.filename && !e.filename.startsWith(location.origin)) return;
      registrar("erro-js", e.message || "erro");
    };
    const aoPromessa = (e: PromiseRejectionEvent) => {
      const r: any = e.reason;
      const texto = String(r?.message ?? r ?? "rejeitada");
      // redirecionamento do Next.js não é erro
      if (texto.includes("NEXT_REDIRECT") || texto.includes("NEXT_NOT_FOUND")) return;
      registrar("erro-js", `(promise) ${texto}`);
    };

    // respostas 500+ do próprio site (ações do app, rotas de API)
    const originalFetch = window.fetch.bind(window);
    const fetchVigiado: typeof window.fetch = async (entrada, init) => {
      const resposta = await originalFetch(entrada, init);
      try {
        if (resposta.status >= 500) {
          const url = new URL(typeof entrada === "string" ? entrada : entrada instanceof URL ? entrada.href : entrada.url, location.href);
          if (url.origin === location.origin && !url.pathname.startsWith("/api/analytics")) {
            const metodo = (init?.method ?? (entrada instanceof Request ? entrada.method : "GET")).toUpperCase();
            registrar("erro-http", `${resposta.status} ${metodo} ${url.pathname}`);
          }
        }
      } catch {}
      return resposta;
    };
    window.fetch = fetchVigiado;

    window.addEventListener("error", aoErro);
    window.addEventListener("unhandledrejection", aoPromessa);
    return () => {
      window.removeEventListener("error", aoErro);
      window.removeEventListener("unhandledrejection", aoPromessa);
      if (window.fetch === fetchVigiado) window.fetch = originalFetch;
    };
  }, []);
  return null;
}
