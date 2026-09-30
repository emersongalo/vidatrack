"use client";

// Etapa 235 — os blocos novos do Início (hábitos e finanças).
import Link from "next/link";
import { useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { ValorMonetario } from "@/components/ValorMonetario";
import { IconeCategoria } from "@/components/IconeCategoria";
import { IconeHabito } from "@/components/IconeHabito";
import { hexDaCor, classeFundoSuave } from "@/lib/agenda/estilo";
import { categoriasDoMes, gastosDaSemana, maioresSequencias, resumoSaldo, semanaDosHabitos } from "@/lib/painel/widgets";
import { gastoDoMes, situacaoTeto } from "@/lib/financas/teto";

const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];
const letraDoDia = (iso: string) => DIAS[new Date(iso + "T12:00:00").getDay()];

export function CartaoInicio({ titulo, link, children }: { titulo: string; link?: { href: string; rotulo: string }; children: React.ReactNode }) {
  return (
    <section className="bg-base-800 border border-base-600 rounded-3xl p-5">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="text-xl font-semibold truncate">{titulo}</h2>
        {link && (
          <Link href={link.href} className="text-base text-ink-400 hover:text-ink-100 transition shrink-0">
            {link.rotulo} ›
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

// ---------- Finanças ----------

export function SaldoInicio({ s, hoje }: { s: any; hoje: string }) {
  const r = useMemo(() => resumoSaldo(s.financas.contas, s.financas.transacoes, hoje), [s, hoje]);
  const total = r.receitas + r.despesas;
  const nomeMes = new Date(hoje + "T12:00:00").toLocaleDateString("pt-BR", { month: "long" });
  return (
    <CartaoInicio titulo="Saldo" link={{ href: "/financas", rotulo: "Finanças" }}>
      <p className={`text-4xl font-display font-bold font-mono tracking-tight break-words ${r.saldo < 0 ? "text-red-400" : ""}`}>
        <ValorMonetario valor={r.saldo} animado />
      </p>
      {total > 0 && (
        <div className="flex h-2 overflow-hidden rounded-full bg-base-700 mt-4" aria-hidden>
          <div className="bg-habito" style={{ width: `${(r.receitas / total) * 100}%` }} />
          <div className="bg-red-400" style={{ width: `${(r.despesas / total) * 100}%` }} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div>
          <p className="text-sm text-ink-400 flex items-center gap-1 capitalize">
            <TrendingUp size={15} className="text-habito" /> Entrou em {nomeMes}
          </p>
          <p className="text-lg font-mono font-semibold text-habito">
            <ValorMonetario valor={r.receitas} animado />
          </p>
        </div>
        <div>
          <p className="text-sm text-ink-400 flex items-center gap-1">
            <TrendingDown size={15} className="text-red-400" /> Saiu
          </p>
          <p className="text-lg font-mono font-semibold text-red-400">
            <ValorMonetario valor={r.despesas} animado />
          </p>
        </div>
      </div>
    </CartaoInicio>
  );
}

export function GastosSemanaInicio({ s, hoje }: { s: any; hoje: string }) {
  const g = useMemo(() => gastosDaSemana(s.financas.contas, s.financas.transacoes, hoje), [s, hoje]);
  const maior = Math.max(1, ...g.dias.map((d) => d.total));
  return (
    <CartaoInicio titulo="Gastos da semana" link={{ href: "/financas/extrato?preset=ultimos_30", rotulo: "Extrato" }}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-3xl font-mono font-bold">
          <ValorMonetario valor={g.total} animado />
        </p>
        {g.variacaoPct !== null && (
          <span className={`text-sm font-medium rounded-full px-2 py-0.5 ${g.variacaoPct > 0 ? "bg-red-400/15 text-red-400" : "bg-habito/15 text-habito"}`}>
            {g.variacaoPct > 0 ? "▲" : "▼"} {Math.abs(g.variacaoPct)}% vs semana passada
          </span>
        )}
      </div>
      <div className="flex items-end gap-2 h-28 mt-4">
        {g.dias.map((d, i) => (
          <div key={d.dia} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div
              className={`w-full rounded-lg transition-all duration-700 ${i === 6 ? "bg-financa" : "bg-financa/40"}`}
              style={{ height: `${Math.max(4, (d.total / maior) * 100)}%` }}
              title={`${d.dia.split("-").reverse().slice(0, 2).join("/")}: R$ ${d.total.toFixed(2)}`}
            />
            <span className={`text-xs ${i === 6 ? "text-ink-100 font-semibold" : "text-ink-400"}`}>{letraDoDia(d.dia)}</span>
          </div>
        ))}
      </div>
    </CartaoInicio>
  );
}

export function TetoInicio({ s, hoje }: { s: any; hoje: string }) {
  const teto = Number(s?.perfil?.teto_mensal) || 0;
  if (!teto) {
    return (
      <CartaoInicio titulo="Teto do mês">
        <p className="text-base text-ink-400">Defina quanto quer gastar no mês e acompanhe aqui num medidor.</p>
        <Link href="/financas" className="inline-block mt-3 bg-financa text-base-900 rounded-xl px-4 py-2.5 text-base font-semibold">
          Definir teto
        </Link>
      </CartaoInicio>
    );
  }
  const gasto = gastoDoMes(s.financas.contas, s.financas.transacoes, hoje);
  const st = situacaoTeto(gasto, teto, hoje);
  const pct = Math.min(100, st.pct);
  // meia-lua: 0% à esquerda, 100% à direita
  const r = 70;
  const comprimento = Math.PI * r;
  const cor = st.estourou ? "#F87171" : st.acimaDoRitmo ? "#F59E0B" : "#34D399";
  return (
    <CartaoInicio titulo="Teto do mês" link={{ href: "/financas", rotulo: "Ver" }}>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 180 100" className="w-full max-w-[16rem]">
          <path d="M20 90 A70 70 0 0 1 160 90" fill="none" strokeWidth="16" strokeLinecap="round" className="stroke-base-700" />
          <path
            d="M20 90 A70 70 0 0 1 160 90"
            fill="none"
            stroke={cor}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={comprimento}
            strokeDashoffset={comprimento * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset 900ms ease-out" }}
          />
          <text x="90" y="78" textAnchor="middle" className="fill-current text-ink-100" fontSize="26" fontWeight="700">
            {st.pct}%
          </text>
        </svg>
        <p className="text-base mt-1">
          <span className="font-mono font-semibold">
            <ValorMonetario valor={gasto} />
          </span>{" "}
          <span className="text-ink-400">
            de <ValorMonetario valor={teto} />
          </span>
        </p>
        <p className={`text-sm mt-0.5 ${st.estourou ? "text-red-400" : "text-ink-400"}`}>
          {st.estourou ? (
            <>
              Passou <ValorMonetario valor={-st.restante} />
            </>
          ) : (
            <>
              Dá pra gastar <ValorMonetario valor={st.porDia} />/dia até o fim do mês
            </>
          )}
        </p>
      </div>
    </CartaoInicio>
  );
}

export function CategoriasInicio({ s, hoje }: { s: any; hoje: string }) {
  const c = useMemo(() => categoriasDoMes(s.financas.contas, s.financas.transacoes, s.financas.categorias, hoje), [s, hoje]);
  return (
    <CartaoInicio titulo="Onde foi o dinheiro" link={{ href: "/financas/analise", rotulo: "Análise" }}>
      {c.itens.length === 0 ? (
        <p className="text-base text-ink-400">Nenhum gasto neste mês ainda.</p>
      ) : (
        <ul className="space-y-3">
          {c.itens.map((i) => (
            <li key={i.id}>
              <Link href={`/financas/extrato?categoria=${i.id}`} className="block">
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${classeFundoSuave(i.cor ?? "neutro")}`}>
                    <IconeCategoria icone={i.icone} tamanho={18} />
                  </span>
                  <span className="flex-1 min-w-0 text-base font-medium truncate">{i.nome}</span>
                  <span className="text-sm text-ink-400 shrink-0">{i.pct}%</span>
                  <span className="font-mono text-base font-semibold shrink-0">
                    <ValorMonetario valor={i.valor} />
                  </span>
                </div>
                <div className="h-1.5 bg-base-700 rounded-full overflow-hidden mt-2 ml-[3.25rem]">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${i.pct}%`, background: hexDaCor(i.cor ?? "neutro") }} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CartaoInicio>
  );
}

// ---------- Hábitos ----------

export function SequenciasInicio({ s, hoje }: { s: any; hoje: string }) {
  const lista = useMemo(() => maioresSequencias(s.habitos, s.habitoCheckins, hoje), [s, hoje]);
  const maior = Math.max(1, ...lista.map((h) => h.sequencia));
  return (
    <CartaoInicio titulo="Sequências 🔥" link={{ href: "/habitos/estatisticas", rotulo: "Estatísticas" }}>
      {lista.length === 0 ? (
        <p className="text-base text-ink-400">Marque um hábito hoje pra começar uma sequência.</p>
      ) : (
        <ul className="space-y-3">
          {lista.map((h, i) => (
            <li key={h.id} className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${classeFundoSuave(h.cor)}`}>
                <IconeHabito icone={h.icone} tamanho={18} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-medium truncate">{h.nome}</span>
                  <span className="text-base font-semibold shrink-0">
                    {i === 0 ? "🔥" : ""} {h.sequencia} {h.sequencia === 1 ? "dia" : "dias"}
                  </span>
                </div>
                <div className="h-1.5 bg-base-700 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-400 transition-all duration-700"
                    style={{ width: `${(h.sequencia / maior) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CartaoInicio>
  );
}

export function SemanaHabitosInicio({ s, hoje }: { s: any; hoje: string }) {
  const dias = useMemo(() => semanaDosHabitos(s.habitos, s.habitoCheckins, hoje), [s, hoje]);
  const validos = dias.filter((d) => d.pct !== null);
  const media = validos.length ? Math.round(validos.reduce((t, d) => t + (d.pct ?? 0), 0) / validos.length) : null;
  return (
    <CartaoInicio titulo="Semana dos hábitos" link={{ href: "/habitos/estatisticas", rotulo: "Ver" }}>
      {media !== null && (
        <p className="text-base text-ink-400 mb-3">
          Média de <span className="text-ink-100 font-semibold">{media}%</span> nos últimos 7 dias
        </p>
      )}
      <div className="flex items-end gap-2 h-28">
        {dias.map((d, i) => (
          <div key={d.dia} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <span className="text-[0.7rem] text-ink-400">{d.pct === null ? "" : `${d.pct}%`}</span>
            <div
              className={`w-full rounded-lg transition-all duration-700 ${d.pct === 100 ? "bg-habito" : i === 6 ? "bg-habito/70" : "bg-habito/40"}`}
              style={{ height: `${d.pct === null ? 4 : Math.max(4, d.pct * 0.8)}%` }}
            />
            <span className={`text-xs ${i === 6 ? "text-ink-100 font-semibold" : "text-ink-400"}`}>{letraDoDia(d.dia)}</span>
          </div>
        ))}
      </div>
    </CartaoInicio>
  );
}
