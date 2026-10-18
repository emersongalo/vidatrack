"use client";

// Etapa 230 — as abas de dentro de cada área (antes ficavam na barra de
// baixo) viram um seletor no topo. Só aparece nas telas principais.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LinkVoltar } from "@/components/LinkVoltar";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";
import { EVENTO_SNAPSHOT } from "@/lib/offline/useSnapshot";

type Aba = { href: string; rotulo: string; tambem?: string[]; soComCartao?: boolean };

const AREAS: Record<"habitos" | "financas", { cor: string; abas: Aba[] }> = {
  habitos: {
    cor: "bg-habito text-base-900",
    abas: [
      { href: "/habitos", rotulo: "Hoje" },
      { href: "/habitos/lista", rotulo: "Hábitos" },
      { href: "/habitos/categorias", rotulo: "Categorias" },
      { href: "/habitos/timer", rotulo: "Timer" },
    ],
  },
  financas: {
    cor: "bg-financa text-base-900",
    abas: [
      { href: "/financas", rotulo: "Resumo" },
      { href: "/financas/contas", rotulo: "Contas" },
      // Etapa 330 — aba própria dos cartões (só aparece pra quem tem cartão)
      { href: "/financas/cartoes", rotulo: "Cartões", soComCartao: true },
      { href: "/financas/extrato", rotulo: "Extrato" },
      { href: "/financas/mais", rotulo: "Mais" },
    ],
  },
};

export function abaAtivaDaArea(area: keyof typeof AREAS, pathname: string): string | null {
  for (const aba of AREAS[area].abas) {
    if (pathname === aba.href || aba.tambem?.includes(pathname)) return aba.href;
  }
  return null;
}

/** Etapa 330 — a pessoa tem algum cartão de crédito cadastrado? (lê o retrato local) */
function useTemCartao() {
  const [tem, setTem] = useState(false);
  useEffect(() => {
    const ler = () => setTem(((lerSnapshotOffline()?.financas?.contas ?? []) as any[]).some((c) => c.tipo === "cartao" && !c.arquivado));
    ler();
    window.addEventListener(EVENTO_SNAPSHOT, ler);
    return () => window.removeEventListener(EVENTO_SNAPSHOT, ler);
  }, []);
  return tem;
}

export function AbasArea({ area }: { area: keyof typeof AREAS }) {
  const pathname = usePathname() ?? "";
  const temCartao = useTemCartao();
  const ativa = abaAtivaDaArea(area, pathname);
  if (!ativa) return null;
  const { cor } = AREAS[area];
  const abas = AREAS[area].abas.filter((a) => !a.soComCartao || temCartao || a.href === ativa);
  return (
    <div className="lg:hidden max-w-2xl mx-auto px-6 md:px-12 pt-4">
      <div className="mb-3">
        <LinkVoltar href="/dashboard" texto="Painel" />
      </div>
      {/* Etapa 334 — a pílula da aba ativa desliza até a aba tocada */}
      <div className={`relative grid ${abas.length > 4 ? "grid-cols-5" : "grid-cols-4"} gap-1 bg-base-800 border border-base-600 rounded-2xl p-1`}>
        <span
          aria-hidden
          className={`vt-aba-pilula absolute top-1 bottom-1 left-1 rounded-xl shadow-sm ${cor}`}
          style={{
            width: `calc((100% - 8px - ${(abas.length - 1) * 4}px) / ${abas.length})`,
            transform: `translateX(calc(${Math.max(0, abas.findIndex((a) => a.href === ativa))} * (100% + 4px)))`,
          }}
        />
        {abas.map((aba) => (
          <Link
            key={aba.href}
            href={aba.href}
            className={`relative z-10 text-center ${abas.length > 4 ? "text-[13px]" : "text-sm"} rounded-xl py-2 transition-colors duration-300 ${
              aba.href === ativa ? "text-base-900 font-semibold" : "text-ink-400 hover:text-ink-100"
            }`}
          >
            {aba.rotulo}
          </Link>
        ))}
      </div>
    </div>
  );
}
