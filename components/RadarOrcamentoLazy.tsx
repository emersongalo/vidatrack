"use client";

import dynamic from "next/dynamic";

export const RadarOrcamentoLazy = dynamic(
  () => import("./RadarOrcamento").then((m) => m.RadarOrcamento),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 rounded-xl2 bg-base-800 border border-base-600 animate-pulse" />
    ),
  }
);
