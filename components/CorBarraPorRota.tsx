"use client";

// Etapa 240 — segurança extra: ao chegar numa tela que NÃO tem topo
// colorido, a barra do celular volta pra cor normal do app — mesmo que a
// tela anterior (lançamento, hábito) não tenha conseguido limpar.
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { definirCorBarraStatus, rotaTemCorPropria } from "@/lib/app/barraStatus";

export function CorBarraPorRota() {
  const caminho = usePathname() ?? "";
  useEffect(() => {
    if (rotaTemCorPropria(caminho)) return;
    // depois da tela nova montar (e de um eventual "limpar" da anterior)
    const t = setTimeout(() => definirCorBarraStatus(null), 50);
    return () => clearTimeout(t);
  }, [caminho]);

  // trocou o tema (claro/escuro): acompanha
  useEffect(() => {
    const obs = new MutationObserver(() => {
      if (!rotaTemCorPropria(window.location.pathname)) definirCorBarraStatus(null);
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return null;
}
