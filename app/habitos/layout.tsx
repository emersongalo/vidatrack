import { ReactNode } from "react";
import { FloatingDock } from "@/components/FloatingDock";

const ITENS_HABITOS = [
  { href: "/habitos", rotulo: "Hoje", icone: "🗓️" },
  { href: "/habitos/lista", rotulo: "Hábitos", icone: "🔁" },
  { href: "/habitos/estatisticas", rotulo: "Painel", icone: "📊" },
  { href: "/habitos/timer", rotulo: "Timer", icone: "⏱️" },
];

export default function HabitosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07080c] text-neutral-100 relative pb-32">
      {/* Luz ambiental esmeralda */}
      <div className="pointer-events-none fixed -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full z-0" />
      
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6">
        {children}
      </div>

      <FloatingDock modulo="habitos" itens={ITENS_HABITOS} acaoTexto="Novo Hábito" />
    </div>
  );
}