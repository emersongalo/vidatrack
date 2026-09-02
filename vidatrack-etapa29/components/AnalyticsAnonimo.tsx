"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function AnalyticsAnonimo() {
  const pathname = usePathname();

  useEffect(() => {
    // "Fire and forget": não bloqueia nada, falha em silêncio.
    // Não envia cookies, IP, user agent ou qualquer identificador —
    // só qual página foi vista, pra ter uma noção de uso do app.
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pagina: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
