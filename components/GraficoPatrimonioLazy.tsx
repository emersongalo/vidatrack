"use client";

import dynamic from "next/dynamic";

export const GraficoPatrimonioLazy = dynamic(
  () => import("./GraficoPatrimonio").then((m) => m.GraficoPatrimonio),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-xl2 bg-base-800 border border-base-600 animate-pulse" />
    ),
  }
);
