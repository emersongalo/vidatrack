"use client";

// Etapa 264 — menu lateral (computador) da área de Tarefas
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, Plus, LayoutGrid, Trash2, ListChecks } from "lucide-react";

const ITENS = [
  { href: "/tarefas", rotulo: "Minhas tarefas", Icone: CheckSquare },
  { href: "/tarefas/nova", rotulo: "Nova tarefa", Icone: Plus },
  { href: "/tarefas/revisao", rotulo: "Revisão da semana", Icone: ListChecks },
  { href: "/habitos/categorias", rotulo: "Categorias", Icone: LayoutGrid },
  { href: "/tarefas/lixeira", rotulo: "Lixeira", Icone: Trash2 },
];

export function SubmenuTarefas() {
  const pathname = usePathname() ?? "";
  return (
    <div className="flex flex-col gap-0.5 mt-1">
      {ITENS.map(({ href, rotulo, Icone }) => {
        const ativo = href === "/tarefas" ? pathname === "/tarefas" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              ativo ? "bg-nota/15 text-nota font-medium" : "text-ink-400 hover:text-ink-100 hover:bg-base-700"
            }`}
          >
            <Icone size={17} strokeWidth={2} />
            {rotulo}
          </Link>
        );
      })}
    </div>
  );
}
