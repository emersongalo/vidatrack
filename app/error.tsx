"use client";

// Etapa 260 — erro dentro de uma tela: mostra a tela amigável (não a preta do Next)
import { TelaDeErro } from "@/components/TelaDeErro";

export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <TelaDeErro error={error} reset={reset} />;
}
