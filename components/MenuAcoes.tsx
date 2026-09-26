"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
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
 *
 * Etapa 186 — o menu agora é renderizado num portal no <body>, com
 * posição fixa calculada a partir do botão. Antes ele era `absolute`
 * dentro da linha, e quando a linha estava dentro do LinhaComDeslizar
 * (overflow-hidden + transform) o menu abria mas ficava cortado/
 * invisível. Também abre pra CIMA quando não cabe embaixo.
 */
const LARGURA_MENU = 200;

export function MenuAcoes({ children }: { children: (fecharMenu: () => void) => ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // calcula a posição depois que o menu montou (pra saber a altura real)
  useLayoutEffect(() => {
    if (!aberto) {
      setPos(null);
      return;
    }
    const b = botaoRef.current?.getBoundingClientRect();
    if (!b) return;
    const alturaMenu = menuRef.current?.offsetHeight ?? 120;
    const naoCabeEmbaixo = b.bottom + 4 + alturaMenu > window.innerHeight - 8;
    const cabeEmCima = b.top - 4 - alturaMenu > 8;
    const top = naoCabeEmbaixo && cabeEmCima ? b.top - 4 - alturaMenu : b.bottom + 4;
    const left = Math.max(8, Math.min(b.right - LARGURA_MENU, window.innerWidth - LARGURA_MENU - 8));
    setPos({ top, left });
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e: Event) {
      const alvo = e.target as HTMLElement;
      if (botaoRef.current?.contains(alvo)) return;
      if (menuRef.current?.contains(alvo)) return;
      // modais de confirmação abertos a partir do menu também ficam num
      // portal — tocar neles não pode fechar o menu (senão o modal some)
      if (alvo.closest?.("[data-manter-menu]")) return;
      setAberto(false);
    }
    function aoRolar(e: Event) {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (document.querySelector("[data-manter-menu]")) return; // confirmação aberta
      setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("touchstart", aoClicarFora, { passive: true });
    window.addEventListener("scroll", aoRolar, true);
    window.addEventListener("resize", aoRolar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("touchstart", aoClicarFora);
      window.removeEventListener("scroll", aoRolar, true);
      window.removeEventListener("resize", aoRolar);
    };
  }, [aberto]);

  return (
    <div className="relative shrink-0">
      <button
        ref={botaoRef}
        onClick={() => setAberto((a) => !a)}
        aria-label="Mais ações"
        aria-expanded={aberto}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-700 transition"
      >
        <MoreVertical size={16} strokeWidth={2} />
      </button>
      {aberto &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              width: LARGURA_MENU,
              visibility: pos ? "visible" : "hidden",
            }}
            className="z-[60] bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/40 py-1.5"
          >
            {children(() => setAberto(false))}
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
