import Link from "next/link";
import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { ValorMonetario } from "@/components/ValorMonetario";
import { BotaoOcultarValores } from "@/components/BotaoOcultarValores";
import { AvataresEmpilhados } from "@/components/AvataresEmpilhados";

export function HeroFinancas({
  saldo,
  saldoPrevisto,
  receitas,
  despesas,
  totalInvestido,
  nomeMes,
  pessoas,
  hrefMesAnterior,
  hrefMesProximo,
  hrefHoje,
  ehMesAtual,
  aoMesAnterior,
  aoMesProximo,
  aoHoje,
}: {
  saldo: number;
  saldoPrevisto: number | null;
  receitas: number;
  despesas: number;
  totalInvestido?: number;
  nomeMes: string;
  pessoas?: { nome: string; urlFoto: string | null }[];
  hrefMesAnterior: string;
  hrefMesProximo: string;
  hrefHoje: string;
  ehMesAtual: boolean;
  /** Etapa 127: quando informados, a navegação de mês fica só no
   *  navegador (sem trocar de rota) — usado pela versão local-first
   *  de Finanças. Sem isso, continua indo pelos hrefs de sempre. */
  aoMesAnterior?: () => void;
  aoMesProximo?: () => void;
  aoHoje?: () => void;
}) {
  return (
    <div className="bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {pessoas && pessoas.length > 0 && <AvataresEmpilhados pessoas={pessoas} tamanho={24} />}
        </div>
        <BotaoOcultarValores />
      </div>

      {/* Navegação por mês */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {aoMesAnterior ? (
          <button
            onClick={aoMesAnterior}
            aria-label="Mês anterior"
            className="w-7 h-7 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-700 transition"
          >
            ‹
          </button>
        ) : (
          <Link
            href={hrefMesAnterior}
            aria-label="Mês anterior"
            className="w-7 h-7 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-700 transition"
          >
            ‹
          </Link>
        )}
        <div className="text-center">
          <p className="text-sm font-medium capitalize">{nomeMes}</p>
          {!ehMesAtual &&
            (aoHoje ? (
              <button onClick={aoHoje} className="text-[11px] text-financa hover:underline">
                Voltar pra hoje
              </button>
            ) : (
              <Link href={hrefHoje} className="text-[11px] text-financa hover:underline">
                Voltar pra hoje
              </Link>
            ))}
        </div>
        {aoMesProximo ? (
          <button
            onClick={aoMesProximo}
            aria-label="Próximo mês"
            className="w-7 h-7 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-700 transition"
          >
            ›
          </button>
        ) : (
          <Link
            href={hrefMesProximo}
            aria-label="Próximo mês"
            className="w-7 h-7 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-700 transition"
          >
            ›
          </Link>
        )}
      </div>

      {/* Saldo atual — sozinho, com espaço de sobra pro número */}
      <div className="mb-5">
        <p className="text-xs text-ink-400 mb-1">Saldo em contas</p>
        <p className="text-3xl font-display font-semibold font-mono">
          <ValorMonetario valor={saldo} />
        </p>
      </div>

      {/* Etapa 173 — cada estatística no seu próprio cartão (como no
         app do Despezzas), em vez de 3 colunas apertadas — isso
         cortava valores maiores tipo "R$ 5.000,00" mesmo já tentando
         só com fonte menor antes. Cada cartão cresce conforme
         precisa, sem cortar nada. */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Link
          href="/financas/extrato?preset=este_mes"
          className="bg-base-900/60 border border-base-600 rounded-lg px-2 py-2.5 flex flex-col items-center text-center gap-1 min-w-0"
        >
          <TrendingUp size={13} strokeWidth={2.5} className="text-habito shrink-0" />
          <p className="text-[10px] text-ink-400">Receitas</p>
          <p className="text-xs font-mono font-medium text-habito leading-tight break-words">
            <ValorMonetario valor={receitas} />
          </p>
        </Link>
        <Link
          href="/financas/extrato?preset=este_mes"
          className="bg-base-900/60 border border-base-600 rounded-lg px-2 py-2.5 flex flex-col items-center text-center gap-1 min-w-0"
        >
          <TrendingDown size={13} strokeWidth={2.5} className="text-red-400 shrink-0" />
          <p className="text-[10px] text-ink-400">Despesas</p>
          <p className="text-xs font-mono font-medium text-red-400 leading-tight break-words">
            <ValorMonetario valor={despesas} />
          </p>
        </Link>
        <Link
          href="/financas/investir"
          className="bg-base-900/60 border border-base-600 rounded-lg px-2 py-2.5 flex flex-col items-center text-center gap-1 min-w-0"
        >
          <PiggyBank size={13} strokeWidth={2.5} className="text-financa shrink-0" />
          <p className="text-[10px] text-ink-400">Investido</p>
          <p className="text-xs font-mono font-medium text-financa leading-tight break-words">
            <ValorMonetario valor={totalInvestido ?? 0} />
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
