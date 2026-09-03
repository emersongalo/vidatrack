"use client";

import { useEffect, useState } from "react";
import { lerValoresOcultos, EVENTO_MUDANCA } from "@/lib/preferencias/valoresOcultos";

export function useValoresOcultos(): boolean {
  const [ocultos, setOcultos] = useState(false);

  useEffect(() => {
    setOcultos(lerValoresOcultos());
    function aoMudar(e: Event) {
      setOcultos((e as CustomEvent<boolean>).detail);
    }
    window.addEventListener(EVENTO_MUDANCA, aoMudar);
    return () => window.removeEventListener(EVENTO_MUDANCA, aoMudar);
  }, []);

  return ocultos;
}
