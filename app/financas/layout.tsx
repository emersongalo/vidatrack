import { BarraNavegacaoFinancas } from "@/components/BarraNavegacaoFinancas";

export default function FinancasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-24">
      {children}
      <BarraNavegacaoFinancas />
    </div>
  );
}
