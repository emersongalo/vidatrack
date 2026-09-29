"use client";

import { useState } from "react";
import { CalendarClock, ChevronDown } from "lucide-react";
import { ValorMonetario } from "@/components/ValorMonetario";
import type { PrevisaoMes as TipoPrevisao } from "@/lib/financas/previsao";

// Etapa 215 — "quanto vai sobrar até o fim do mês" em destaque
const ROTULO_ORIGEM = { agendado: "agendado", recorrente: "↻ todo mês", fatura: "cartão" } as const;

function ddmm(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

export function PrevisaoMes({ previsao }: { previsao: TipoPrevisao }) {
  const [aberto, setAberto] = useState(false);
  const { sobra, porDia, diaNegativo, itens, saldoHoje, entradas, saidas, diasRestantes } = previsao;
  const negativo = sobra < 0;

  return (
    <div
      className={`bg-base-800 border rounded-xl2 shadow-lg shadow-black/20 p-4 mb-6 lg:break-inside-avoid ${
        negativo ? "border-red-400/50" : "border-base-600"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            negativo ? "bg-red-400/15 text-red-400" : "bg-habito/15 text-habito"
          }`}
        >
          <CalendarClock size={18} strokeWidth={2} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-ink-400">Previsão até o fim do mês</p>
          <p className={`text-xl font-display font-semibold ${negativo ? "text-red-400" : "text-habito"}`}>
            {negativo ? "Vai faltar " : "Vai sobrar "}
            <span className="font-mono">
              <ValorMonetario valor={Math.abs(sobra)} />
            </span>
          </p>
          {porDia !== null && !diaNegativo && (
            <p className="text-xs text-ink-400 mt-0.5">
              Dá pra gastar até <span className="text-ink-100 font-mono"><ValorMonetario valor={porDia} /></span> por dia
              {diasRestantes > 1 ? ` nos próximos ${diasRestantes} dias` : " hoje"}
            </p>
          )}
          {diaNegativo && (
            <p className="text-xs text-red-400 mt-0.5">
              ⚠️ O saldo fica negativo em {ddmm(diaNegativo)} se nada mudar.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div className="bg-base-900/60 rounded-lg py-2">
          <p className="text-xs text-ink-400">Hoje</p>
          <p className="text-xs font-mono"><ValorMonetario valor={saldoHoje} /></p>
        </div>
        <div className="bg-base-900/60 rounded-lg py-2">
          <p className="text-xs text-ink-400">Vai entrar</p>
          <p className="text-xs font-mono text-habito">+<ValorMonetario valor={entradas} /></p>
        </div>
        <div className="bg-base-900/60 rounded-lg py-2">
          <p className="text-xs text-ink-400">Vai sair</p>
          <p className="text-xs font-mono text-red-400">-<ValorMonetario valor={saidas} /></p>
        </div>
      </div>

      {itens.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setAberto((a) => !a)}
            className="w-full flex items-center justify-center gap-1 text-xs text-ink-400 hover:text-ink-100 mt-3 transition"
          >
            {aberto ? "Esconder" : `Ver o que ainda vai entrar e sair (${itens.length})`}
            <ChevronDown size={14} className={`transition ${aberto ? "rotate-180" : ""}`} />
          </button>
          {aberto && (
            <ul className="mt-2 divide-y divide-base-600">
              {itens.map((i, n) => (
                <li key={n} className="flex items-center gap-2 py-2 text-sm">
                  <span className="text-xs text-ink-400 font-mono w-11 shrink-0">{ddmm(i.data)}</span>
                  <span className="flex-1 min-w-0 truncate">
                    {i.descricao}
                    <span className="text-[10px] text-ink-400 ml-1.5">{ROTULO_ORIGEM[i.origem]}</span>
                  </span>
                  <span className={`font-mono text-xs shrink-0 ${i.tipo === "receita" ? "text-habito" : "text-red-400"}`}>
                    {i.tipo === "receita" ? "+" : "-"}
                    <ValorMonetario valor={i.valor} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <a href="/financas/calendario" className="block text-center text-xs text-financa mt-3 hover:underline">
        📅 Ver dia a dia no calendário →
      </a>
      <p className="text-[10px] text-ink-400 mt-2">
        Considera saldo das contas (sem cartão e investimento), lançamentos agendados, recorrentes e faturas do cartão.
      </p>
    </div>
  );
}
