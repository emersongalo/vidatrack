"use client";

import { useState } from "react";
import Link from "next/link";

// Troque pela sua chave Pix real antes de publicar
const CHAVE_PIX = "sua-chave-pix@exemplo.com";

export default function DoacaoPage() {
  const [copiado, setCopiado] = useState(false);

  function copiarChave() {
    navigator.clipboard.writeText(CHAVE_PIX);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href="/dashboard" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Painel
      </Link>

      <div className="text-center mt-8">
        <p className="text-3xl mb-3">💛</p>
        <h1 className="text-2xl font-display font-semibold mb-2">Apoie o VidaTrack</h1>
        <p className="text-ink-400 text-sm mb-8">
          O app é e sempre vai ser gratuito. Se ele te ajuda no dia a dia
          e você quiser contribuir com os custos de manter tudo no ar,
          fica aqui um Pix — sem nenhuma obrigação.
        </p>
      </div>

      <div className="bg-base-800 border border-base-600 rounded-xl2 p-5">
        <p className="text-xs text-ink-400 mb-1">Chave Pix</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm bg-base-900 rounded-lg px-3 py-2 truncate">{CHAVE_PIX}</code>
          <button
            onClick={copiarChave}
            className="text-sm bg-ink-100 text-base-900 font-medium rounded-lg px-3 py-2 hover:opacity-90 transition shrink-0"
          >
            {copiado ? "Copiado!" : "Copiar"}
          </button>
        </div>
        <p className="text-xs text-ink-400 mt-3">
          Cole essa chave no app do seu banco para fazer um Pix de
          qualquer valor.
        </p>
      </div>

      <p className="text-xs text-ink-400 text-center mt-6">
        Obrigado por usar o VidaTrack. 🙏
      </p>
    </main>
  );
}
