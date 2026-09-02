"use client";

import { useEffect, useState } from "react";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { lerValoresOcultos, EVENTO_MUDANCA } from "@/lib/preferencias/valoresOcultos";

export function ValorMonetario({
  valor,
  className = "",
  comSinal,
}: {
  valor: number;
  className?: string;
  /** Se true, mostra "+" na frente de valores positivos (pra receitas) */
  comSinal?: boolean;
}) {
  const [ocultos, setOcultos] = useState(false);

  useEffect(() => {
    setOcultos(lerValoresOcultos());
    function aoMudar(e: Event) {
      setOcultos((e as CustomEvent<boolean>).detail);
    }
    window.addEventListener(EVENTO_MUDANCA, aoMudar);
    return () => window.removeEventListener(EVENTO_MUDANCA, aoMudar);
  }, []);

  if (ocultos) {
    return <span className={className}>R$ ••••••</span>;
  }

  const texto = formatarMoeda(valor);
  return <span className={className}>{comSinal && valor >= 0 ? `+${texto}` : texto}</span>;
}
