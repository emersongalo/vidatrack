"use client";

import dynamic from "next/dynamic";

export const GraficoAcumuladoLazy = dynamic(
  () => import("./GraficoAcumulado").then((m) => m.GraficoAcumulado),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 rounded-xl2 bg-base-800 border border-base-600 animate-pulse" />
    ),
  }
);
