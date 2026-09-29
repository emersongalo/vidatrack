"use client";

// Etapa 224 — cartão "Seu dia" no Painel: anel de progresso dos hábitos,
// o que falta fazer e atalho pra tela Hoje.
import Link from "next/link";
import type { ResumoDia } from "@/lib/painel/seuDia";

function Anel({ feitos, total }: { feitos: number; total: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const pct = total ? feitos / total : 0;
  return (
    <div className="relative w-[76px] h-[76px] shrink-0">
      <svg viewBox="0 0 76 76" className="w-full h-full -rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" strokeWidth="8" className="stroke-base-700" />
        <circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="stroke-habito transition-all duration-500"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-mono font-semibold">
        {feitos}/{total}
      </span>
    </div>
  );
}

export function SeuDia({ resumo }: { resumo: ResumoDia }) {
  const { habitos, tarefas } = resumo;
  const pendentes = [...habitos.pendentes, ...tarefas.pendentes];
  const tudoFeito = habitos.total + tarefas.total > 0 && pendentes.length === 0;

  return (
    <Link href="/habitos" className="block bg-base-800 border border-base-600 rounded-3xl p-5 hover:border-habito/60 transition">
      <div className="flex items-center gap-4">
        {habitos.total > 0 ? (
          <Anel feitos={habitos.feitos} total={habitos.total} />
        ) : (
          <span className="w-[76px] h-[76px] rounded-full bg-habito/15 flex items-center justify-center text-3xl shrink-0">🌿</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xl font-semibold">Seu dia</p>
          <p className="text-base text-ink-400">
            {habitos.total === 0 && tarefas.total === 0
              ? "Nada marcado pra hoje"
              : tudoFeito
                ? "Tudo feito hoje! 🎉"
                : [
                    habitos.total > 0 ? `${habitos.total - habitos.feitos} ${habitos.total - habitos.feitos === 1 ? "hábito" : "hábitos"}` : null,
                    tarefas.total - tarefas.feitas > 0 ? `${tarefas.total - tarefas.feitas} ${tarefas.total - tarefas.feitas === 1 ? "tarefa" : "tarefas"}` : null,
                  ]
                    .filter(Boolean)
                    .join(" e ") + " pra fazer"}
          </p>
        </div>
        <span className="text-ink-400 text-2xl shrink-0">›</span>
      </div>

      {pendentes.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {pendentes.slice(0, 4).map((nome, i) => (
            <span key={i} className="text-sm bg-base-700 rounded-full px-3 py-1.5 max-w-full truncate">
              {nome}
            </span>
          ))}
          {pendentes.length > 4 && <span className="text-sm text-ink-400 px-1 py-1.5">+{pendentes.length - 4}</span>}
        </div>
      )}
    </Link>
  );
}
