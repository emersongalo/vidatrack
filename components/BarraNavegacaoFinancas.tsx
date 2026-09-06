"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Landmark, Receipt, MoreHorizontal, Plus } from "lucide-react";

const ABAS = [
  { href: "/financas", rotulo: "Início", Icone: Home },
  { href: "/financas/contas", rotulo: "Contas", Icone: Landmark },
  { href: "/financas/extrato", rotulo: "Extrato", Icone: Receipt },
  { href: "/financas/mais", rotulo: "Mais", Icone: MoreHorizontal },
];

export function BarraNavegacaoFinancas() {
  const pathname = usePathname();

  return (
    <>
      <Link
        href="/financas/nova"
        aria-label="Novo lançamento"
        className="fixed bottom-24 right-5 z-20 w-14 h-14 rounded-full bg-financa text-base-900 flex items-center justify-center shadow-lg shadow-financa/30 hover:opacity-90 active:scale-95 transition"
      >
        <Plus size={26} strokeWidth={2.5} />
      </Link>

      <nav className="fixed bottom-0 left-0 right-0 bg-base-800 border-t border-base-600 z-10">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {ABAS.map((aba) => {
            const ativa = aba.href === "/financas" ? pathname === "/financas" : pathname.startsWith(aba.href);
            return (
              <Link
                key={aba.href}
                href={aba.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs transition ${
                  ativa ? "text-financa" : "text-ink-400 hover:text-ink-100"
                }`}
              >
                <aba.Icone size={20} strokeWidth={2} />
                {aba.rotulo}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
