"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
export function MenuAcoes({ children, titulo }: { children: (fecharMenu: () => void) => ReactNode; titulo?: string }) {
  const [aberto, setAberto] = useState(false);
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  // Etapa 237 — o menu abre como uma folha por cima de tudo (portal no
  // <body>). Antes ele abria "pendurado" na linha e ficava cortado
  // embaixo quando a linha estava no fim de um cartão (ex: "Paguei").
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAberto(true);
        }}
        aria-label="Mais ações"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-700 transition"
      >
        <MoreVertical size={18} strokeWidth={2} />
      </button>
      {aberto &&
        montado &&
        createPortal(
          <div
            className="animate-fundo fixed inset-0 z-[65] bg-black/50 flex items-end lg:items-center justify-center"
            onClick={() => setAberto(false)}
          >
            <div
              className="animate-folha w-full max-w-md lg:max-w-xs bg-base-800 border border-base-600 rounded-t-3xl lg:rounded-2xl shadow-2xl py-2"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="lg:hidden mx-auto mt-1 mb-2 h-1 w-10 rounded-full bg-base-600" />
              {titulo && <p className="px-5 pb-2 text-sm text-ink-400 truncate">{titulo}</p>}
              <div className="[&>*]:py-3 [&>*]:text-base">{children(() => setAberto(false))}</div>
            </div>
          </div>,
          document.body
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
  const classe = `flex items-center gap-3 w-full px-5 py-2 text-sm text-left transition hover:bg-base-700 ${
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
