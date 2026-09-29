"use client";

import { resumoDozeMeses } from "@/lib/financas/dozeMeses";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";

// Etapa 220 — últimos 12 meses: barras de receita (verde) e despesa (vermelha)
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function GraficoDozeMeses({ contas, transacoes, hojeISO }: { contas: any[]; transacoes: any[]; hojeISO: string }) {
  const ocultos = useValoresOcultos();
  const dados = resumoDozeMeses(contas, transacoes, hojeISO);
  const comDados = dados.filter((d) => d.receitas || d.despesas);
  if (comDados.length < 2) return null;
  const max = Math.max(1, ...dados.map((d) => Math.max(d.receitas, d.despesas)));
  const totalSobra = dados.reduce((s, d) => s + d.sobra, 0);
  const mediaDespesa = comDados.reduce((s, d) => s + d.despesas, 0) / comDados.length;
  const v = (n: number) => (ocultos ? "R$ ••••" : formatarMoeda(n));

  return (
    <div className="bg-base-800 border border-base-600 rounded-xl2 p-5 mb-6">
      <p className="text-sm text-ink-400 mb-1">Últimos 12 meses</p>
      <p className="text-xs text-ink-400 mb-4">
        {totalSobra >= 0 ? "Sobrou" : "Faltou"} <span className={totalSobra >= 0 ? "text-habito" : "text-red-400"}>{v(Math.abs(totalSobra))}</span> no
        período · gasto médio {v(mediaDespesa)}/mês
      </p>
      <div className="flex items-end gap-1.5 h-36" role="img" aria-label="Receitas e despesas por mês">
        {dados.map((d) => (
          <div key={d.mes} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${d.mes}: +${formatarMoeda(d.receitas)} / -${formatarMoeda(d.despesas)}`}>
            <div className="flex items-end gap-[2px] h-28 w-full justify-center">
              <div className="w-1/2 max-w-[10px] bg-habito rounded-t" style={{ height: `${(d.receitas / max) * 100}%` }} />
              <div className="w-1/2 max-w-[10px] bg-red-400 rounded-t" style={{ height: `${(d.despesas / max) * 100}%` }} />
            </div>
            <span className={`text-[9px] ${d.sobra < 0 ? "text-red-400" : "text-ink-400"}`}>{MESES[Number(d.mes.slice(5, 7)) - 1]}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-ink-400">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-habito" /> Receitas
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-400" /> Despesas
        </span>
        <span>Mês em vermelho = gastou mais do que recebeu</span>
      </div>
    </div>
  );
}
