"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Etapa 181 — anima cada troca de tela com um fade + leve
 * deslizamento pra cima, em vez da troca seca de antes. A `key`
 * mudando a cada rota força o React a desmontar/remontar esse div,
 * que é o que reinicia a animação CSS toda vez (ver .entrada-tela em
 * globals.css).
 */
export function TransicaoPagina({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="entrada-tela">
      {children}
    </div>
  );
}
