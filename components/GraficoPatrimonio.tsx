"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";
import type { PontoPatrimonio } from "@/lib/financas/patrimonio";

export function GraficoPatrimonio({ dados }: { dados: PontoPatrimonio[] }) {
  const ocultos = useValoresOcultos();

  return (
    <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ left: -10, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: "#9B9890", fontSize: 11 }} axisLine={{ stroke: "#2A2D35" }} tickLine={false} />
            <YAxis
              tick={{ fill: "#9B9890", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (ocultos ? "••••" : formatarMoeda(v).replace("R$", "").trim())}
            />
            <Tooltip
              formatter={(valor: number) => (ocultos ? "R$ ••••••" : formatarMoeda(valor))}
              contentStyle={{
                background: "#1F2127",
                border: "1px solid #2A2D35",
                borderRadius: 8,
                fontSize: 13,
                color: "#F2F0EA",
              }}
              labelStyle={{ color: "#F2F0EA" }}
            />
            <Line type="monotone" dataKey="patrimonio" stroke="#D9A24C" strokeWidth={2.5} dot={{ fill: "#D9A24C", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
