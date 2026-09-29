"use client";

// Etapa 220 — lista do que mudou nas últimas versões.
import { useEffect } from "react";
import Link from "next/link";
import { NOVIDADES } from "@/lib/novidades/lista";
import { marcarNovidadesVistas } from "@/components/NovidadesApp";

export default function NovidadesPage() {
  useEffect(() => {
    marcarNovidadesVistas();
  }, []);

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-lg mx-auto">
      <Link href="/dashboard" className="text-sm text-ink-400 hover:text-ink-100">
        ← Painel
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-3 mb-1">O que há de novo</h1>
      <p className="text-sm text-ink-400 mb-6">As últimas melhorias do VidaTrack. Toque num item pra experimentar.</p>

      {NOVIDADES.map((g, gi) => (
        <section key={g.versao} className="mb-8">
          <h2 className="text-sm font-medium mb-3">
            {gi === 0 && <span className="text-[10px] uppercase tracking-wide bg-habito/20 text-habito rounded px-1.5 py-0.5 mr-2">Nova</span>}
            {g.titulo}
          </h2>
          <ul className="space-y-2">
            {g.itens.map((n) => {
              const conteudo = (
                <>
                  <span className="text-xl shrink-0">{n.emoji}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{n.titulo}</span>
                    <span className="block text-xs text-ink-400">{n.texto}</span>
                  </span>
                </>
              );
              return (
                <li key={n.titulo}>
                  {n.href ? (
                    <Link href={n.href} className="flex gap-3 bg-base-800 border border-base-600 rounded-xl2 p-3 hover:border-ink-400 transition">
                      {conteudo}
                    </Link>
                  ) : (
                    <div className="flex gap-3 bg-base-800 border border-base-600 rounded-xl2 p-3">{conteudo}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
