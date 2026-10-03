"use client";

// Etapa 247 — "Hoje você pode gastar R$ X": a resposta pra pergunta que
// todo mundo faz, num número só. Já desconta contas fixas, agendados e
// faturas do cartão até o fim do mês (e respeita o teto, se tiver).
import { useMemo } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { ValorMonetario } from "@/components/ValorMonetario";
import { preverFimDoMes } from "@/lib/financas/previsao";
import { podeGastarHoje } from "@/lib/financas/hoje";

export function PodeGastarHoje({ snapshot, hojeISO, noInicio = false }: { snapshot: any; hojeISO: string; noInicio?: boolean }) {
  const r = useMemo(() => {
    const f = snapshot?.financas;
    if (!f?.contas?.length) return null;
    const previsao = preverFimDoMes({ contas: f.contas, transacoes: f.transacoes, recorrencias: f.recorrencias ?? [], hojeISO });
    return podeGastarHoje({ previsao, contas: f.contas, transacoes: f.transacoes, hojeISO, teto: snapshot.perfil?.teto_mensal ?? null });
  }, [snapshot, hojeISO]);

  if (!r) return null;

  const passou = r.restante < 0;
  const pct = r.limite > 0 ? Math.min(100, Math.round((r.gastouHoje / r.limite) * 100)) : r.gastouHoje > 0 ? 100 : 0;
  const cor = r.semFolga || passou ? "text-red-400" : pct >= 80 ? "text-financa" : "text-habito";
  const corBarra = r.semFolga || passou ? "bg-red-400" : pct >= 80 ? "bg-financa" : "bg-habito";

  const conteudo = (
    <div className={`relative overflow-hidden bg-base-800 border rounded-3xl p-5 ${noInicio ? "" : "mb-6 lg:break-inside-avoid"} ${r.semFolga || passou ? "border-red-400/40" : "border-base-600"}`}>
      {/* brilho suave no canto */}
      <span
        aria-hidden
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-25 ${corBarra}`}
      />
      <div className="relative flex items-start gap-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-base-900/60 ${cor}`}>
          <Wallet size={20} strokeWidth={2} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink-400">
            {r.semFolga ? "Sem folga este mês" : passou ? "Hoje passou do ideal" : "Hoje você ainda pode gastar"}
          </p>
          <p className={`text-3xl font-display font-bold font-mono leading-tight ${cor}`}>
            {r.semFolga ? (
              <ValorMonetario valor={0} />
            ) : (
              <>
                {passou && "−"}
                <ValorMonetario valor={Math.abs(r.restante)} />
              </>
            )}
          </p>
        </div>
      </div>

      {!r.semFolga && (
        <>
          <div className="relative h-2.5 rounded-full bg-base-900 mt-4 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${corBarra}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="relative flex justify-between text-xs text-ink-400 mt-1.5">
            <span>
              Gastou hoje <span className="font-mono text-ink-100"><ValorMonetario valor={r.gastouHoje} /></span>
            </span>
            <span>
              Limite do dia <span className="font-mono text-ink-100"><ValorMonetario valor={r.limite} /></span>
            </span>
          </div>
        </>
      )}

      <p className="relative text-xs text-ink-400 mt-3">
        {r.semFolga
          ? "As contas, agendados e faturas previstos já usam todo o saldo até o fim do mês."
          : passou
            ? "Tudo bem — amanhã o valor se ajusta sozinho pros dias que faltam."
            : r.motivo === "teto"
              ? `Pelo seu teto de gastos, dividido pelos ${r.diasRestantes} dias que faltam.`
              : `Já descontei contas fixas, agendados e faturas até o fim do mês (${r.diasRestantes} ${r.diasRestantes === 1 ? "dia" : "dias"}).`}
      </p>
    </div>
  );

  return noInicio ? (
    <Link href="/financas" className="block">
      {conteudo}
    </Link>
  ) : (
    conteudo
  );
}
