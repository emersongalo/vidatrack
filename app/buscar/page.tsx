"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { buscarNoSnapshot, type ResultadoBusca } from "@/lib/geral/busca";
import { ValorMonetario } from "@/components/ValorMonetario";

// Etapa 215 — busca geral: lançamentos, hábitos, tarefas, metas, contas...
const ICONE: Record<ResultadoBusca["tipo"], string> = {
  lancamento: "💸",
  habito: "✅",
  tarefa: "📝",
  meta: "🎯",
  conta: "🏦",
  categoria: "🏷️",
  diario: "🙂",
};

export default function BuscarPage() {
  const { snapshot } = useSnapshotOffline();
  const [q, setQ] = useState("");
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    campo.current?.focus();
  }, []);

  const resultados = useMemo(() => (snapshot ? buscarNoSnapshot(snapshot, q) : []), [snapshot, q]);

  return (
    <main className="min-h-screen p-6 md:p-12 pagina-curta">
      <Link href="/dashboard" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Painel
      </Link>
      <div className="relative mt-4 mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          ref={campo}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Buscar lançamento, hábito, tarefa, valor..."
          className="w-full bg-base-800 border border-base-600 rounded-xl2 pl-10 pr-10 py-3 text-ink-100 outline-none focus:border-ink-100"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label="Limpar" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
            <X size={16} />
          </button>
        )}
      </div>

      {q.trim().length < 2 ? (
        <p className="text-sm text-ink-400">Digite pelo menos 2 letras. Dá pra buscar por valor também (ex: 45,90).</p>
      ) : resultados.length === 0 ? (
        <p className="text-sm text-ink-400">Nada encontrado pra “{q}”.</p>
      ) : (
        <ul className="space-y-2">
          {resultados.map((r, i) => (
            <li key={i}>
              <Link href={r.href} className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-2xl p-4 hover:border-ink-400 transition">
                <span className="text-lg w-7 text-center shrink-0">{ICONE[r.tipo]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{r.titulo}</p>
                  <p className="text-xs text-ink-400 truncate">{r.detalhe}</p>
                </div>
                {r.valor !== undefined && (
                  <span className={`font-mono text-sm shrink-0 ${r.receita ? "text-habito" : "text-red-400"}`}>
                    {r.receita ? "+" : "-"}
                    <ValorMonetario valor={r.valor} />
                  </span>
                )}
              </Link>
            </li>
          ))}
          {resultados.length >= 60 && <p className="text-xs text-ink-400 text-center">Mostrando os 60 primeiros — refine a busca.</p>}
        </ul>
      )}
    </main>
  );
}
