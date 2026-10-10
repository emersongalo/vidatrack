"use client";

// Etapa 279 — tour de boas-vindas (3 telas) pra quem acabou de chegar.
// Aparece uma vez por aparelho, só pra conta "vazia". Dá pra pular.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { chuvaDeConfete } from "@/lib/app/festa";

const CHAVE = "vidatrack-tour-visto";

const TELAS = [
  {
    emoji: "🌱",
    cor: "var(--c-habito)",
    titulo: "Hábitos que crescem com você",
    texto: "Marque o que fez no dia, veja a sequência 🔥 subir e o hábito evoluir de Semente até Lenda 👑.",
  },
  {
    emoji: "✅",
    cor: "var(--c-nota)",
    titulo: "Tarefas sem esquecer nada",
    texto: "Lembretes, listas por categoria, modo foco e uma revisão rápida da semana pra começar em dia.",
  },
  {
    emoji: "💰",
    cor: "var(--c-financa)",
    titulo: "Dinheiro sob controle",
    texto: "Lance em 2 toques, veja quanto pode gastar hoje e como o saldo fica até o fim do mês. Dá pra dividir a conta com quem você ama.",
  },
];

export function TourInicial({ contaVazia }: { contaVazia: boolean }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [i, setI] = useState(0);
  const inicioX = useRef<number | null>(null);

  useEffect(() => {
    if (!contaVazia) return;
    try {
      if (localStorage.getItem(CHAVE)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setAberto(true), 2800); // depois da abertura
    return () => clearTimeout(t);
  }, [contaVazia]);

  function fechar(destino?: string) {
    try {
      localStorage.setItem(CHAVE, "1");
    } catch {
      /* sem armazenamento */
    }
    setAberto(false);
    if (destino) router.push(destino);
  }

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
      if (e.key === "ArrowRight") setI((n) => Math.min(TELAS.length - 1, n + 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  if (!aberto || typeof document === "undefined") return null;
  const tela = TELAS[i];
  const ultima = i === TELAS.length - 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] bg-base-900 flex flex-col animate-folha"
      role="dialog"
      aria-label="Boas-vindas"
      onTouchStart={(e) => (inicioX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (inicioX.current === null) return;
        const dx = e.changedTouches[0].clientX - inicioX.current;
        inicioX.current = null;
        if (dx < -50) setI((n) => Math.min(TELAS.length - 1, n + 1));
        if (dx > 50) setI((n) => Math.max(0, n - 1));
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 transition-[background] duration-700"
        style={{ background: `radial-gradient(120% 70% at 50% 0%, rgb(${tela.cor} / 0.28), transparent 70%)` }}
      />
      <div className="relative flex justify-end px-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <button type="button" onClick={() => fechar()} className="text-sm text-ink-400 hover:text-ink-100 px-2 py-1">
          Pular
        </button>
      </div>

      <div key={i} className="relative flex-1 flex flex-col items-center justify-center text-center px-8 entrada-avancar">
        <div
          className="w-36 h-36 rounded-[2.5rem] flex items-center justify-center text-7xl mb-8 animate-boiar shadow-2xl"
          style={{ background: `rgb(${tela.cor} / 0.18)`, boxShadow: `0 20px 60px -10px rgb(${tela.cor} / 0.45)` }}
        >
          {tela.emoji}
        </div>
        <h2 className="text-3xl font-display font-bold leading-tight max-w-sm">{tela.titulo}</h2>
        <p className="text-base text-ink-400 mt-3 max-w-sm">{tela.texto}</p>
      </div>

      <div className="relative px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <div className="flex justify-center gap-2 mb-6">
          {TELAS.map((_, n) => (
            <button
              key={n}
              type="button"
              aria-label={`Tela ${n + 1}`}
              onClick={() => setI(n)}
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: n === i ? 28 : 8, background: n === i ? `rgb(${tela.cor})` : "rgb(var(--c-ink-400) / 0.35)" }}
            />
          ))}
        </div>
        {ultima ? (
          <button
            type="button"
            onClick={() => {
              chuvaDeConfete({ quantidade: 50 });
              fechar("/bem-vindo");
            }}
            className="w-full rounded-2xl py-4 text-base font-semibold text-base-900 active:scale-[0.98] transition"
            style={{ background: `rgb(${tela.cor})` }}
          >
            Montar meu app em 1 minuto ✨
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setI((n) => n + 1)}
            className="w-full rounded-2xl py-4 text-base font-semibold text-base-900 active:scale-[0.98] transition"
            style={{ background: `rgb(${tela.cor})` }}
          >
            Continuar
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
