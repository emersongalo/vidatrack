"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function AlternadorTema() {
  const [tema, setTema] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const salvo = (localStorage.getItem("vidatrack-tema") as "dark" | "light") || "dark";
    setTema(salvo);
  }, []);

  function alternar() {
    const novo = tema === "dark" ? "light" : "dark";
    setTema(novo);
    document.documentElement.setAttribute("data-theme", novo);
    localStorage.setItem("vidatrack-tema", novo);
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
