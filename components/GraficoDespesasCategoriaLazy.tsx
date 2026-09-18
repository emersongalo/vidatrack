"use client";

import dynamic from "next/dynamic";

/**
 * O recharts é uma biblioteca relativamente pesada, e esse gráfico
 * não é a primeira coisa que alguém precisa ver na tela de Início
 * (o saldo e as contas são). Carregando ele separado do resto do
 * JavaScript da página, o recharts só é baixado/executado depois que
 * o essencial já está pronto — em vez de atrasar a tela inteira
 * esperando por uma biblioteca de gráfico.
 */
export const GraficoDespesasCategoriaLazy = dynamic(
  () => import("./GraficoDespesasCategoria").then((m) => m.GraficoDespesasCategoria),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-xl2 bg-base-800 border border-base-600 animate-pulse" />
    ),
  }
);
