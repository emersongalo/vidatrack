import { BarraNavegacaoAgenda, SubmenuHabitos } from "@/components/BarraNavegacaoAgenda";
import { MenuLateralDesktop } from "@/components/MenuLateralDesktop";
import { LinkVoltar } from "@/components/LinkVoltar";

export default function HabitosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-16 lg:pb-0 lg:pl-64">
      <MenuLateralDesktop corAtiva="habito" submenu={<SubmenuHabitos />} />
      <div className="lg:hidden max-w-2xl mx-auto px-6 md:px-12 pt-4">
        <LinkVoltar href="/dashboard" texto="Painel" />
      </div>
      {children}
      <BarraNavegacaoAgenda />
    </div>
  );
}
