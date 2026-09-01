import Link from "next/link";
import { BarraNavegacaoAgenda } from "@/components/BarraNavegacaoAgenda";

export default function HabitosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-16">
      <div className="max-w-2xl mx-auto px-6 md:px-12 pt-4">
        <Link href="/dashboard" className="text-ink-400 text-sm hover:text-ink-100 transition">
          ← Painel
        </Link>
      </div>
      {children}
      <BarraNavegacaoAgenda />
    </div>
  );
}
