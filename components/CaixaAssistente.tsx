"use client";

// Etapa 232 — no lugar dos atalhos repetidos: uma caixa pra perguntar ou
// lançar direto pro assistente ("gastei 30 no mercado", "quanto gastei
// com lanche esse mês?"). Abre o assistente já com a frase enviada.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, SendHorizontal } from "lucide-react";

const EXEMPLOS = ["gastei 30 no mercado", "quanto gastei esse mês?", "recebi 500 de freela"];

export function CaixaAssistente() {
  const router = useRouter();
  const [texto, setTexto] = useState("");

  function enviar(frase: string) {
    const f = frase.trim();
    router.push(f ? `/financas/assistente?texto=${encodeURIComponent(f)}` : "/financas/assistente");
  }

  return (
    <section className="bg-base-800 border border-base-600 rounded-3xl p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
        className="flex items-center gap-2"
      >
        <span className="w-11 h-11 rounded-2xl bg-nota/15 text-nota flex items-center justify-center shrink-0">
          <Bot size={22} />
        </span>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={300}
          placeholder="Pergunte ou lance algo…"
          aria-label="Falar com o assistente"
          enterKeyHint="send"
          className="flex-1 min-w-0 bg-transparent text-base text-ink-100 placeholder:text-ink-400 outline-none py-2"
        />
        <button
          type="submit"
          aria-label="Enviar pro assistente"
          className="w-11 h-11 rounded-2xl bg-ink-100 text-base-900 flex items-center justify-center shrink-0 active:scale-95 transition"
        >
          <SendHorizontal size={19} />
        </button>
      </form>
      <div className="flex gap-2 mt-3 overflow-x-auto -mx-1 px-1" data-gesto-proprio="1">
        {EXEMPLOS.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => enviar(ex)}
            className="shrink-0 text-sm text-ink-400 border border-base-600 rounded-full px-3 py-1.5 hover:text-ink-100 transition"
          >
            {ex}
          </button>
        ))}
      </div>
    </section>
  );
}
