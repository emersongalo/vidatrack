"use client";

// Etapa 260 — erro no próprio layout do app (último recurso). Precisa de <html> e <body>.
import "./globals.css";
import { TelaDeErro } from "@/components/TelaDeErro";

export default function ErroGlobal({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <body>
        <TelaDeErro error={error} reset={reset} />
      </body>
    </html>
  );
}
