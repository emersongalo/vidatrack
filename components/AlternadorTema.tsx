"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { aplicarTema } from "@/lib/preferencias/tema";

// Etapa 281 — o botão do topo troca na hora entre claro e escuro (e
// sai do automático, se estava). O automático fica em Perfil → Aparência.
export function AlternadorTema() {
  const [tema, setTema] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTema(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
  }, []);

  function alternar() {
    const novo = tema === "dark" ? "light" : "dark";
    setTema(novo);
    aplicarTema(novo);
  }

  return (
    <button
      onClick={alternar}
      aria-label="Alternar tema claro/escuro"
      className="w-9 h-9 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-800 transition shrink-0"
    >
      {tema === "dark" ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
    </button>
  );
}
