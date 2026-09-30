"use client";

// Etapa 232 — o que vem nos próximos 7 dias, no Painel
import Link from "next/link";
import { CalendarClock, CheckSquare, TrendingDown, TrendingUp } from "lucide-react";
import { proximosDias } from "@/lib/painel/proximos";
import { rotuloDoDia } from "@/lib/financas/agruparPorDia";
import { ValorMonetario } from "@/components/ValorMonetario";

const ESTILO = {
  despesa: { Icone: TrendingDown, fundo: "bg-red-400/15 text-red-400", valor: "text-red-400" },
  receita: { Icone: TrendingUp, fundo: "bg-habito/15 text-habito", valor: "text-habito" },
  tarefa: { Icone: CheckSquare, fundo: "bg-nota/15 text-nota", valor: "" },
};

export function ProximosPainel({ snapshot, hoje }: { snapshot: any; hoje: string }) {
  if (!snapshot) return null;
  const itens = proximosDias(snapshot, hoje);

  return (
    <section className="bg-base-800 border border-base-600 rounded-3xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CalendarClock size={20} className="text-ink-400" /> Próximos dias
        </h2>
        <Link href="/financas/calendario" className="text-base text-ink-400 hover:text-ink-100 transition">
          Calendário ›
        </Link>
      </div>

      {itens.length === 0 ? (
        <p className="text-base text-ink-400 py-2">Nada marcado pros próximos 7 dias 🌿</p>
      ) : (
        <ul className="divide-y divide-base-600">
          {itens.map((item, i) => {
            const e = ESTILO[item.tipo];
            return (
              <li key={i}>
                <Link href={item.href} className="flex items-center gap-3 py-3">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${e.fundo}`}>
                    <e.Icone size={19} strokeWidth={2.2} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-base font-medium truncate">{item.titulo}</span>
                    <span className="block text-sm text-ink-400">{rotuloDoDia(item.data, hoje)}</span>
                  </span>
                  {item.valor !== null && (
                    <span className={`font-mono text-base font-semibold shrink-0 ${e.valor}`}>
                      {item.tipo === "despesa" ? "−" : "+"}
                      <ValorMonetario valor={item.valor} />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
