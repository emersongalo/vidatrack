"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";

import { opcoesAdiar } from "@/lib/agenda/adiar";

export function AdiarTarefa({ tarefaId, aoAdiar }: { tarefaId: string; aoAdiar?: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [estado, setEstado] = useState<"parado" | "salvando" | "erro">("parado");

  async function adiar(data: string) {
    setEstado("salvando");
    const { error } = await createClient().from("tarefas").update({ data }).eq("id", tarefaId);
    if (error) return setEstado("erro");
    setEstado("parado");
    setAberto(false);
    await atualizarSnapshotEmTodasAsTelas();
    aoAdiar?.();
  }

  if (!aberto)
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAberto(true);
        }}
        className="text-xs px-1.5 py-0.5 rounded bg-base-700 text-ink-400 hover:text-ink-100"
      >
        ⏭ Adiar
      </button>
    );

  return (
    <span className="inline-flex flex-wrap items-center gap-1" onClick={(e) => e.preventDefault()}>
      {opcoesAdiar(hojeISO()).map((o) => (
        <button
          key={o.data}
          type="button"
          disabled={estado === "salvando"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            adiar(o.data);
          }}
          className="text-xs px-2 py-0.5 rounded-full border border-financa/40 text-financa disabled:opacity-50"
        >
          {o.rotulo}
        </button>
      ))}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAberto(false);
        }}
        className="text-xs text-ink-400 px-1"
        aria-label="Cancelar"
      >
        ✕
      </button>
      {estado === "erro" && <span className="text-xs text-red-400">sem internet?</span>}
    </span>
  );
}
