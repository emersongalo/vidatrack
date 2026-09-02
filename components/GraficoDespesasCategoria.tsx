"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatarMoeda } from "@/lib/financas/formatacao";

const PALETA = ["#D9A24C", "#7FB894", "#9C8FD9", "#E08A8A", "#6BA3C7", "#C7A36B", "#8FA6D9"];

export function GraficoDespesasCategoria({
  dados,
}: {
  dados: { nome: string; valor: number }[];
}) {
  if (dados.length === 0) return null;

  return (
    <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="valor"
              nameKey="nome"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {dados.map((_, i) => (
                <Cell key={i} fill={PALETA[i % PALETA.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(valor: number) => formatarMoeda(valor)}
              contentStyle={{
                background: "#1F2127",
                border: "1px solid #2A2D35",
                borderRadius: 8,
                fontSize: 13,
                color: "#F2F0EA",
              }}
              labelStyle={{ color: "#F2F0EA" }}
              itemStyle={{ color: "#F2F0EA" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
        {dados.map((d, i) => (
          <div key={d.nome} className="flex items-center gap-2 text-xs">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: PALETA[i % PALETA.length] }}
            />
            <span className="text-ink-400 truncate flex-1">{d.nome}</span>
            <span className="font-mono shrink-0">{formatarMoeda(d.valor)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
