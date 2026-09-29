"use client";

import Link from "next/link";
import { padroesPorDiaSemana, NOMES_DIA } from "@/lib/habitos/padroes";
import type { SnapshotOffline } from "@/lib/offline/snapshot";

// Etapa 220 — "você falha mais Beber água às segundas"
export function PadroesSemana({ snapshot, hojeISO }: { snapshot: SnapshotOffline; hojeISO: string }) {
  const meus = snapshot.habitoCheckins.filter((c: any) => !c.usuario_id || c.usuario_id === snapshot.perfil.id);
  const padroes = padroesPorDiaSemana(snapshot.habitos as any[], meus as any, hojeISO).slice(0, 4);
  if (!padroes.length) return null;
  return (
    <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 mb-6">
      <p className="text-sm font-medium mb-1">📅 Seus padrões da semana</p>
      <p className="text-xs text-ink-400 mb-3">Últimas 8 semanas — onde vale um empurrãozinho extra.</p>
      <ul className="space-y-3">
        {padroes.map((p) => (
          <li key={p.habitoId} className="text-sm">
            <p>
              <strong>{p.nome}</strong>: você completa {p.taxaGeral}% dos dias, mas só{" "}
              <span className="text-red-400">{p.taxaPiorDia}% às {NOMES_DIA[p.piorDia]}</span>.
            </p>
            <p className="text-xs text-ink-400 mt-0.5">
              Melhor dia: {NOMES_DIA[p.melhorDia]} ({p.taxaMelhorDia}%). Dica: um lembrete a mais nas {NOMES_DIA[p.piorDia]} ou deixar
              pronto na noite anterior.{" "}
              <Link href={`/habitos/${p.habitoId}/editar`} className="text-habito underline">
                Ajustar lembrete
              </Link>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
