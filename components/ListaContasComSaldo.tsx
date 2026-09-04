import Link from "next/link";
import { ValorMonetario } from "@/components/ValorMonetario";
import { SeloBanco } from "@/components/SeloBanco";
import type { ContaComSaldo } from "@/lib/financas/consulta";

const RÓTULOS_TIPO: Record<string, string> = {
  carteira: "Carteira",
  banco: "Banco",
  cartao: "Cartão",
};

export function ListaContasComSaldo({ contas }: { contas: ContaComSaldo[] }) {
  if (contas.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-ink-400">Contas</p>
        <Link href="/financas/contas" className="text-xs text-ink-400 hover:text-ink-100 transition">
          Gerenciar →
        </Link>
      </div>
      <ul className="space-y-2">
        {contas.map((conta) => (
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
  );
}
