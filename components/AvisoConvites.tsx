"use client";

// Etapa 273 — quando chega um convite de compartilhamento, aparece uma
// folha embaixo (em qualquer tela do app) pra aceitar ou recusar na
// hora. "Depois" esconde até a próxima vez que o app abrir; o convite
// continua em /convites.
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { CartaoConvite, useConvitesPendentes } from "@/components/ConvitesPendentes";

// no Início os convites já aparecem na própria tela
const ROTAS_SEM_AVISO = ["/dashboard", "/login", "/bem-vindo", "/apresentacao", "/convites", "/esqueci-senha", "/redefinir-senha", "/verifique-email", "/privacidade", "/conta-excluida"];
const CHAVE_DEPOIS = "vt-convites-depois";

function lerDepois(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_DEPOIS) ?? "[]");
  } catch {
    return [];
  }
}

export function AvisoConvites() {
  const pathname = usePathname() ?? "";
  const { convites } = useConvitesPendentes();
  const [pronto, setPronto] = useState(false);
  const [depois, setDepois] = useState<string[]>([]);
  const [respondidos, setRespondidos] = useState<string[]>([]);

  // espera a animação de abertura passar
  useEffect(() => {
    setDepois(lerDepois());
    const t = setTimeout(() => setPronto(true), 2600);
    return () => clearTimeout(t);
  }, []);

  const visiveis = (convites ?? []).filter((c) => !depois.includes(c.id) && !respondidos.includes(c.id));
  const rotaBloqueada = pathname === "/" || ROTAS_SEM_AVISO.some((r) => pathname.startsWith(r));
  const aberto = pronto && !rotaBloqueada && visiveis.length > 0;

  // botão voltar do Android manda "Escape" pras folhas: aqui vira "Depois"
  const refDepois = useRef<() => void>(() => {});
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") refDepois.current();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  if (!aberto) return null;
  const primeiro = visiveis[0];
  refDepois.current = deixarPraDepois;

  function deixarPraDepois() {
    const ids = [...new Set([...depois, ...visiveis.map((c) => c.id)])];
    try {
      sessionStorage.setItem(CHAVE_DEPOIS, JSON.stringify(ids));
    } catch {
      /* sem armazenamento */
    }
    setDepois(ids);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 pb-[calc(env(safe-area-inset-bottom)+5.25rem)] lg:pb-6 lg:left-auto lg:right-6 lg:w-[26rem] pointer-events-none">
      <div className="pointer-events-auto animate-folha rounded-3xl bg-base-900/95 backdrop-blur border border-base-600 shadow-2xl p-3">
        <div className="flex items-center justify-between px-1 pb-2">
          <p className="text-sm font-semibold">
            {visiveis.length > 1 ? `Você tem ${visiveis.length} convites` : "Novo convite pra você"}
          </p>
          <div className="flex items-center gap-3">
            {visiveis.length > 1 && (
              <Link href="/convites" className="text-xs text-habito hover:underline">
                Ver todos
              </Link>
            )}
            <button type="button" onClick={deixarPraDepois} aria-label="Ver depois" className="text-ink-400 hover:text-ink-100 transition">
              <X size={18} />
            </button>
          </div>
        </div>
        <CartaoConvite key={primeiro.id} convite={primeiro} aoResponder={(id) => setRespondidos((r) => [...r, id])} />
      </div>
    </div>
  );
}
