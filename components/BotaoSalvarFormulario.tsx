"use client";

import { useFormStatus } from "react-dom";

/**
 * Precisa ser usado DENTRO de um <form action={...}> — é assim que o
 * useFormStatus sabe se aquele formulário específico está enviando.
 * Substitui um <button type="submit"> comum: evita que um clique
 * duplo (ou demora na resposta) crie o mesmo registro duas vezes.
 */
export function BotaoSalvarFormulario({
  children,
  textoEnviando = "Salvando...",
  className = "w-full bg-ink-100 text-base-900 font-medium rounded-2xl py-3.5 hover:opacity-90 transition disabled:opacity-50",
  estilo,
}: {
  children: React.ReactNode;
  textoEnviando?: string;
  className?: string;
  /** Etapa 223 — cor dinâmica (ex: verde/vermelho do lançamento) */
  estilo?: React.CSSProperties;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} style={estilo}>
      {pending ? textoEnviando : children}
    </button>
  );
}
