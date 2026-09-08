import { BarraNavegacaoFinancas, SubmenuFinancas } from "@/components/BarraNavegacaoFinancas";
import { MenuLateralDesktop } from "@/components/MenuLateralDesktop";

export default function FinancasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-24 lg:pb-0 lg:pl-64">
      <MenuLateralDesktop corAtiva="financa" submenu={<SubmenuFinancas />} />
      {children}
      <BarraNavegacaoFinancas />
    </div>
  );
}
