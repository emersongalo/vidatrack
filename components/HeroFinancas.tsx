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
  nomeMesAnterior,
  nomeMesProximo,
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
  /** Etapa 223 — nomes dos meses vizinhos na barra de meses */
  nomeMesAnterior?: string;
  nomeMesProximo?: string;
}) {
  // Etapa 223 — letras maiores e mais espaço (no estilo dos apps de banco)
  const botaoMes =
    "w-11 h-11 rounded-full border border-base-600 flex items-center justify-center text-xl text-ink-100 hover:bg-base-700 transition shrink-0";
  const total = receitas + despesas;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <p className="text-base text-ink-400">Saldo atual</p>
          {pessoas && pessoas.length > 0 && <AvataresEmpilhados pessoas={pessoas} tamanho={24} />}
        </div>
        <BotaoOcultarValores />
      </div>
      <p className="text-[2.6rem] leading-tight font-display font-bold font-mono tracking-tight mb-4 break-words">
        <ValorMonetario valor={saldo} animado />
      </p>

      {/* Etapa 243 — a barra NÃO é o saldo: mostra quanto do que ENTROU no mês
         já SAIU. Antes era só "verde x vermelho" e, num mês sem receita
         lançada ainda, ficava toda vermelha mesmo com saldo positivo. */}
      {total > 0 &&
        (receitas > 0 ? (
          (() => {
            const pct = Math.round((despesas / receitas) * 100);
            const cor = pct >= 100 ? "bg-red-400" : pct >= 80 ? "bg-amber-400" : "bg-habito";
            const corTexto = pct >= 100 ? "text-red-400" : pct >= 80 ? "text-amber-400" : "text-habito";
            return (
              <div className="mb-4">
                <div className="h-2 overflow-hidden rounded-full bg-base-700" aria-hidden>
                  <div className={`h-full rounded-full transition-all duration-700 ${cor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <p className="text-sm text-ink-400 mt-1.5">
                  {pct >= 100 ? (
                    <>
                      Saiu <span className={`font-semibold ${corTexto}`}>mais do que entrou</span> em {nomeMes.toLowerCase()} ({pct}%)
                    </>
                  ) : (
                    <>
                      Já saiu <span className={`font-semibold ${corTexto}`}>{pct}%</span> do que entrou em {nomeMes.toLowerCase()}
                    </>
                  )}
                </p>
              </div>
            );
          })()
        ) : (
          <p className="text-sm text-ink-400 mb-4">Nenhuma receita lançada em {nomeMes.toLowerCase()} ainda — por isso não dá pra comparar.</p>
        ))}

      {/* Etapa 244 — Receitas e Despesas lado a lado (2 colunas) e Investido
         numa linha inteira embaixo: dá espaço pra letra grande sem quebrar
         o número (em 3 colunas não cabia "R$ 150.000,00"). */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <Link href="/financas/extrato?preset=este_mes&tipo=receita" className="bg-base-800 border border-base-600 rounded-2xl px-4 py-3 min-w-0">
          <p className="flex items-center gap-1.5 text-sm text-ink-400">
            <TrendingUp size={16} strokeWidth={2.5} className="text-habito shrink-0" /> Receitas
          </p>
          <p className="text-xl font-mono font-semibold text-habito mt-1 whitespace-nowrap leading-tight tracking-tight truncate">
            <ValorMonetario valor={receitas} animado />
          </p>
        </Link>
        <Link href="/financas/extrato?preset=este_mes&tipo=despesa" className="bg-base-800 border border-base-600 rounded-2xl px-4 py-3 min-w-0">
          <p className="flex items-center gap-1.5 text-sm text-ink-400">
            <TrendingDown size={16} strokeWidth={2.5} className="text-red-400 shrink-0" /> Despesas
          </p>
          <p className="text-xl font-mono font-semibold text-red-400 mt-1 whitespace-nowrap leading-tight tracking-tight truncate">
            <ValorMonetario valor={despesas} animado />
          </p>
        </Link>
        <Link
          href="/financas/investir"
          className="col-span-2 flex items-center justify-between gap-3 bg-base-800 border border-base-600 rounded-2xl px-4 py-3 min-w-0"
        >
          <p className="flex items-center gap-1.5 text-sm text-ink-400 shrink-0">
            <PiggyBank size={16} strokeWidth={2.5} className="text-financa shrink-0" /> Investido
          </p>
          <p className="text-xl font-mono font-semibold text-financa whitespace-nowrap leading-tight tracking-tight truncate">
            <ValorMonetario valor={totalInvestido ?? 0} />
          </p>
        </Link>
      </div>

      {/* Navegação por mês */}
      <div className="flex items-center justify-between gap-2 bg-base-800 border border-base-600 rounded-full px-2 py-2">
        {aoMesAnterior ? (
          <button onClick={aoMesAnterior} aria-label="Mês anterior" className={botaoMes}>‹</button>
        ) : (
          <Link href={hrefMesAnterior} aria-label="Mês anterior" className={botaoMes}>‹</Link>
        )}
        {nomeMesAnterior && <span className="hidden min-[380px]:block text-sm text-ink-400 capitalize truncate">{nomeMesAnterior}</span>}
        <div className="text-center min-w-0">
          <p className="text-lg font-semibold capitalize truncate">{nomeMes}</p>
          {!ehMesAtual &&
            (aoHoje ? (
              <button onClick={aoHoje} className="text-xs text-financa hover:underline">
                Voltar pra hoje
              </button>
            ) : (
              <Link href={hrefHoje} className="text-xs text-financa hover:underline">
                Voltar pra hoje
              </Link>
            ))}
        </div>
        {nomeMesProximo && <span className="hidden min-[380px]:block text-sm text-ink-400 capitalize truncate">{nomeMesProximo}</span>}
        {aoMesProximo ? (
          <button onClick={aoMesProximo} aria-label="Próximo mês" className={botaoMes}>›</button>
        ) : (
          <Link href={hrefMesProximo} aria-label="Próximo mês" className={botaoMes}>›</Link>
        )}
      </div>

      {saldoPrevisto !== null && (
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-sm text-ink-400">Previsto p/ fim do mês</p>
          <p className="text-base font-mono font-semibold text-ink-100">
            <ValorMonetario valor={saldoPrevisto} />
          </p>
        </div>
      )}
    </div>
  );
}
