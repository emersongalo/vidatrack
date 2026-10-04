"use client";

// Etapa 260 — no lugar do "Application error: a client-side exception
// has occurred" (tela preta que ficava presa mesmo depois da internet
// voltar). Quase sempre acontece quando a internet cai no meio da troca
// de tela e o app não consegue baixar o pedaço daquela tela: aqui ele
// avisa, e assim que a conexão volta recarrega sozinho.
import { useEffect, useState } from "react";
import { LogoAnimado } from "@/components/LogoAnimado";

const CHAVE = "vidatrack-recarregou-por-erro";

function ehErroDeCarregamento(e?: Error | null) {
  const m = `${e?.name ?? ""} ${e?.message ?? ""}`;
  return /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Failed to fetch|NetworkError|Load failed/i.test(m);
}

/** Recarrega no máximo 1 vez a cada 20s (evita ficar em loop se o erro for de verdade). */
function recarregarComCuidado() {
  try {
    const ultima = Number(sessionStorage.getItem(CHAVE) || 0);
    if (Date.now() - ultima < 20000) return false;
    sessionStorage.setItem(CHAVE, String(Date.now()));
  } catch {}
  window.location.reload();
  return true;
}

export function TelaDeErro({ error, reset }: { error?: Error & { digest?: string }; reset?: () => void }) {
  const [online, setOnline] = useState(true);
  // Etapa 261 — quando a internet volta, mostra o logo se montando antes de recarregar
  const [reconectando, setReconectando] = useState(false);
  const deCarregamento = ehErroDeCarregamento(error);

  useEffect(() => {
    setOnline(navigator.onLine);
    // registra (anônimo) pro painel de erros, quando houver internet
    try {
      if (navigator.onLine) {
        fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pagina: `erro-tela ${location.pathname}: ${error?.name ?? ""} ${error?.message ?? ""}`.slice(0, 200) }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}

    // erro de carregamento com internet: recarrega na hora
    if (deCarregamento && navigator.onLine) recarregarComCuidado();

    const voltou = () => {
      setOnline(true);
      setReconectando(true);
      // a internet voltou: mostra a animação e tenta de novo sozinho
      setTimeout(() => {
        if (!recarregarComCuidado()) reset?.();
      }, 1700);
    };
    const caiu = () => setOnline(false);
    window.addEventListener("online", voltou);
    window.addEventListener("offline", caiu);
    return () => {
      window.removeEventListener("online", voltou);
      window.removeEventListener("offline", caiu);
    };
  }, [error, reset, deCarregamento]);

  return (
    <main className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center text-center px-8 bg-base-900 text-ink-100">
      <div className="mb-6">
        <LogoAnimado estado={!online ? "offline" : reconectando ? "online" : "parado"} tamanho={150} />
      </div>
      <h1 className="text-2xl font-display font-bold">
        {reconectando ? "Conectado de novo! ✨" : online ? "Opa, essa tela travou" : "Sem internet no momento"}
      </h1>
      <p className="text-base text-ink-400 mt-2 max-w-xs">
        {reconectando
          ? "Recarregando o app…"
          : online
          ? "Não perdeu nada do que você salvou. Toque abaixo pra tentar de novo."
          : "Assim que a conexão voltar, o app recarrega sozinho. O que você marcou sem internet fica guardado e sincroniza depois."}
      </p>
      <div className="flex flex-col gap-2 w-full max-w-xs mt-6">
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.removeItem(CHAVE);
            } catch {}
            window.location.reload();
          }}
          className="w-full bg-habito text-base-900 rounded-2xl py-3.5 text-base font-semibold"
        >
          Recarregar o app
        </button>
        {reset && (
          <button type="button" onClick={() => reset()} className="w-full border border-base-600 rounded-2xl py-3 text-sm text-ink-400">
            Tentar só esta tela
          </button>
        )}
        <a href="/dashboard" className="text-sm text-ink-400 underline mt-2">
          Voltar pro Início
        </a>
      </div>
    </main>
  );
}
