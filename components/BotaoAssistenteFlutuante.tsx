"use client";

import Link from "next/link";
import { Bot } from "lucide-react";

/**
 * Etapa 149 — botão flutuante discreto pro assistente, sempre visível
 * em qualquer tela de Finanças (empilhado por cima do "+", na mesma
 * ponta onde fica a aba Mais). Clica e abre direto — sem menu no
 * meio, já que só leva pra um lugar.
 */
export function BotaoAssistenteFlutuante() {
  return (
    <Link
      href="/financas/assistente"
      aria-label="Assistente"
      className="fixed bottom-40 right-5 lg:bottom-24 lg:right-8 z-20 w-11 h-11 rounded-full flex items-center justify-center"
    >
      <span className="absolute inset-0 rounded-full bg-habito/50 animate-ping" />
      <span className="relative w-11 h-11 rounded-full bg-habito text-base-900 flex items-center justify-center shadow-lg shadow-habito/40 hover:opacity-90 active:scale-95 transition">
        <Bot size={20} strokeWidth={2} />
      </span>
    </Link>
  );
}
