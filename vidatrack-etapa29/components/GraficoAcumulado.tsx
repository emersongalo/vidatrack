"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatarMoeda } from "@/lib/financas/formatacao";

export function GraficoAcumulado({ dados }: { dados: { dia: number; acumulado: number }[] }) {
  if (dados.length === 0) return null;

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dados} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="gradienteAcumulado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D9A24C" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#D9A24C" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
          <XAxis
            dataKey="dia"
            tick={{ fontSize: 10, fill: "#9B9CA6" }}
            axisLine={false}
            tickLine={false}
            interval={Math.max(1, Math.floor(dados.length / 8))}
          />
          <YAxis tick={{ fontSize: 10, fill: "#9B9CA6" }} axisLine={false} tickLine={false} width={0} />
          <Tooltip
            formatter={(v: number) => formatarMoeda(v)}
            labelFormatter={(d) => `Dia ${d}`}
            contentStyle={{
              background: "#1F2127",
              border: "1px solid #2A2D35",
              borderRadius: 8,
              fontSize: 12,
              color: "#F2F0EA",
            }}
          />
          <Area
            type="monotone"
            dataKey="acumulado"
            stroke="#D9A24C"
            strokeWidth={2.5}
            fill="url(#gradienteAcumulado)"
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
