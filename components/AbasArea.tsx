"use client";

// Etapa 230 — as abas de dentro de cada área (antes ficavam na barra de
// baixo) viram um seletor no topo. Só aparece nas telas principais.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LinkVoltar } from "@/components/LinkVoltar";

type Aba = { href: string; rotulo: string; tambem?: string[] };

const AREAS: Record<"habitos" | "financas", { cor: string; abas: Aba[] }> = {
  habitos: {
    cor: "bg-habito text-base-900",
    abas: [
      { href: "/habitos", rotulo: "Hoje" },
      { href: "/habitos/lista", rotulo: "Hábitos", tambem: ["/habitos/tarefas"] },
      { href: "/habitos/categorias", rotulo: "Categorias" },
      { href: "/habitos/timer", rotulo: "Timer" },
    ],
  },
  financas: {
    cor: "bg-financa text-base-900",
    abas: [
      { href: "/financas", rotulo: "Resumo" },
      { href: "/financas/contas", rotulo: "Contas" },
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

export function AbasArea({ area }: { area: keyof typeof AREAS }) {
  const pathname = usePathname() ?? "";
  const ativa = abaAtivaDaArea(area, pathname);
  if (!ativa) return null;
  const { cor, abas } = AREAS[area];
  return (
    <div className="lg:hidden max-w-2xl mx-auto px-6 md:px-12 pt-4">
      <div className="mb-3">
        <LinkVoltar href="/dashboard" texto="Painel" />
      </div>
      <div className="grid grid-cols-4 gap-1 bg-base-800 border border-base-600 rounded-2xl p-1">
        {abas.map((aba) => (
          <Link
            key={aba.href}
            href={aba.href}
            className={`text-center text-sm rounded-xl py-2 transition ${
              aba.href === ativa ? `${cor} font-semibold` : "text-ink-400 hover:text-ink-100"
            }`}
          >
            {aba.rotulo}
          </Link>
        ))}
      </div>
    </div>
  );
}
