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

function ehAtiva(pathname: string, href: string) {
  return href === "/financas" ? pathname === "/financas" : pathname.startsWith(href);
}

// Lista de links pro menu lateral do desktop — sem wrapper de
// esconder/mostrar aqui, porque quem decide isso é o próprio
// MenuLateralDesktop (que já só aparece no desktop).
export function SubmenuFinancas() {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-0.5 mt-1">
      {ABAS.map((aba) => (
        <Link
          key={aba.href}
          href={aba.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
            ehAtiva(pathname, aba.href)
              ? "bg-financa/15 text-financa font-medium"
              : "text-ink-400 hover:text-ink-100 hover:bg-base-700"
          }`}
        >
          <aba.Icone size={17} strokeWidth={2} />
          {aba.rotulo}
        </Link>
      ))}
    </div>
  );
}

// Barra fixa de baixo — só pra celular/tablet (o desktop usa o menu
// lateral, com o SubmenuFinancas acima).
export function BarraNavegacaoFinancas() {
  const pathname = usePathname();

  return (
    <>
      <Link
        href="/financas/nova"
        aria-label="Novo lançamento"
        className="fixed bottom-24 right-5 lg:bottom-8 lg:right-8 z-20 w-14 h-14 rounded-full bg-financa text-base-900 flex items-center justify-center shadow-lg shadow-financa/30 hover:opacity-90 active:scale-95 transition"
      >
        <Plus size={26} strokeWidth={2.5} />
      </Link>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-800 border-t border-base-600 z-10">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {ABAS.map((aba) => (
            <Link
              key={aba.href}
              href={aba.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-xs transition ${
                ehAtiva(pathname, aba.href) ? "text-financa" : "text-ink-400 hover:text-ink-100"
              }`}
            >
              <aba.Icone size={20} strokeWidth={2} />
              {aba.rotulo}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
