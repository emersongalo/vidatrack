"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CHAVE_DESBLOQUEADO,
  CHAVE_SAIU_EM,
  EVENTO_PIN,
  MINUTOS_PARA_BLOQUEAR,
  conferirPin,
  marcarDesbloqueado,
  pinAtivo,
  removerPin,
} from "@/lib/seguranca/pin";

// Etapa 214 — tela de bloqueio por PIN (opcional, ativada no Perfil)
const ROTAS_LIVRES = ["/login", "/auth", "/esqueci-senha", "/redefinir-senha", "/verifique-email", "/conta-excluida", "/privacidade", "/apresentacao", "/doacao"];

export function BloqueioApp() {
  const pathname = usePathname() ?? "";
  const [bloqueado, setBloqueado] = useState(false);
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [tentativas, setTentativas] = useState(0);
  const [esperarAte, setEsperarAte] = useState(0);
  const [confirmarEsqueci, setConfirmarEsqueci] = useState(false);

  const rotaLivre = pathname === "/" || ROTAS_LIVRES.some((r) => pathname.startsWith(r));

  const avaliar = useCallback(() => {
    if (!pinAtivo()) {
      setBloqueado(false);
      document.documentElement.removeAttribute("data-bloqueado");
      return;
    }
    let precisa = false;
    try {
      const desbloqueado = sessionStorage.getItem(CHAVE_DESBLOQUEADO);
      const saiuEm = Number(sessionStorage.getItem(CHAVE_SAIU_EM) || 0);
      precisa = !desbloqueado || (saiuEm > 0 && Date.now() - saiuEm > MINUTOS_PARA_BLOQUEAR * 60000);
    } catch {
      precisa = true;
    }
    if (precisa) {
      try {
        sessionStorage.removeItem(CHAVE_DESBLOQUEADO);
      } catch {}
      setBloqueado(true);
      setPin("");
      setErro(null);
    } else {
      try {
        sessionStorage.removeItem(CHAVE_SAIU_EM);
      } catch {}
      document.documentElement.removeAttribute("data-bloqueado");
    }
  }, []);

  useEffect(() => {
    avaliar();
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "hidden") {
        try {
          if (sessionStorage.getItem(CHAVE_DESBLOQUEADO)) sessionStorage.setItem(CHAVE_SAIU_EM, String(Date.now()));
        } catch {}
      } else {
        avaliar();
      }
    };
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    window.addEventListener(EVENTO_PIN, avaliar);
    return () => {
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      window.removeEventListener(EVENTO_PIN, avaliar);
    };
  }, [avaliar]);

  // Nas telas de login/cadastro nunca bloqueia
  useEffect(() => {
    if (rotaLivre) document.documentElement.removeAttribute("data-bloqueado");
  }, [rotaLivre]);

  const tentar = useCallback(
    async (valor: string) => {
      if (Date.now() < esperarAte) return;
      if (await conferirPin(valor)) {
        marcarDesbloqueado();
        setBloqueado(false);
        setPin("");
        setErro(null);
        setTentativas(0);
        return;
      }
      const n = tentativas + 1;
      setTentativas(n);
      setPin("");
      if (n >= 5) {
        setEsperarAte(Date.now() + 30000);
        setTentativas(0);
        setErro("Muitas tentativas. Espere 30 segundos.");
      } else {
        setErro("PIN incorreto");
      }
    },
    [esperarAte, tentativas]
  );

  const digitar = (d: string) => {
    if (Date.now() < esperarAte) return;
    setErro(null);
    const novo = (pin + d).slice(0, 6);
    setPin(novo);
  };

  const esqueci = async () => {
    removerPin();
    try {
      await createClient().auth.signOut();
    } catch {}
    window.location.href = "/login";
  };

  if (!bloqueado || rotaLivre) return null;

  return (
    <div
      id="bloqueio-app"
      className="fixed inset-0 z-[9999] bg-base-900 flex flex-col items-center justify-center p-6 select-none"
    >
      <img src="/icons/icon-192.png" alt="" className="w-16 h-16 rounded-2xl mb-4" onError={(e) => (e.currentTarget.style.display = "none")} />
      <p className="text-lg font-display font-semibold mb-1">VidaTrack bloqueado</p>
      <p className="text-sm text-ink-400 mb-6">Digite seu PIN</p>

      <div className="flex gap-3 mb-3 h-4">
        {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
          <span
            key={i}
            className={`w-3.5 h-3.5 rounded-full border ${i < pin.length ? "bg-ink-100 border-ink-100" : "border-base-600"}`}
          />
        ))}
      </div>
      <p className="text-sm text-red-400 h-5 mb-4">{erro ?? ""}</p>

      <div className="grid grid-cols-3 gap-3 w-64">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => digitar(d)}
            className="h-14 rounded-xl bg-base-800 border border-base-600 text-xl font-mono active:bg-base-700"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPin((p) => p.slice(0, -1))}
          className="h-14 rounded-xl text-ink-400 text-lg"
          aria-label="Apagar"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={() => digitar("0")}
          className="h-14 rounded-xl bg-base-800 border border-base-600 text-xl font-mono active:bg-base-700"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => tentar(pin)}
          disabled={pin.length < 4}
          className="h-14 rounded-xl bg-ink-100 text-base-900 font-medium disabled:opacity-30"
        >
          OK
        </button>
      </div>

      <div className="mt-8 text-center">
        {!confirmarEsqueci ? (
          <button type="button" onClick={() => setConfirmarEsqueci(true)} className="text-xs text-ink-400 underline">
            Esqueci o PIN
          </button>
        ) : (
          <div className="text-xs text-ink-400 space-y-2 max-w-xs">
            <p>Você vai sair da conta e o PIN será removido deste aparelho. Seus dados continuam salvos — é só entrar de novo.</p>
            <div className="flex gap-2 justify-center">
              <button type="button" onClick={() => setConfirmarEsqueci(false)} className="px-3 py-1.5 rounded-lg border border-base-600">
                Cancelar
              </button>
              <button type="button" onClick={esqueci} className="px-3 py-1.5 rounded-lg bg-red-500/80 text-white">
                Sair e remover PIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
