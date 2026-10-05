"use client";

// Menu lateral do computador (a barra de baixo só aparece no celular).
// Etapa 256 — trocar de área direto daqui (Início · Hábitos · Finanças),
// e também aparece no Início, que antes ficava sem menu no computador.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Repeat, Wallet, Search, User, CheckSquare } from "lucide-react";

const AREAS = [
  { id: "inicio", href: "/dashboard", rotulo: "Início", Icone: Home, ativa: "bg-ink-100/10 text-ink-100" },
  { id: "habito", href: "/habitos", rotulo: "Hábitos", Icone: Repeat, ativa: "bg-habito/15 text-habito" },
  // Etapa 264 — Tarefas virou área própria
  { id: "tarefa", href: "/tarefas", rotulo: "Tarefas", Icone: CheckSquare, ativa: "bg-nota/15 text-nota" },
  { id: "financa", href: "/financas", rotulo: "Finanças", Icone: Wallet, ativa: "bg-financa/15 text-financa" },
] as const;

export function MenuLateralDesktop({
  corAtiva,
  submenu,
}: {
  corAtiva: "inicio" | "habito" | "tarefa" | "financa";
  submenu?: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const cor = corAtiva === "financa" ? "#D9A24C" : corAtiva === "tarefa" ? "#9C8FD9" : "#7FB894";

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-30 bg-base-800 border-r border-base-600 px-4 py-6 overflow-y-auto">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2 mb-6">
        <svg width="26" height="26" viewBox="0 0 100 100" className="shrink-0">
          <line x1="26" y1="73" x2="73" y2="26" stroke={cor} strokeWidth="9" strokeLinecap="round" />
          <circle cx="38" cy="61" r="6" fill="#7FB894" />
          <circle cx="61" cy="38" r="6" fill="#D9A24C" />
        </svg>
        <span className="font-display font-bold text-lg text-ink-100">VidaTrack</span>
      </Link>

      <nav className="space-y-1 mb-4" aria-label="Áreas do app">
        {AREAS.map(({ id, href, rotulo, Icone, ativa }) => {
          const ativo = id === corAtiva;
          return (
            <Link
              key={id}
              href={href}
              aria-current={ativo ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition ${
                ativo ? ativa : "text-ink-400 hover:text-ink-100 hover:bg-base-700"
              }`}
            >
              <Icone size={19} strokeWidth={2.2} />
              {rotulo}
            </Link>
          );
        })}
        <Link
          href="/buscar"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-base transition ${
            pathname.startsWith("/buscar") ? "bg-ink-100/10 text-ink-100" : "text-ink-400 hover:text-ink-100 hover:bg-base-700"
          }`}
        >
          <Search size={19} strokeWidth={2.2} />
          Buscar
        </Link>
      </nav>

      {submenu && (
        <>
          <div className="border-t border-base-600 my-2" />
          {submenu}
        </>
      )}

      <div className="flex-1" />

      <Link
        href="/perfil"
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-400 hover:text-ink-100 hover:bg-base-700 transition"
      >
        <User size={18} />
        Perfil
      </Link>
    </aside>
  );
}
