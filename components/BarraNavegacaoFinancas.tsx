"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/financas", rotulo: "Início", icone: "🏠" },
  { href: "/financas/contas", rotulo: "Contas", icone: "🏦" },
  { href: "/financas/extrato", rotulo: "Extrato", icone: "🧾" },
  { href: "/financas/mais", rotulo: "Mais", icone: "⋯" },
];

export function BarraNavegacaoFinancas() {
  const pathname = usePathname();

  return (
    <>
      <Link
        href="/financas/nova"
        aria-label="Novo lançamento"
        className="fixed bottom-20 right-5 z-20 w-14 h-14 rounded-full bg-financa text-base-900 flex items-center justify-center text-2xl font-semibold shadow-lg shadow-financa/30 hover:opacity-90 active:scale-95 transition"
      >
        +
      </Link>

      <nav className="fixed bottom-0 left-0 right-0 bg-base-800 border-t border-base-600 z-10">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {ABAS.map((aba) => {
            const ativa = aba.href === "/financas" ? pathname === "/financas" : pathname.startsWith(aba.href);
            return (
              <Link
                key={aba.href}
                href={aba.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-xs transition ${
                  ativa ? "text-financa" : "text-ink-400 hover:text-ink-100"
                }`}
              >
                <span className="text-base leading-none">{aba.icone}</span>
                {aba.rotulo}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
