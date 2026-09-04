import Link from "next/link";
import { ValorMonetario } from "@/components/ValorMonetario";
import { BotaoOcultarValores } from "@/components/BotaoOcultarValores";
import { AvataresEmpilhados } from "@/components/AvataresEmpilhados";

export function HeroFinancas({
  saldo,
  receitas,
  despesas,
  nomeMes,
  pessoas,
}: {
  saldo: number;
  receitas: number;
  despesas: number;
  nomeMes: string;
  pessoas?: { nome: string; urlFoto: string | null }[];
}) {
  return (
    <div className="bg-base-800 border border-base-600 rounded-xl2 p-5 mb-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {pessoas && pessoas.length > 0 && <AvataresEmpilhados pessoas={pessoas} tamanho={24} />}
          <p className="text-sm text-ink-400 capitalize">{nomeMes}</p>
        </div>
        <BotaoOcultarValores />
      </div>

      <p className="text-xs text-ink-400 mb-1">Saldo até o fim do mês</p>
      <p className="text-3xl font-display font-semibold font-mono mb-5">
        <ValorMonetario valor={saldo} />
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/financas/extrato?tipo=receita&preset=este_mes"
          className="flex items-center gap-2.5 min-w-0"
        >
          <span className="w-9 h-9 rounded-full bg-habito/15 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="#7FB894" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-ink-400">Receitas</p>
            <p className="text-sm font-mono font-medium text-habito truncate">
              <ValorMonetario valor={receitas} />
            </p>
          </div>
        </Link>

        <Link
          href="/financas/extrato?tipo=despesa&preset=este_mes"
          className="flex items-center gap-2.5 min-w-0"
        >
          <span className="w-9 h-9 rounded-full bg-red-400/15 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="#F87171" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-ink-400">Despesas</p>
            <p className="text-sm font-mono font-medium text-red-400 truncate">
              <ValorMonetario valor={despesas} />
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
