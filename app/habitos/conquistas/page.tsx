"use client";

import Link from "next/link";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { useEffect } from "react";
import { hojeISO } from "@/lib/habitos/streak";
import { CHAVE_CONQUISTAS_VISTAS, calcularConquistas, ganhou } from "@/lib/habitos/conquistas";

/**
 * Etapa 214 — Conquistas: selos calculados na hora a partir do que já
 * está salvo no aparelho (nada novo no banco). Os bloqueados aparecem
 * apagados com a barra de progresso, pra dar vontade de chegar lá.
 * Etapa 221 — a conta foi pra lib/habitos/conquistas.ts.
 */
export default function ConquistasPage() {
  const { snapshot } = useSnapshotOffline();
  const lista = snapshot ? calcularConquistas(snapshot, hojeISO()) : [];

  // quem abriu a tela já viu tudo: o aviso do Painel não repete
  useEffect(() => {
    if (!lista.length) return;
    try {
      localStorage.setItem(CHAVE_CONQUISTAS_VISTAS, JSON.stringify(lista.filter(ganhou).map((c) => c.id)));
    } catch {
      /* ignora */
    }
  }, [lista.length, lista.filter(ganhou).length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (snapshot === undefined) return null;
  if (!snapshot) {
    return (
      <main className="pagina px-6 md:px-12 pt-6">
        <p className="text-ink-400 text-sm">Abra o app com internet uma vez pra carregar suas conquistas.</p>
      </main>
    );
  }

  const ganhas = lista.filter((c) => c.atual >= c.alvo).length;

  return (
    <main className="pagina px-6 md:px-12 pt-2 pb-16">
      <Link href="/habitos/estatisticas" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Estatísticas
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-1">Conquistas</h1>
      <p className="text-ink-400 text-sm mb-6">
        {ganhas} de {lista.length} desbloqueadas
      </p>

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {lista.map((c) => {
          const ganhou = c.atual >= c.alvo;
          const pct = Math.min(100, Math.round((c.atual / c.alvo) * 100));
          return (
            <li
              key={c.id}
              className={`rounded-xl2 border p-4 text-center ${
                ganhou ? "bg-habito/10 border-habito/40" : "bg-base-800 border-base-600"
              }`}
            >
              <p className={`text-4xl mb-2 ${ganhou ? "" : "grayscale opacity-40"}`}>{c.emoji}</p>
              <p className={`text-sm font-medium ${ganhou ? "" : "text-ink-400"}`}>{c.titulo}</p>
              <p className="text-xs text-ink-400 mt-0.5 leading-snug">{c.texto}</p>
              {!ganhou && (
                <div className="mt-3">
                  <div className="h-1 bg-base-600 rounded-full overflow-hidden">
                    <div className="h-full bg-habito rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-ink-400 mt-1 font-mono">
                    {Math.min(c.atual, c.alvo)}/{c.alvo}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
