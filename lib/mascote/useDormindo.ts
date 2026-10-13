"use client";

// Etapa 315 — "está na hora de dormir?" atualizado a cada minuto.
import { useEffect, useState } from "react";
import { dormindoNaHora } from "@/lib/mascote/mascote";

export function useDormindo(): boolean {
  const [dormindo, setDormindo] = useState(() => dormindoNaHora(new Date().getHours()));
  useEffect(() => {
    const t = setInterval(() => setDormindo(dormindoNaHora(new Date().getHours())), 60_000);
    return () => clearInterval(t);
  }, []);
  return dormindo;
}
