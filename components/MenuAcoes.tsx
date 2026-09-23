"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreVertical } from "lucide-react";

/**
 * Etapa 163 — menu "⋮" reutilizável pra juntar várias ações (editar,
 * compartilhar, arquivar, excluir...) que antes ficavam sempre
 * visíveis numa fileira de ícones em cada linha da lista — inspirado
 * no jeito mais limpo do Despezzas, que não lota cada linha de
 * botão. Fecha sozinho ao clicar fora. Não fecha sozinho ao clicar
 * DENTRO (de propósito — um item com confirmação, tipo "Excluir",
 * precisa que o menu continue aberto pra mostrar o "tem certeza?").
 * Passe `fecharMenu` pra dentro de cada BotaoComConfirmacao como
 * `aoConcluir` (ou combine com o aoConcluir de verdade) pra ele
 * fechar sozinho quando a ação terminar.
 */
export function MenuAcoes({ children }: { children: (fecharMenu: () => void) => ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setAberto((a) => !a)}
        aria-label="Mais ações"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-700 transition"
      >
        <MoreVertical size={16} strokeWidth={2} />
      </button>
      {aberto && (
        <div className="absolute right-0 top-full mt-1 z-20 min-w-[190px] bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/30 py-1.5">
          {children(() => setAberto(false))}
        </div>
      )}
    </div>
  );
}

export function ItemMenuAcoes({
  children,
  onClick,
  href,
  destrutivo,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  destrutivo?: boolean;
}) {
  const classe = `flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-left transition hover:bg-base-700 ${
    destrutivo ? "text-red-400" : "text-ink-100"
  }`;

  if (href) {
    return (
      <Link href={href} className={classe}>
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={classe}>
      {children}
    </button>
  );
}
