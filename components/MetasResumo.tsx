"use client";

import Link from "next/link";
import { Target } from "lucide-react";
import { planoDaMeta } from "@/lib/financas/metas";
import { ValorMonetario } from "@/components/ValorMonetario";
import { PoteMeta } from "@/components/PoteMeta";

// Etapa 215 — as metas em andamento, direto na tela de Finanças
export function MetasResumo({ metas, hojeISO }: { metas: any[]; hojeISO: string }) {
  const ativas = metas.filter((m) => !m.concluida && !m.arquivada).slice(0, 3);
  if (!ativas.length) return null;
  return (
    <div className="mb-6 lg:break-inside-avoid">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xl font-semibold">Metas</p>
        <Link href="/financas/metas" className="text-xs text-ink-400 hover:text-ink-100 transition">
          Ver todas →
        </Link>
      </div>
      {/* Etapa 230 — cada meta com anel */}
      <Link href="/financas/metas" className="block bg-base-800 border border-base-600 rounded-3xl p-5 space-y-4 hover:border-financa transition">
        {ativas.map((m) => {
          const p = planoDaMeta(m, hojeISO);
          return (
            <div key={m.id} className="flex items-center gap-4">
              <PoteMeta percentual={p.percentual} tamanho={64} />
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium truncate flex items-center gap-1.5">
                  <Target size={15} className="text-financa shrink-0" /> {m.nome}
                </p>
                <p className="text-sm text-ink-400">
                  Faltam <span className="font-mono text-ink-100"><ValorMonetario valor={p.falta} /></span>
                </p>
                {p.porMes !== null && (
                  <p className="text-xs text-ink-400">
                    Guarde <ValorMonetario valor={p.porMes} />/mês pra chegar no prazo
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </Link>
    </div>
  );
}
