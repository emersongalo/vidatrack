"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

const LIMIAR_ABRIR = 64; // arrastar mais que isso revela o fundo vermelho "pronto pra soltar"
const LIMIAR_CONFIRMAR = 110; // soltar depois disso já pede a confirmação

/**
 * Etapa 181 — arrastar uma linha da lista pra esquerda mostra "Excluir"
 * atrás, em vermelho — comum em apps de e-mail/finanças. Mas
 * IMPORTANTE: soltar não apaga na hora. Sempre pede a mesma
 * confirmação que já existia (igual ao BotaoComConfirmacao), só que
 * disparada pelo gesto em vez de um botão — excluir é definitivo
 * demais pra confiar só num arrasto sem querer.
 */
export function LinhaComDeslizar({
  acao,
  textoConfirmacao = "Tem certeza?",
  aoConcluir,
  children,
}: {
  acao: () => void | Promise<void>;
  textoConfirmacao?: string;
  aoConcluir?: () => void;
  children: ReactNode;
}) {
  const [arrastoX, setArrastoX] = useState(0);
  const [confirmando, setConfirmando] = useState(false);
  const [pendente, iniciarTransicao] = useTransition();
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const arrastando = useRef(false);

  function aoTocar(e: React.TouchEvent) {
    inicio.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    arrastando.current = false;
  }

  function aoMover(e: React.TouchEvent) {
    if (!inicio.current) return;
    const dx = e.touches[0].clientX - inicio.current.x;
    const dy = e.touches[0].clientY - inicio.current.y;
    if (!arrastando.current) {
      // só decide que É um arrasto horizontal depois de um mínimo de
      // movimento — evita capturar um toque comum ou rolagem vertical
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        inicio.current = null; // é rolagem vertical, desiste
        return;
      }
      arrastando.current = true;
    }
    // só arrasta pra esquerda (dx negativo); trava num máximo razoável
    setArrastoX(Math.max(-120, Math.min(0, dx)));
  }

  function aoSoltar() {
    if (!inicio.current) return;
    inicio.current = null;
    if (Math.abs(arrastoX) >= LIMIAR_CONFIRMAR) {
      setConfirmando(true);
    }
    setArrastoX(0); // sempre volta pro lugar — o vermelho não fica "aberto" sozinho
  }

  function confirmar() {
    iniciarTransicao(async () => {
      await acao();
      setConfirmando(false);
      aoConcluir?.();
    });
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-red-400 flex items-center justify-end pr-5 rounded-lg">
        <Trash2 size={18} className="text-base-900" />
      </div>
      <div
        onTouchStart={aoTocar}
        onTouchMove={aoMover}
        onTouchEnd={aoSoltar}
        style={{
          transform: `translateX(${arrastoX}px)`,
          transition: arrastoX === 0 ? "transform 200ms ease-out" : "none",
        }}
        className="relative"
      >
        {children}
      </div>

      {confirmando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60"
          onClick={() => !pendente && setConfirmando(false)}
        >
          <div
            className="bg-base-800 border border-base-600 rounded-xl2 p-5 max-w-xs w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-ink-100 mb-4">{textoConfirmacao}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                disabled={pendente}
                className="flex-1 border border-base-600 rounded-lg py-2 text-sm hover:bg-base-700 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={pendente}
                className="flex-1 bg-red-400 text-base-900 font-medium rounded-lg py-2 text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {pendente ? "..." : "Sim, excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
