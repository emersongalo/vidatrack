"use client";

// Etapa 364/365 — contas fixas dos meses que ainda não chegaram: o app só
// lança quando o mês chega, então aqui elas aparecem como previstas (só
// na tela, nada é gravado). Usado em Finanças e no Extrato.
import { formatarMoeda } from "@/lib/financas/formatacao";
import type { Prevista } from "@/lib/financas/recorrentesPrevistas";

function dataCurta(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

export function ContasFixasPrevistas({
  previstas,
  mapaContas,
  comData = false,
}: {
  previstas: Prevista[];
  mapaContas: Map<any, any>;
  /** mostra o dia da semana + mês (quando o período tem mais de um mês) */
  comData?: boolean;
}) {
  if (!previstas.length) return null;
  const total = previstas.reduce((s, p) => s + (p.tipo === "receita" ? p.valor : -p.valor), 0);
  return (
    <div className="mt-3 bg-base-800 border border-dashed border-financa/40 rounded-2xl p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-financa">📅 Contas fixas previstas</p>
        <span className={`font-mono text-xs ${total >= 0 ? "text-habito" : "text-red-400"}`}>
          {total >= 0 ? "+" : "−"}
          {formatarMoeda(Math.abs(total))}
        </span>
      </div>
      <p className="text-xs text-ink-400 mb-2">Entram nos lançamentos quando o mês chegar.</p>
      <ul className="divide-y divide-base-600/60">
        {previstas.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <p className="text-sm truncate">
                <span className="text-financa">↻ </span>
                {p.descricao || (p.tipo === "receita" ? "Receita fixa" : "Conta fixa")}
              </p>
              <p className="text-xs text-ink-400">
                {comData ? dataCurta(p.data) : `Dia ${p.data.slice(8, 10)}`} · {(mapaContas.get(p.conta_id) as string) ?? ""}
              </p>
            </div>
            <span className={`font-mono text-sm shrink-0 ${p.tipo === "receita" ? "text-habito" : "text-red-400"}`}>
              {p.tipo === "receita" ? "+" : "−"}
              {formatarMoeda(p.valor)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
