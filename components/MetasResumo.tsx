"use client";

import Link from "next/link";
import { Target } from "lucide-react";
import { planoDaMeta } from "@/lib/financas/metas";
import { ValorMonetario } from "@/components/ValorMonetario";

// Etapa 215 — as metas em andamento, direto na tela de Finanças
export function MetasResumo({ metas, hojeISO }: { metas: any[]; hojeISO: string }) {
  const ativas = metas.filter((m) => !m.concluida && !m.arquivada).slice(0, 3);
  if (!ativas.length) return null;
  return (
    <div className="mb-6 lg:break-inside-avoid">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-ink-400">Metas</p>
        <Link href="/financas/metas" className="text-xs text-ink-400 hover:text-ink-100 transition">
          Ver todas →
        </Link>
      </div>
      <Link href="/financas/metas" className="block bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 p-4 space-y-3 hover:border-financa transition">
        {ativas.map((m) => {
          const p = planoDaMeta(m, hojeISO);
          return (
            <div key={m.id}>
              <div className="flex items-center justify-between text-sm mb-1 gap-2">
                <span className="flex items-center gap-1.5 truncate">
                  <Target size={14} className="text-financa shrink-0" /> {m.nome}
                </span>
                <span className="text-xs text-ink-400 shrink-0">{p.percentual}%</span>
              </div>
              <div className="h-1.5 bg-base-600 rounded-full overflow-hidden">
                <div className="h-full bg-financa rounded-full" style={{ width: `${p.percentual}%` }} />
              </div>
              {p.porMes !== null && (
                <p className="text-[11px] text-ink-400 mt-1">
                  Guarde <ValorMonetario valor={p.porMes} />/mês pra chegar no prazo
                </p>
              )}
            </div>
          );
        })}
      </Link>
    </div>
  );
}
