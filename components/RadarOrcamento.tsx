"use client";

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend,
} from "recharts";

export function RadarOrcamento({
  dados,
}: {
  dados: { nome: string; orcamento: number; gasto: number }[];
}) {
  if (dados.length < 3) return null; // radar só faz sentido com 3+ eixos

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={dados} outerRadius="70%">
          <PolarGrid stroke="#2A2D35" />
          <PolarAngleAxis dataKey="nome" tick={{ fontSize: 11, fill: "#9B9CA6" }} />
          <PolarRadiusAxis tick={{ fontSize: 9, fill: "#6B6C76" }} axisLine={false} />
          <Radar name="Orçamento" dataKey="orcamento" stroke="#7FB894" fill="#7FB894" fillOpacity={0.15} />
          <Radar name="Gasto real" dataKey="gasto" stroke="#D9A24C" fill="#D9A24C" fillOpacity={0.35} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Tooltip
            formatter={(v: number) => `R$ ${v.toFixed(2)}`}
            contentStyle={{
              background: "#1F2127",
              border: "1px solid #2A2D35",
              borderRadius: 8,
              fontSize: 12,
              color: "#F2F0EA",
            }}
            labelStyle={{ color: "#F2F0EA" }}
            itemStyle={{ color: "#F2F0EA" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
