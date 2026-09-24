import { BarraNavegacaoFinancas, SubmenuFinancas } from "@/components/BarraNavegacaoFinancas";
import { MenuLateralDesktop } from "@/components/MenuLateralDesktop";
import { DeslizarEntreAbas } from "@/components/DeslizarEntreAbas";
import { TransicaoPagina } from "@/components/TransicaoPagina";

const ABAS_FINANCAS = [
  { href: "/financas" },
  { href: "/financas/contas" },
  { href: "/financas/extrato" },
  { href: "/financas/mais" },
];

export default function FinancasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-24 lg:pb-0 lg:pl-64">
      <MenuLateralDesktop corAtiva="financa" submenu={<SubmenuFinancas />} />
      <DeslizarEntreAbas abas={ABAS_FINANCAS}>
        <TransicaoPagina>{children}</TransicaoPagina>
      </DeslizarEntreAbas>
      <BarraNavegacaoFinancas />
    </div>
  );
}
