"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";

export function GraficoComparacaoMensal({
  dados,
}: {
  dados: { nome: string; valor: number; valorMesAnterior: number }[];
}) {
  const ocultos = useValoresOcultos();

  if (dados.length === 0) return null;

  return (
    <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ left: -20, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
            <XAxis
              dataKey="nome"
              tick={{ fill: "#9B9890", fontSize: 10 }}
              axisLine={{ stroke: "#2A2D35" }}
              tickLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={{ fill: "#9B9890", fontSize: 10 }} axisLine={false} tickLine={false} />
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
            <Legend wrapperStyle={{ fontSize: 12, color: "#9B9890" }} />
            <Bar dataKey="valorMesAnterior" name="Mês passado" fill="#5A5D66" radius={[4, 4, 0, 0]} />
            <Bar dataKey="valor" name="Este mês" fill="#D9A24C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
