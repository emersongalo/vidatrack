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
  className = "w-full bg-ink-100 text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition disabled:opacity-50",
}: {
  children: React.ReactNode;
  textoEnviando?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? textoEnviando : children}
    </button>
  );
}
