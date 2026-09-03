"use client";

import { formatarMoeda } from "@/lib/financas/formatacao";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";

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
  const ocultos = useValoresOcultos();

  if (ocultos) {
    return <span className={className}>R$ ••••••</span>;
  }

  const texto = formatarMoeda(valor);
  return <span className={className}>{comSinal && valor >= 0 ? `+${texto}` : texto}</span>;
}
