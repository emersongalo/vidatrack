"use client";

import dynamic from "next/dynamic";

export const GraficoComparacaoMensalLazy = dynamic(
  () => import("./GraficoComparacaoMensal").then((m) => m.GraficoComparacaoMensal),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 rounded-xl2 bg-base-800 border border-base-600 animate-pulse" />
    ),
  }
);
