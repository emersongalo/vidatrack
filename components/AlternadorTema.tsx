"use client";

import { useEffect, useState } from "react";

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
      className="text-sm text-ink-400 hover:text-ink-100 transition"
    >
      {tema === "dark" ? "☀︎ Claro" : "☾ Escuro"}
    </button>
  );
}
