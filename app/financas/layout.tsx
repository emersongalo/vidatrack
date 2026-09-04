import { BarraNavegacaoFinancas } from "@/components/BarraNavegacaoFinancas";

export default function FinancasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20">
      {children}
      <BarraNavegacaoFinancas />
    </div>
  );
}
