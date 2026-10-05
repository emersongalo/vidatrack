import { MenuLateralDesktop } from "@/components/MenuLateralDesktop";
import { SubmenuTarefas } from "@/components/SubmenuTarefas";
import { BarraInferiorApp } from "@/components/BarraInferiorApp";
import { TransicaoPagina } from "@/components/TransicaoPagina";
import { LinkVoltar } from "@/components/LinkVoltar";

// Etapa 264 — Tarefas virou uma área própria (antes ficava dentro de Hábitos).
// As telas continuam as mesmas (moram em app/habitos/tarefas e são reaproveitadas aqui).
export default function TarefasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-24 lg:pb-0 lg:pl-64">
      <MenuLateralDesktop corAtiva="tarefa" submenu={<SubmenuTarefas />} />
      <div className="lg:hidden max-w-2xl mx-auto px-6 md:px-12 pt-4">
        <LinkVoltar href="/dashboard" texto="Painel" />
      </div>
      <TransicaoPagina>{children}</TransicaoPagina>
      <BarraInferiorApp />
    </div>
  );
}
