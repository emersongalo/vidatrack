"use client";

// Etapa 362 — previsão das próximas faturas do cartão (o que já está
// lançado, parcelas que vão cair, contas fixas e o ritmo de gastos).
import { useMemo, useState } from "react";
import { TrendingUp, ChevronDown } from "lucide-react";
import { previsaoFaturas } from "@/lib/financas/previsaoFatura";
import { formatarMoeda } from "@/lib/financas/formatacao";

const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const rotuloMes = (iso: string | null) => (iso ? `${MES[Number(iso.slice(5, 7)) - 1]}${iso.slice(0, 4) !== new Date().getFullYear().toString() ? `/${iso.slice(2, 4)}` : ""}` : "");
const ddmm = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "");

export function PrevisaoFatura({
  conta,
  transacoes,
  recorrencias,
  hoje,
  quantas = 6,
}: {
  conta: any;
  transacoes: any[];
  recorrencias: any[];
  hoje: string;
  quantas?: number;
}) {
  const lista = useMemo(() => previsaoFaturas(conta, transacoes, recorrencias, hoje, quantas), [conta, transacoes, recorrencias, hoje, quantas]);
  const [aberto, setAberto] = useState<string | null>(null);
  if (!lista.length) return null;
  const limite = Number(conta.limite) || 0;
  const maior = Math.max(1, ...lista.map((f) => Math.max(f.previsto, f.ritmo ?? 0)));

  return (
    <section className="bg-base-800 border border-base-600 rounded-3xl p-4 mb-6 animate-entrar">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-0.5">
        <TrendingUp size={18} className="text-financa" /> Previsão das faturas
      </h2>
      <p className="text-xs text-ink-400 mb-3">Compras já lançadas + parcelas que vão cair + contas fixas no cartão.</p>
      <ul className="space-y-2.5">
        {lista.map((f, i) => {
          const pct = (f.previsto / maior) * 100;
          const pctRitmo = f.ritmo ? (f.ritmo / maior) * 100 : 0;
          const estoura = limite > 0 && (f.ritmo ?? f.previsto) > limite;
          const expandido = aberto === f.fim;
          return (
            <li key={f.fim} className="animate-entrar" style={{ animationDelay: `${i * 45}ms` }}>
              <button type="button" onClick={() => setAberto(expandido ? null : f.fim)} className="w-full text-left">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm">
                    <b className="capitalize">{rotuloMes(f.vencimento ?? f.fim)}</b>
                    <span className="text-ink-400 text-xs"> · vence {ddmm(f.vencimento)}</span>
                    {f.aberta && <span className="ml-1.5 text-[10px] rounded-full bg-financa/15 text-financa px-1.5 py-0.5">aberta</span>}
                  </span>
                  <span className="font-mono text-sm font-semibold flex items-center gap-1">
                    {formatarMoeda(f.previsto)}
                    <ChevronDown size={13} className={`text-ink-400 transition-transform ${expandido ? "rotate-180" : ""}`} />
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-base-700 overflow-hidden mt-1">
                  {f.ritmo && <div className="absolute inset-y-0 left-0 rounded-full bg-financa/30" style={{ width: `${pctRitmo}%` }} />}
                  <div className={`absolute inset-y-0 left-0 rounded-full ${estoura ? "bg-red-400" : "bg-financa"} transition-[width] duration-700`} style={{ width: `${pct}%` }} />
                </div>
                {f.ritmo && (
                  <p className="text-[11px] text-ink-400 mt-1">
                    No ritmo atual pode fechar em <b className={estoura ? "text-red-400" : "text-ink-100"}>~{formatarMoeda(f.ritmo)}</b>
                    {limite > 0 && ` (${Math.round((f.ritmo / limite) * 100)}% do limite)`}
                  </p>
                )}
              </button>
              {expandido && (
                <div className="mt-1.5 rounded-xl bg-base-900/60 border border-base-600 px-3 py-2 text-xs space-y-1 animate-surgir">
                  <p className="flex justify-between">
                    <span className="text-ink-400">Já lançado</span> <span className="font-mono">{formatarMoeda(f.lancado)}</span>
                  </p>
                  {f.qtdParcelas > 0 && (
                    <p className="flex justify-between">
                      <span className="text-ink-400">↳ parcelas ({f.qtdParcelas})</span> <span className="font-mono">{formatarMoeda(f.parcelas)}</span>
                    </p>
                  )}
                  {f.fixas.map((x) => (
                    <p key={x.descricao + x.data} className="flex justify-between">
                      <span className="text-ink-400">🔁 {x.descricao} ({ddmm(x.data)})</span> <span className="font-mono">{formatarMoeda(x.valor)}</span>
                    </p>
                  ))}
                  {limite > 0 && (
                    <p className="flex justify-between pt-1 border-t border-base-600">
                      <span className="text-ink-400">Do limite</span> <span className="font-mono">{Math.round((f.previsto / limite) * 100)}%</span>
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
