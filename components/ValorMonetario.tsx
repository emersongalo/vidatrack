"use client";

import { formatarMoeda } from "@/lib/financas/formatacao";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";
import { useContagem } from "@/components/NumeroAnimado";

export function ValorMonetario({
  valor,
  className = "",
  comSinal,
  animado,
}: {
  valor: number;
  className?: string;
  /** Se true, mostra "+" na frente de valores positivos (pra receitas) */
  comSinal?: boolean;
  /** Etapa 230 — conta até o valor (saldo do topo, totais) */
  animado?: boolean;
}) {
  const ocultos = useValoresOcultos();
  const contado = useContagem(animado ? valor : 0);

  if (ocultos) {
    return <span className={className}>R$ ••••••</span>;
  }

  const mostrar = animado ? Math.round(contado * 100) / 100 : valor;
  const texto = formatarMoeda(mostrar);
  return <span className={className}>{comSinal && mostrar >= 0 ? `+${texto}` : texto}</span>;
}
