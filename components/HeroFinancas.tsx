import Link from "next/link";
import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { ValorMonetario } from "@/components/ValorMonetario";
import { BotaoOcultarValores } from "@/components/BotaoOcultarValores";
import { AvataresEmpilhados } from "@/components/AvataresEmpilhados";
import { AnelProgresso } from "@/components/AnelProgresso";

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
  // Etapa 286 — um cartão só (saldo, anel do mês, entrou/saiu/sobra) com
  // brilho dourado; o saldo conta até o valor e a cor diz como vai o mês.
  const botaoMes =
    "w-10 h-10 rounded-full bg-base-800 border border-base-600 flex items-center justify-center text-xl text-ink-100 hover:bg-base-700 transition shrink-0";
  const sobra = receitas - despesas;
  const pct = receitas > 0 ? Math.round((despesas / receitas) * 100) : null;
  const corAnel = pct === null ? "stroke-financa" : pct >= 100 ? "stroke-red-400" : pct >= 80 ? "stroke-amber-400" : "stroke-habito";
  const mesPositivo = receitas > 0 || despesas > 0 ? sobra >= 0 : null;
  const linha = "flex items-center justify-between gap-2 rounded-xl px-2 py-1 -mx-2 hover:bg-base-900/30 transition min-w-0";

  return (
    <div className="mb-6">
      <div
        className="brilho-ouro overflow-hidden rounded-3xl border border-financa/30 p-5 mb-3"
        style={{ background: "linear-gradient(140deg, rgb(var(--c-financa) / 0.20), rgb(var(--c-financa) / 0.04) 60%, rgb(var(--c-base-800) / 0.6))" }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <p className="text-sm text-ink-400">Saldo atual</p>
            {pessoas && pessoas.length > 0 && <AvataresEmpilhados pessoas={pessoas} tamanho={22} />}
          </div>
          <BotaoOcultarValores />
        </div>
        <p
          className={`text-[2.5rem] leading-tight font-display font-bold font-mono tracking-tight break-words transition-colors duration-700 ${
            saldo < 0 ? "text-red-400" : ""
          }`}
        >
          <ValorMonetario valor={saldo} animado />
        </p>
        {mesPositivo !== null && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full mt-1 animate-surgir ${
              mesPositivo ? "bg-habito/15 text-habito" : "bg-red-400/15 text-red-400"
            }`}
          >
            {mesPositivo ? "▲ mês no azul" : "▼ mês no vermelho"}
          </span>
        )}

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-base-600/60">
          {pct !== null ? (
            <AnelProgresso valor={Math.min(pct, 100)} total={100} tamanho={76} texto={`${pct}%`} classeCor={corAnel} />
          ) : (
            <span className="w-[76px] h-[76px] rounded-full border-[9px] border-base-700 flex items-center justify-center text-xs text-ink-400 shrink-0">
              —
            </span>
          )}
          <div className="flex-1 min-w-0 space-y-0.5">
            <Link href="/financas/extrato?preset=este_mes&tipo=receita" className={linha}>
              <span className="flex items-center gap-1.5 text-sm text-ink-400 shrink-0">
                <TrendingUp size={15} strokeWidth={2.5} className="text-habito" /> Entrou
              </span>
              <span className="font-mono font-semibold text-habito truncate">
                <ValorMonetario valor={receitas} animado />
              </span>
            </Link>
            <Link href="/financas/extrato?preset=este_mes&tipo=despesa" className={linha}>
              <span className="flex items-center gap-1.5 text-sm text-ink-400 shrink-0">
                <TrendingDown size={15} strokeWidth={2.5} className="text-red-400" /> Saiu
              </span>
              <span className="font-mono font-semibold text-red-400 truncate">
                <ValorMonetario valor={despesas} animado />
              </span>
            </Link>
            <div className={`${linha} hover:bg-transparent`}>
              <span className="text-sm text-ink-400 shrink-0">= Sobra</span>
              <span className={`font-mono font-semibold truncate ${sobra < 0 ? "text-red-400" : "text-ink-100"}`}>
                <ValorMonetario valor={sobra} animado />
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-ink-400 mt-2">
          {pct === null
            ? `Nenhuma receita lançada em ${nomeMes.toLowerCase()} ainda.`
            : pct >= 100
              ? `Saiu mais do que entrou em ${nomeMes.toLowerCase()}.`
              : `Já saiu ${pct}% do que entrou em ${nomeMes.toLowerCase()}.`}
        </p>

        <div className="flex flex-wrap gap-2 mt-3">
          <Link href="/financas/investir" className="flex items-center gap-1.5 rounded-full bg-base-900/40 px-3 py-1.5 text-xs">
            <PiggyBank size={14} className="text-financa" /> Investido{" "}
            <span className="font-mono font-semibold text-financa">
              <ValorMonetario valor={totalInvestido ?? 0} />
            </span>
          </Link>
          {saldoPrevisto !== null && (
            <span className="flex items-center gap-1.5 rounded-full bg-base-900/40 px-3 py-1.5 text-xs">
              📅 Fim do mês{" "}
              <span className={`font-mono font-semibold ${saldoPrevisto < 0 ? "text-red-400" : "text-ink-100"}`}>
                <ValorMonetario valor={saldoPrevisto} />
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Navegação por mês */}
      <div className="flex items-center justify-between gap-2">
        {aoMesAnterior ? (
          <button onClick={aoMesAnterior} aria-label="Mês anterior" className={botaoMes}>‹</button>
        ) : (
          <Link href={hrefMesAnterior} aria-label="Mês anterior" className={botaoMes}>‹</Link>
        )}
        {nomeMesAnterior && <span className="hidden min-[380px]:block text-sm text-ink-400 capitalize truncate">{nomeMesAnterior}</span>}
        <div className="text-center min-w-0 flex-1">
          <p key={nomeMes} className="text-lg font-semibold capitalize truncate animate-surgir">{nomeMes}</p>
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
    </div>
  );
}
