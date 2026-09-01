"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/habitos", rotulo: "Hoje", icone: "📅" },
  { href: "/habitos/lista", rotulo: "Hábitos", icone: "🔁" },
  { href: "/habitos/tarefas", rotulo: "Tarefas", icone: "✓" },
  { href: "/habitos/categorias", rotulo: "Categorias", icone: "▦" },
  { href: "/habitos/timer", rotulo: "Timer", icone: "⏱" },
];

export function BarraNavegacaoAgenda() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-base-800 border-t border-base-600 z-10">
      <div className="max-w-2xl mx-auto grid grid-cols-5">
        {ABAS.map((aba) => {
          const ativa =
            aba.href === "/habitos" ? pathname === "/habitos" : pathname.startsWith(aba.href);
          return (
            <Link
              key={aba.href}
              href={aba.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-xs transition ${
                ativa ? "text-habito" : "text-ink-400 hover:text-ink-100"
              }`}
            >
              <span className="text-base leading-none">{aba.icone}</span>
              {aba.rotulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
