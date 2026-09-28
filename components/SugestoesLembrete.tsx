"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { sugerirLembretes } from "@/lib/habitos/lembreteInteligente";
import type { SnapshotOffline } from "@/lib/offline/snapshot";

// Etapa 215 — "você costuma fazer X às 21h, quer o lembrete às 20h45?"
const CHAVE = "vidatrack-sugestoes-lembrete-dispensadas";

export function SugestoesLembrete({ snapshot, hojeISO }: { snapshot: SnapshotOffline; hojeISO: string }) {
  const [dispensadas, setDispensadas] = useState<string[] | null>(null);
  const [aplicadas, setAplicadas] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    try {
      setDispensadas(JSON.parse(localStorage.getItem(CHAVE) || "[]"));
    } catch {
      setDispensadas([]);
    }
  }, []);

  const sugestoes = useMemo(
    () =>
      sugerirLembretes(
        snapshot.habitos as any[],
        snapshot.habitoCheckins.filter((c: any) => !c.usuario_id || c.usuario_id === snapshot.perfil.id) as any,
        hojeISO
      ),
    [snapshot, hojeISO]
  );
  if (dispensadas === null) return null;
  const visiveis = sugestoes.filter((s) => !dispensadas.includes(`${s.habitoId}|${s.sugerido}`) && !aplicadas.includes(s.habitoId));
  if (!visiveis.length) return null;

  function dispensar(chave: string) {
    const novo = [...(dispensadas ?? []), chave].slice(-100);
    setDispensadas(novo);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(novo));
    } catch {}
  }

  async function aplicar(habitoId: string, horario: string) {
    setErro(null);
    const { error } = await createClient().from("habitos").update({ horario_lembrete: horario }).eq("id", habitoId);
    if (error) return setErro("Não consegui mudar o lembrete. Verifique a internet.");
    setAplicadas((a) => [...a, habitoId]);
    atualizarSnapshotEmTodasAsTelas();
  }

  return (
    <div className="space-y-2 mb-6">
      {erro && <p className="text-sm text-red-400">{erro}</p>}
      {visiveis.slice(0, 3).map((s) => (
        <div key={s.habitoId} className="flex items-start gap-3 bg-base-800 border border-habito/30 rounded-xl2 p-3">
          <span className="w-8 h-8 rounded-lg bg-habito/15 text-habito flex items-center justify-center shrink-0">
            <BellRing size={16} />
          </span>
          <div className="flex-1 min-w-0 text-sm">
            <p>
              Você costuma marcar <strong>{s.nome}</strong> por volta das {s.costuma}.{" "}
              {s.atual ? `O lembrete está às ${s.atual}.` : "Ele ainda não tem lembrete."}
            </p>
            <button
              type="button"
              onClick={() => aplicar(s.habitoId, s.sugerido)}
              className="mt-2 text-xs bg-habito text-base-900 font-medium rounded-lg px-3 py-1.5 hover:opacity-90 transition"
            >
              {s.atual ? `Mover lembrete pra ${s.sugerido}` : `Lembrar às ${s.sugerido}`}
            </button>
          </div>
          <button type="button" aria-label="Dispensar" onClick={() => dispensar(`${s.habitoId}|${s.sugerido}`)} className="text-ink-400 hover:text-ink-100 p-1 -m-1">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
