"use client";

import { useState } from "react";
import { Gauge } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { gastoDoMes, situacaoTeto } from "@/lib/financas/teto";
import { ValorMonetario } from "@/components/ValorMonetario";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import type { SnapshotOffline } from "@/lib/offline/snapshot";

// Etapa 220 — teto de gastos do mês
export function TetoMensal({ snapshot, hojeISO }: { snapshot: SnapshotOffline; hojeISO: string }) {
  const teto = snapshot.perfil.teto_mensal ?? null;
  const [editando, setEditando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const gasto = gastoDoMes(snapshot.financas.contas as any, snapshot.financas.transacoes as any, hojeISO);

  async function salvar(valor: number | null) {
    setErro(null);
    const { error } = await createClient().from("perfis").update({ teto_mensal: valor }).eq("id", snapshot.perfil.id);
    if (error) return setErro("Não consegui salvar. Verifique a internet.");
    setEditando(false);
    atualizarSnapshotEmTodasAsTelas();
  }

  if (editando || teto === null) {
    if (!editando)
      return (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="w-full flex items-center gap-2 text-sm text-ink-400 bg-base-800 border border-dashed border-base-600 rounded-xl2 p-3 mb-6 hover:text-ink-100 lg:break-inside-avoid"
        >
          <Gauge size={16} /> Definir um teto de gastos pro mês
        </button>
      );
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const bruto = String(new FormData(e.currentTarget).get("teto") ?? "");
          const n = Number(bruto.replace(/\./g, "").replace(",", "."));
          if (!(n > 0)) return setErro("Digite um valor.");
          salvar(n);
        }}
        className="bg-base-800 border border-base-600 rounded-xl2 p-4 mb-6 lg:break-inside-avoid"
      >
        <p className="text-sm font-medium mb-1">Teto de gastos do mês</p>
        <p className="text-xs text-ink-400 mb-3">Quanto você quer gastar no máximo por mês, somando tudo (cartão incluso).</p>
        <div className="flex gap-2">
          <CampoValorMonetario
            name="teto"
            valorInicial={teto ?? undefined}
            placeholder="Ex: 3.000,00"
            className="flex-1 min-w-0 bg-base-900 border border-base-600 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:border-ink-100"
          />
          <button className="bg-financa text-base-900 font-medium rounded-lg px-4 text-sm">Salvar</button>
        </div>
        <div className="flex gap-3 mt-2 text-xs">
          <button type="button" onClick={() => setEditando(false)} className="text-ink-400 underline">
            Cancelar
          </button>
          {teto !== null && (
            <button type="button" onClick={() => salvar(null)} className="text-red-400 underline">
              Remover teto
            </button>
          )}
        </div>
        {erro && <p className="text-xs text-red-400 mt-2">{erro}</p>}
      </form>
    );
  }

  const s = situacaoTeto(gasto, teto, hojeISO);
  const cor = s.estourou ? "bg-red-400" : s.pct >= 80 ? "bg-financa" : "bg-habito";
  return (
    <button
      type="button"
      onClick={() => setEditando(true)}
      className="w-full text-left bg-base-800 border border-base-600 rounded-xl2 p-4 mb-6 lg:break-inside-avoid"
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <Gauge size={15} className="text-financa" /> Teto do mês
        </p>
        <p className="text-xs text-ink-400">
          <ValorMonetario valor={gasto} /> de <ValorMonetario valor={teto} />
        </p>
      </div>
      <div className="h-2.5 bg-base-600 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.min(100, s.pct)}%` }} />
      </div>
      <p className={`text-xs mt-2 ${s.estourou ? "text-red-400" : "text-ink-400"}`}>
        {s.estourou ? (
          <>
            Passou <ValorMonetario valor={-s.restante} /> do teto ({s.pct}%).
          </>
        ) : (
          <>
            {s.pct}% usado · sobram <ValorMonetario valor={s.restante} /> (≈ <ValorMonetario valor={s.porDia} />/dia)
            {s.acimaDoRitmo ? " · acima do ritmo" : ""}
          </>
        )}
      </p>
    </button>
  );
}
