import Link from "next/link";
import { ValorMonetario } from "@/components/ValorMonetario";
import { BotaoOcultarValores } from "@/components/BotaoOcultarValores";
import { AvataresEmpilhados } from "@/components/AvataresEmpilhados";

export function HeroFinancas({
  saldo,
  saldoPrevisto,
  receitas,
  despesas,
  nomeMes,
  pessoas,
  hrefMesAnterior,
  hrefMesProximo,
  hrefHoje,
  ehMesAtual,
}: {
  saldo: number;
  saldoPrevisto: number | null;
  receitas: number;
  despesas: number;
  nomeMes: string;
  pessoas?: { nome: string; urlFoto: string | null }[];
  hrefMesAnterior: string;
  hrefMesProximo: string;
  hrefHoje: string;
  ehMesAtual: boolean;
}) {
  return (
    <div className="bg-base-800 border border-base-600 rounded-xl2 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {pessoas && pessoas.length > 0 && <AvataresEmpilhados pessoas={pessoas} tamanho={24} />}
        </div>
        <BotaoOcultarValores />
      </div>

      {/* Navegação por mês */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <Link
          href={hrefMesAnterior}
          aria-label="Mês anterior"
          className="w-7 h-7 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-700 transition"
        >
          ‹
        </Link>
        <div className="text-center">
          <p className="text-sm font-medium capitalize">{nomeMes}</p>
          {!ehMesAtual && (
            <Link href={hrefHoje} className="text-[11px] text-financa hover:underline">
              Voltar pra hoje
            </Link>
          )}
        </div>
        <Link
          href={hrefMesProximo}
          aria-label="Próximo mês"
          className="w-7 h-7 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-700 transition"
        >
          ›
        </Link>
      </div>

      {/* Saldo atual — sozinho, com espaço de sobra pro número */}
      <div className="mb-5">
        <p className="text-xs text-ink-400 mb-1">Saldo em contas</p>
        <p className="text-3xl font-display font-semibold font-mono">
          <ValorMonetario valor={saldo} />
        </p>
      </div>

      <div className="space-y-2.5 mb-4">
        <Link
          href="/financas/extrato?preset=este_mes"
          className="flex items-center gap-2.5"
        >
          <span className="w-9 h-9 rounded-full bg-habito/15 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="#7FB894" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="text-[11px] text-ink-400 flex-1">Receitas do mês</p>
          <p className="text-sm font-mono font-medium text-habito shrink-0">
            <ValorMonetario valor={receitas} />
          </p>
        </Link>

        <Link
          href="/financas/extrato?preset=este_mes"
          className="flex items-center gap-2.5"
        >
          <span className="w-9 h-9 rounded-full bg-red-400/15 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="#F87171" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="text-[11px] text-ink-400 flex-1">Despesas do mês</p>
          <p className="text-sm font-mono font-medium text-red-400 shrink-0">
            <ValorMonetario valor={despesas} />
          </p>
        </Link>
      </div>

      {saldoPrevisto !== null && (
        <div className="flex items-center justify-between pt-3 border-t border-base-600">
          <p className="text-xs text-ink-400">Previsto p/ fim do mês</p>
          <p className="text-sm font-mono font-medium text-ink-100">
            <ValorMonetario valor={saldoPrevisto} />
          </p>
        </div>
      )}
    </div>
  );
}
