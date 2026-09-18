"use client";

import dynamic from "next/dynamic";

export const TreemapGastosLazy = dynamic(
  () => import("./TreemapGastos").then((m) => m.TreemapGastos),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 rounded-xl2 bg-base-800 border border-base-600 animate-pulse" />
    ),
  }
);
