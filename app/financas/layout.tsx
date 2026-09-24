import { ReactNode } from "react";
import { FloatingDock } from "@/components/FloatingDock";

const ITENS_FINANCAS = [
  { href: "/financas", rotulo: "Início", icone: "🏠" },
  { href: "/financas/contas", rotulo: "Contas", icone: "🏦" },
  { href: "/financas/extrato", rotulo: "Extrato", icone: "🧾" },
  { href: "/financas/analise", rotulo: "Análise", icone: "📈" },
];

export default function FinancasLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07080c] text-neutral-100 relative pb-32">
      {/* Luz ambiental âmbar */}
      <div className="pointer-events-none fixed -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full z-0" />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6">
        {children}
      </div>

      <FloatingDock modulo="financas" itens={ITENS_FINANCAS} acaoTexto="Novo Lançamento" />
    </div>
  );
}