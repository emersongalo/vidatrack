"use client";

// Etapa 224 — atalhos grandes no Painel: o que a pessoa mais faz.
import Link from "next/link";
import { Bot, CheckCircle2, Minus, Plus } from "lucide-react";

const ATALHOS = [
  { href: "/financas?gasto=1", rotulo: "Gasto", Icone: Minus, cor: "bg-red-400/15 text-red-400" },
  { href: "/financas/nova?tipo=receita", rotulo: "Receita", Icone: Plus, cor: "bg-habito/15 text-habito" },
  { href: "/habitos", rotulo: "Marcar hábito", Icone: CheckCircle2, cor: "bg-financa/15 text-financa" },
  { href: "/financas/assistente", rotulo: "Assistente", Icone: Bot, cor: "bg-nota/15 text-nota" },
];

export function AtalhosPainel() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {ATALHOS.map(({ href, rotulo, Icone, cor }) => (
        <Link key={rotulo} href={href} className="flex flex-col items-center gap-1.5 py-1 active:scale-95 transition">
          <span className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cor}`}>
            <Icone size={24} strokeWidth={2.2} />
          </span>
          <span className="text-sm text-center leading-tight">{rotulo}</span>
        </Link>
      ))}
    </div>
  );
}
