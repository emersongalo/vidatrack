"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";
import { etiquetasUsadas, normalizarEtiqueta } from "@/lib/financas/etiquetas";

// Etapa 218 — etiquetas livres: digite e toque Enter (ou vírgula)
export function CampoEtiquetas({ iniciais }: { iniciais?: string[] | null }) {
  const [lista, setLista] = useState<string[]>(iniciais ?? []);
  const [texto, setTexto] = useState("");
  const [usadas, setUsadas] = useState<string[]>([]);

  useEffect(() => {
    setUsadas(etiquetasUsadas((lerSnapshotOffline()?.financas.transacoes ?? []) as any[]));
  }, []);

  function adicionar(bruto: string) {
    const e = normalizarEtiqueta(bruto);
    if (!e || lista.includes(e) || lista.length >= 10) return;
    setLista((l) => [...l, e]);
    setTexto("");
  }

  const q = normalizarEtiqueta(texto);
  const sugestoes = usadas.filter((u) => !lista.includes(u) && (!q || u.includes(q))).slice(0, 6);

  return (
    <div>
      <label htmlFor="campoEtiqueta" className="block text-sm text-ink-400 mb-1">
        Etiquetas (opcional)
      </label>
      <div className="flex flex-wrap items-center gap-1.5 bg-base-800 border border-base-600 rounded-lg px-2 py-2 focus-within:border-ink-100 transition">
        {lista.map((e) => (
          <span key={e} className="flex items-center gap-1 text-xs bg-nota-soft text-nota rounded-full pl-2 pr-1 py-0.5">
            #{e}
            <button type="button" aria-label={`Remover ${e}`} onClick={() => setLista((l) => l.filter((x) => x !== e))} className="p-0.5">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id="campoEtiqueta"
          value={texto}
          onChange={(ev) => {
            const v = ev.target.value;
            if (v.endsWith(",")) adicionar(v.slice(0, -1));
            else setTexto(v);
          }}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              adicionar(texto);
            } else if (ev.key === "Backspace" && !texto && lista.length) {
              setLista((l) => l.slice(0, -1));
            }
          }}
          onBlur={() => texto.trim() && adicionar(texto)}
          placeholder={lista.length ? "" : "ex: viagem praia, reforma"}
          className="flex-1 min-w-[8rem] bg-transparent text-sm text-ink-100 outline-none px-1"
        />
      </div>
      {sugestoes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {sugestoes.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => adicionar(s)}
              className="text-[11px] text-ink-400 border border-base-600 rounded-full px-2 py-0.5 hover:text-nota hover:border-nota/50"
            >
              #{s}
            </button>
          ))}
        </div>
      )}
      {lista.map((e) => (
        <input key={e} type="hidden" name="etiquetas" value={e} />
      ))}
      <input type="hidden" name="etiquetasPresente" value="1" />
    </div>
  );
}
