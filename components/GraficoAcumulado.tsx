"use client";

import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { formatarMoeda } from "@/lib/financas/formatacao";

/**
 * Etapa 170 — quando `dadosMesAnterior` é passado, sobrepõe uma
 * linha tracejada com o ritmo do mês passado no mesmo eixo de dias,
 * pra comparar visualmente — inspirado no "Ritmo de gasto" do
 * Despezzas.
 */
export function GraficoAcumulado({
  dados,
  dadosMesAnterior,
}: {
  dados: { dia: number; acumulado: number }[];
  dadosMesAnterior?: { dia: number; acumulado: number }[];
}) {
  if (dados.length === 0) return null;

  // Junta os dois pelo dia, pra virar UMA lista só (o jeito que o
  // recharts espera pra desenhar duas linhas no mesmo gráfico).
  const mapaAnterior = new Map((dadosMesAnterior ?? []).map((d) => [d.dia, d.acumulado]));
  const totalDias = Math.max(dados.length, dadosMesAnterior?.length ?? 0);
  const dadosCombinados = Array.from({ length: totalDias }, (_, i) => {
    const dia = i + 1;
    const pontoAtual = dados.find((d) => d.dia === dia);
    return {
      dia,
      acumulado: pontoAtual?.acumulado,
      acumuladoAnterior: mapaAnterior.get(dia),
    };
  });

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dadosCombinados} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
            interval={Math.max(1, Math.floor(dadosCombinados.length / 8))}
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
            labelStyle={{ color: "#F2F0EA" }}
            itemStyle={{ color: "#F2F0EA" }}
          />
          {dadosMesAnterior && dadosMesAnterior.length > 0 && (
            <Legend
              formatter={(valor) => (valor === "acumulado" ? "Este mês" : "Mês passado")}
              wrapperStyle={{ fontSize: 11, color: "#9B9CA6" }}
            />
          )}
          <Area
            type="monotone"
            dataKey="acumulado"
            name="acumulado"
            stroke="#D9A24C"
            strokeWidth={2.5}
            fill="url(#gradienteAcumulado)"
            connectNulls
            animationDuration={600}
          />
          {dadosMesAnterior && dadosMesAnterior.length > 0 && (
            <Line
              type="monotone"
              dataKey="acumuladoAnterior"
              name="acumuladoAnterior"
              stroke="#6B6D76"
              strokeWidth={1.75}
              strokeDasharray="4 4"
              dot={false}
              connectNulls
              animationDuration={600}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
