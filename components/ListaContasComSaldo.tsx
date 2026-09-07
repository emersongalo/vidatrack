import Link from "next/link";
import { PiggyBank } from "lucide-react";
import { ValorMonetario } from "@/components/ValorMonetario";
import { SeloBanco } from "@/components/SeloBanco";
import type { ContaComSaldo } from "@/lib/financas/consulta";

const RÓTULOS_TIPO: Record<string, string> = {
  carteira: "Carteira",
  banco: "Banco",
  cartao: "Cartão",
  investimento: "Investimento",
};

export function ListaContasComSaldo({ contas }: { contas: ContaComSaldo[] }) {
  if (contas.length === 0) return null;

  const contasNormais = contas.filter((c) => c.tipo !== "investimento");
  const contasInvestimento = contas.filter((c) => c.tipo === "investimento");
  const totalInvestido = contasInvestimento.reduce((soma, c) => soma + c.saldo, 0);

  return (
    <>
      {contasNormais.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-ink-400">Contas</p>
            <Link href="/financas/contas" className="text-xs text-ink-400 hover:text-ink-100 transition">
              Gerenciar →
            </Link>
          </div>
          <ul className="space-y-2">
            {contasNormais.map((conta) => (
              <li key={conta.id}>
                <Link
                  href="/financas/contas"
                  className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg p-3 hover:border-financa transition"
                >
                  <SeloBanco bancoId={conta.banco} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conta.nome}</p>
                    <p className="text-xs text-ink-400">{RÓTULOS_TIPO[conta.tipo] ?? conta.tipo}</p>
                  </div>
                  <span
                    className={`font-mono text-sm shrink-0 ${conta.saldo < 0 ? "text-red-400" : "text-ink-100"}`}
                  >
                    <ValorMonetario valor={conta.saldo} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {contasInvestimento.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-ink-400 flex items-center gap-1.5">
              <PiggyBank size={15} strokeWidth={2} /> Investido
            </p>
            <Link href="/financas/contas" className="text-xs text-ink-400 hover:text-ink-100 transition">
              Gerenciar →
            </Link>
          </div>
          {/* Fica visualmente separado do resto de propósito — é
              dinheiro que já foi guardado, não conta como "disponível". */}
          <div className="bg-base-800 border border-financa/30 rounded-xl2 p-4 mb-2">
            <p className="text-xs text-ink-400 mb-1">Total guardado</p>
            <p className="text-xl font-mono font-semibold text-financa">
              <ValorMonetario valor={totalInvestido} />
            </p>
          </div>
          <ul className="space-y-2">
            {contasInvestimento.map((conta) => (
              <li key={conta.id}>
                <Link
                  href="/financas/contas"
                  className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg p-3 hover:border-financa transition"
                >
                  <SeloBanco bancoId={conta.banco} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conta.nome}</p>
                    <p className="text-xs text-ink-400">Investimento</p>
                  </div>
                  <span className="font-mono text-sm shrink-0 text-ink-100">
                    <ValorMonetario valor={conta.saldo} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

