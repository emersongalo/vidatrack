import { AuroraArea } from "@/components/AuroraArea";
import { BarraNavegacaoAgenda, SubmenuHabitos } from "@/components/BarraNavegacaoAgenda";
import { MenuLateralDesktop } from "@/components/MenuLateralDesktop";
import { AbasArea } from "@/components/AbasArea";
import { DeslizarEntreAbas } from "@/components/DeslizarEntreAbas";
import { TransicaoPagina } from "@/components/TransicaoPagina";

const ABAS_HABITOS = [
  { href: "/habitos" },
  { href: "/habitos/lista" },
  { href: "/habitos/categorias" },
  { href: "/habitos/timer" },
];

export default function HabitosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate pb-24 lg:pb-0 lg:pl-64">
      {/* Etapa 279 — brilho da cor da área no topo */}
      <AuroraArea area="habito" />
      <MenuLateralDesktop corAtiva="habito" submenu={<SubmenuHabitos />} />
      {/* Etapa 230 — voltar + abas de Hábitos no topo (a barra de baixo é a do app) */}
      <AbasArea area="habitos" />
      <DeslizarEntreAbas abas={ABAS_HABITOS}>
        <TransicaoPagina>{children}</TransicaoPagina>
      </DeslizarEntreAbas>
      <BarraNavegacaoAgenda />
    </div>
  );
}
