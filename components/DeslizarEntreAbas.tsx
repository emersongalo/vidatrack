"use client";

import { useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

const LIMIAR_PX = 70; // precisa arrastar pelo menos isso pra contar como swipe de verdade
const LIMIAR_ANGULO = 1.6; // arrasto horizontal precisa ser bem mais forte que o vertical

/**
 * Etapa 180 — arrastar o dedo pra esquerda/direita troca de aba,
 * igual a maioria dos apps modernos (Instagram, Gmail...). Só ativa
 * quando a rota atual é EXATAMENTE uma das abas da lista (não em
 * telas de detalhe/formulário, onde um arrasto horizontal pode ser
 * outra coisa, tipo um carrossel ou campo de texto).
 */
export function DeslizarEntreAbas({
  abas,
  children,
}: {
  abas: { href: string }[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const inicio = useRef<{ x: number; y: number } | null>(null);

  const indiceAtual = abas.findIndex((a) => a.href === pathname);

  function aoTocar(e: React.TouchEvent) {
    // Etapa 180 — se o toque começou dentro de algo que já rola na
    // horizontal sozinho (o seletor de dias da tela Hoje, os filtros
    // de período do Extrato...), não interfere: deixa aquele elemento
    // cuidar do próprio gesto, sem competir com a troca de aba.
    let el = e.target as HTMLElement | null;
    while (el && el !== e.currentTarget) {
      if (el.scrollWidth > el.clientWidth + 4) {
        inicio.current = null;
        return;
      }
      el = el.parentElement;
    }
    const t = e.touches[0];
    inicio.current = { x: t.clientX, y: t.clientY };
  }

  function aoSoltar(e: React.TouchEvent) {
    if (!inicio.current || indiceAtual === -1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - inicio.current.x;
    const dy = t.clientY - inicio.current.y;
    inicio.current = null;

    if (Math.abs(dx) < LIMIAR_PX) return;
    if (Math.abs(dx) < Math.abs(dy) * LIMIAR_ANGULO) return;

    if (dx < 0 && indiceAtual < abas.length - 1) {
      router.push(abas[indiceAtual + 1].href);
    } else if (dx > 0 && indiceAtual > 0) {
      router.push(abas[indiceAtual - 1].href);
    }
  }

  return (
    <div onTouchStart={aoTocar} onTouchEnd={aoSoltar}>
      {children}
    </div>
  );
}
