"use client";

import Link from "next/link";
import { ValorMonetario } from "@/components/ValorMonetario";
import { useContagem } from "@/components/NumeroAnimado";

// Etapa 286 — a barra enche ao abrir a tela, na cor da categoria; passou
// do limite, pisca em vermelho (uma vez).
export function BarraOrcamento({
  nome,
  gasto,
  meta,
  href,
  cor,
  icone,
}: {
  nome: string;
  gasto: number;
  meta: number;
  /** Etapa 197 — tocar leva pro Extrato daquela categoria */
  href?: string;
  /** cor da categoria (hex) */
  cor?: string;
  icone?: React.ReactNode;
}) {
  const alvo = meta > 0 ? Math.min(100, (gasto / meta) * 100) : 0;
  const percentual = useContagem(alvo, 900);
  const estourou = gasto > meta;
  const perto = !estourou && alvo >= 80;
  const corBarra = estourou ? "#F87171" : cor ?? "rgb(var(--c-financa))";

  const Raiz: any = href ? Link : "div";
  return (
    <Raiz {...(href ? { href, className: "block rounded-xl -mx-2 px-2 py-1.5 hover:bg-base-700 transition" } : {})}>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-sm flex items-center gap-1.5 min-w-0">
          {icone}
          <span className="truncate">{nome}</span>
          {estourou && <span className="text-[11px] font-semibold text-red-400 shrink-0">passou</span>}
          {perto && <span className="text-[11px] font-semibold text-amber-400 shrink-0">quase</span>}
        </span>
        <span className={`text-xs font-mono shrink-0 ${estourou ? "text-red-400" : "text-ink-400"}`}>
          <ValorMonetario valor={gasto} /> / <ValorMonetario valor={meta} />
        </span>
      </div>
      <div className="h-2 bg-base-600/70 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${estourou ? "piscar-alerta" : ""}`}
          style={{ width: `${percentual}%`, background: corBarra }}
        />
      </div>
    </Raiz>
  );
}
