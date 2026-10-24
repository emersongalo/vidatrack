"use client";

// Etapa 341 — Tarefas | Agenda (só no celular; no computador fica no menu lateral)
import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/tarefas", rotulo: "✅ Tarefas" },
  { href: "/tarefas/agenda", rotulo: "🗓️ Agenda" },
];

export function AbasTarefasAgenda() {
  const pathname = usePathname() ?? "";
  const i = ABAS.findIndex((a) => a.href === pathname);
  if (i < 0) return null;
  return (
    <div className="lg:hidden max-w-2xl mx-auto px-6 md:px-12 pt-3">
      <div className="relative grid grid-cols-2 gap-1 bg-base-800 border border-base-600 rounded-2xl p-1">
        <span
          aria-hidden
          className="vt-aba-pilula absolute top-1 bottom-1 left-1 rounded-xl bg-nota shadow-sm"
          style={{ width: "calc((100% - 12px) / 2)", transform: `translateX(calc(${i} * (100% + 4px)))` }}
        />
        {ABAS.map((a, j) => (
          <Link
            key={a.href}
            href={a.href}
            className={`relative z-10 text-center text-sm rounded-xl py-2 transition-colors duration-300 ${j === i ? "text-base-900 font-semibold" : "text-ink-400 hover:text-ink-100"}`}
          >
            {a.rotulo}
          </Link>
        ))}
      </div>
    </div>
  );
}
