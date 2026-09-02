"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function GraficoConsistencia({
  dados,
  cor,
}: {
  dados: { dia: string; feito: number }[];
  cor: string;
}) {
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="dia"
            tick={{ fontSize: 10, fill: "#9B9CA6" }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis hide domain={[0, 1]} />
          <Tooltip
            contentStyle={{
              background: "#1F2127",
              border: "1px solid #2A2D35",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number) => (v ? "Feito" : "Não feito")}
            labelFormatter={(l) => l}
          />
          <Bar dataKey="feito" radius={[3, 3, 0, 0]}>
            {dados.map((d, i) => (
              <Cell key={i} fill={d.feito ? cor : "#2A2D35"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
