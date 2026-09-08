"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Repeat, CheckSquare, LayoutGrid, Timer } from "lucide-react";

const ABAS = [
  { href: "/habitos", rotulo: "Hoje", Icone: CalendarCheck },
  { href: "/habitos/lista", rotulo: "Hábitos", Icone: Repeat },
  { href: "/habitos/tarefas", rotulo: "Tarefas", Icone: CheckSquare },
  { href: "/habitos/categorias", rotulo: "Categorias", Icone: LayoutGrid },
  { href: "/habitos/timer", rotulo: "Timer", Icone: Timer },
];

function ehAtiva(pathname: string, href: string) {
  return href === "/habitos" ? pathname === "/habitos" : pathname.startsWith(href);
}

// Lista de links pro menu lateral do desktop — sem wrapper de
// esconder/mostrar aqui, quem decide isso é o MenuLateralDesktop.
export function SubmenuHabitos() {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-0.5 mt-1">
      {ABAS.map((aba) => (
        <Link
          key={aba.href}
          href={aba.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
            ehAtiva(pathname, aba.href)
              ? "bg-habito/15 text-habito font-medium"
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

// Barra fixa de baixo — só pra celular/tablet.
export function BarraNavegacaoAgenda() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-800 border-t border-base-600 z-10">
      <div className="max-w-2xl mx-auto grid grid-cols-5">
        {ABAS.map((aba) => (
          <Link
            key={aba.href}
            href={aba.href}
            className={`flex flex-col items-center gap-1 py-2.5 text-xs transition ${
              ehAtiva(pathname, aba.href) ? "text-habito" : "text-ink-400 hover:text-ink-100"
            }`}
          >
            <aba.Icone size={19} strokeWidth={2} />
            {aba.rotulo}
          </Link>
        ))}
      </div>
    </nav>
  );
}
