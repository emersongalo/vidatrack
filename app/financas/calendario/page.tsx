"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { eventosFinanceiros, saldoPrevistoPorDia, type EventoFinanceiro } from "@/lib/financas/calendario";
import { ehContaComum } from "@/lib/financas/previsao";
import { ValorMonetario } from "@/components/ValorMonetario";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";

// Etapa 220 — calendário financeiro: o mês em grade com o que vence/entra
// em cada dia e o saldo previsto
const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];
const ROTULO_ORIGEM: Record<EventoFinanceiro["origem"], string> = {
  lancado: "",
  agendado: "agendado",
  recorrente: "↻ todo mês",
  fatura: "fatura",
  cartao: "no cartão",
};

function compacto(v: number) {
  const a = Math.abs(v);
  if (a >= 1000) return `${(a / 1000).toFixed(a >= 10000 ? 0 : 1).replace(".", ",")}k`;
  return String(Math.round(a));
}

export default function CalendarioFinanceiroPage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const ocultos = useValoresOcultos();
  const [mes, setMes] = useState(hoje.slice(0, 7));
  const [diaSel, setDiaSel] = useState(hoje);

  const [ano, m] = mes.split("-").map(Number);
  const totalDias = new Date(ano, m, 0).getDate();
  const inicio = `${mes}-01`;
  const fim = `${mes}-${String(totalDias).padStart(2, "0")}`;

  const { eventos, saldos } = useMemo(() => {
    if (!snapshot) return { eventos: [] as EventoFinanceiro[], saldos: new Map<string, number>() };
    const ctx = {
      contas: snapshot.financas.contas as any[],
      transacoes: snapshot.financas.transacoes as any[],
      recorrencias: snapshot.financas.recorrencias as any[],
      hojeISO: hoje,
    };
    const evs = eventosFinanceiros(ctx, inicio, fim);
    // pro saldo de um mês futuro, precisa somar tudo que vem antes dele
    const saldoHoje = (snapshot.financas.contas as any[]).filter(ehContaComum).reduce((s, c) => s + Number(c.saldo), 0);
    const ateFim = fim > hoje ? eventosFinanceiros(ctx, hoje, fim) : [];
    return { eventos: evs, saldos: saldoPrevistoPorDia(saldoHoje, ateFim, hoje, fim) };
  }, [snapshot, inicio, fim, hoje]);

  const porDia = new Map<string, EventoFinanceiro[]>();
  for (const e of eventos) {
    if (!porDia.has(e.data)) porDia.set(e.data, []);
    porDia.get(e.data)!.push(e);
  }

  const primeiroDiaSemana = new Date(ano, m - 1, 1).getDay();
  const celulas: (string | null)[] = [
    ...Array.from({ length: primeiroDiaSemana }, () => null),
    ...Array.from({ length: totalDias }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`),
  ];

  function mudarMes(delta: number) {
    const d = new Date(ano, m - 1 + delta, 1);
    const novo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    setMes(novo);
    setDiaSel(novo === hoje.slice(0, 7) ? hoje : `${novo}-01`);
  }

  const doDia = porDia.get(diaSel) ?? [];
  const saldoDia = saldos.get(diaSel);
  const nomeMes = new Date(ano, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <main className="min-h-screen p-6 md:p-12 pagina pb-16">
      <Link href="/financas" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-4">Calendário</h1>

      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={() => mudarMes(-1)} aria-label="Mês anterior" className="w-8 h-8 rounded-full text-ink-400 hover:bg-base-800">
          ‹
        </button>
        <p className="text-sm font-medium capitalize w-44 text-center">{nomeMes}</p>
        <button onClick={() => mudarMes(1)} aria-label="Próximo mês" className="w-8 h-8 rounded-full text-ink-400 hover:bg-base-800">
          ›
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">
        <div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DIAS.map((d, i) => (
              <p key={i} className="text-center text-xs text-ink-400">
                {d}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {celulas.map((dia, i) => {
              if (!dia) return <div key={i} />;
              const evs = porDia.get(dia) ?? [];
              const entra = evs.filter((e) => e.tipo === "receita" && e.origem !== "cartao").reduce((s, e) => s + e.valor, 0);
              const sai = evs.filter((e) => e.tipo === "despesa").reduce((s, e) => s + e.valor, 0);
              const saldo = saldos.get(dia);
              const negativo = saldo !== undefined && saldo < 0;
              const futuro = dia > hoje;
              return (
                <button
                  key={dia}
                  type="button"
                  onClick={() => setDiaSel(dia)}
                  className={`min-h-[3.6rem] rounded-lg border p-1 text-left flex flex-col transition ${
                    dia === diaSel ? "border-financa bg-financa/10" : negativo ? "border-red-400/50 bg-red-400/5" : "border-base-600 bg-base-800"
                  } ${dia === hoje ? "ring-1 ring-ink-100" : ""}`}
                >
                  <span className={`text-xs ${futuro ? "text-ink-100" : "text-ink-400"}`}>{Number(dia.slice(8))}</span>
                  {!ocultos && entra > 0 && <span className="text-[10px] leading-tight text-habito font-mono">+{compacto(entra)}</span>}
                  {!ocultos && sai > 0 && <span className="text-[10px] leading-tight text-red-400 font-mono">-{compacto(sai)}</span>}
                  {ocultos && evs.length > 0 && <span className="text-[10px] text-ink-400">•</span>}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-ink-400 mt-2">
            Dias em vermelho: o saldo previsto fica negativo. Considera contas (sem cartão e investimento), agendados, contas fixas e
            faturas.
          </p>
        </div>

        <div className="mt-6 lg:mt-0">
          <p className="text-sm font-medium mb-1">
            {new Date(diaSel + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </p>
          {saldoDia !== undefined && (
            <p className={`text-xs mb-3 ${saldoDia < 0 ? "text-red-400" : "text-ink-400"}`}>
              Saldo previsto no fim do dia: <ValorMonetario valor={saldoDia} />
            </p>
          )}
          {doDia.length === 0 ? (
            <p className="text-sm text-ink-400">Nada nesse dia.</p>
          ) : (
            <ul className="space-y-2">
              {doDia.map((e, i) => (
                <li key={i} className="flex items-center gap-2 bg-base-800 border border-base-600 rounded-2xl p-4 text-sm">
                  <span className="flex-1 min-w-0 truncate">
                    {e.descricao}
                    {ROTULO_ORIGEM[e.origem] && <span className="text-[10px] text-ink-400 ml-1.5">{ROTULO_ORIGEM[e.origem]}</span>}
                  </span>
                  <span className={`font-mono shrink-0 ${e.tipo === "receita" ? "text-habito" : "text-red-400"}`}>
                    {e.tipo === "receita" ? "+" : "-"}
                    <ValorMonetario valor={e.valor} />
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/financas/extrato?dia=${diaSel}`} className="inline-block text-xs text-financa mt-3 hover:underline">
            Ver no extrato →
          </Link>
        </div>
      </div>
    </main>
  );
}
