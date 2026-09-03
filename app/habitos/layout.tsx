import { BarraNavegacaoAgenda } from "@/components/BarraNavegacaoAgenda";
import { LinkVoltar } from "@/components/LinkVoltar";

export default function HabitosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-16">
      <div className="max-w-2xl mx-auto px-6 md:px-12 pt-4">
        <LinkVoltar href="/dashboard" texto="Painel" />
      </div>
      {children}
      <BarraNavegacaoAgenda />
    </div>
  );
}
