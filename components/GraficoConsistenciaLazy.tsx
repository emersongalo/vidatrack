"use client";

import dynamic from "next/dynamic";

// Mesma ideia do GraficoDespesasCategoriaLazy: adia o carregamento do
// recharts pra depois do resto da tela de Estatísticas já estar pronta.
export const GraficoConsistenciaLazy = dynamic(
  () => import("./GraficoConsistencia").then((m) => m.GraficoConsistencia),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 rounded-xl2 bg-base-800 border border-base-600 animate-pulse" />
    ),
  }
);
