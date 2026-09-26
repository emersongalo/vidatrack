"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Etapa 192 — diagnóstico TEMPORÁRIO do "recarrega sem parar" que
// acontece só dentro do app Android. No navegador comum nada muda.
// Dentro do app, cada registro leva junto: tipo de carga (navigate/
// reload), quantas vezes montou nessa sessão e há quantos ms a página
// carregou (número pequeno = recarregou a página inteira; grande =
// só remontou). Também registra erros de JavaScript (até 5 por sessão).
function noAppNativo() {
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

function enviar(pagina: string) {
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pagina: pagina.slice(0, 200) }),
    keepalive: true,
  }).catch(() => {});
}

export function AnalyticsAnonimo() {
  const pathname = usePathname();

  useEffect(() => {
    // "Fire and forget": não bloqueia nada, falha em silêncio.
    // Não envia cookies, IP, user agent ou qualquer identificador —
    // só qual página foi vista, pra ter uma noção de uso do app.
    if (!noAppNativo()) {
      enviar(pathname);
      return;
    }
    let n = 0;
    try {
      n = Number(sessionStorage.getItem("vt-diag-cargas") ?? "0") + 1;
      sessionStorage.setItem("vt-diag-cargas", String(n));
    } catch {}
    const nav = (performance.getEntriesByType("navigation")[0] as any)?.type ?? "?";
    const ms = Math.round(performance.now());
    enviar(`${pathname} | nativo ${nav} n=${n} t=${ms}ms vis=${document.visibilityState}`);
  }, [pathname]);

  useEffect(() => {
    if (!noAppNativo()) return;
    let enviados = 0;
    function registrar(msg: string) {
      if (enviados >= 5) return;
      enviados++;
      enviar(`erro-js: ${msg}`);
    }
    function aoErro(e: ErrorEvent) {
      registrar(`${e.message} @ ${(e.filename ?? "").split("/").pop()}:${e.lineno}`);
    }
    function aoRejeicao(e: PromiseRejectionEvent) {
      const r: any = e.reason;
      registrar(`promise: ${r?.message ?? String(r)}`);
    }
    window.addEventListener("error", aoErro);
    window.addEventListener("unhandledrejection", aoRejeicao);
    return () => {
      window.removeEventListener("error", aoErro);
      window.removeEventListener("unhandledrejection", aoRejeicao);
    };
  }, []);

  return null;
}
