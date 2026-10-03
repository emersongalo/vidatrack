"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";
import { classeFundoSuave } from "@/lib/agenda/estilo";
import { IconeCategoria } from "@/components/IconeCategoria";

const PALETA_PADRAO = ["#D9A24C", "#7FB894", "#9C8FD9", "#E08A8A", "#6BA3C7", "#C7A36B", "#8FA6D9"];
// Etapa 237 — tons de verde/azul pras receitas (o que entrou)
export const PALETA_RECEITAS = ["#4FBF8A", "#6BA3C7", "#8BD17C", "#3E9C9A", "#A3C76B", "#5C8FD9", "#7FD1B9"];

export function GraficoDespesasCategoria({
  dados,
  mapaCategoriaInfo,
  paleta = PALETA_PADRAO,
  semCaixa = false,
}: {
  /** Etapa 197 — href opcional: tocar na fatia/barra/legenda leva pro
   *  Extrato filtrado naquela categoria. */
  dados: { nome: string; valor: number; href?: string }[];
  /** Etapa 162 — opcional: quando informado, a legenda ganha o ícone
   *  e a cor reais da categoria (em vez da bolinha genérica da
   *  paleta) e uma coluna de porcentagem, inspirado no Despezzas. */
  mapaCategoriaInfo?: Map<string, any>;
  /** Etapa 237 — cores das fatias (receitas usam tons de verde) */
  paleta?: string[];
  /** Etapa 237 — sem o cartão em volta (quando vai dentro do carrossel) */
  semCaixa?: boolean;
}) {
  const PALETA = paleta;
  const ocultos = useValoresOcultos();
  const [tipoGrafico, setTipoGrafico] = useState<"pizza" | "coluna">("pizza");
  const totalDados = dados.reduce((s, d) => s + d.valor, 0);
  const router = useRouter();
  const clicavel = dados.some((d) => d.href);
  function abrir(i: number) {
    const href = dados[i]?.href;
    if (href) router.push(href);
  }

  if (dados.length === 0) return null;

  return (
    <div className={semCaixa ? "" : "bg-base-800 border border-base-600 rounded-3xl p-5"}>
      <div className="flex justify-end gap-1.5 mb-2">
        <button
          onClick={() => setTipoGrafico("pizza")}
          aria-label="Gráfico de pizza"
          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition ${
            tipoGrafico === "pizza" ? "border-ink-100 text-ink-100 bg-base-700" : "border-base-600 text-ink-400"
          }`}
        >
          <PieChartIcon size={14} strokeWidth={2} />
        </button>
        <button
          onClick={() => setTipoGrafico("coluna")}
          aria-label="Gráfico de colunas"
          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition ${
            tipoGrafico === "coluna" ? "border-ink-100 text-ink-100 bg-base-700" : "border-base-600 text-ink-400"
          }`}
        >
          <BarChart3 size={14} strokeWidth={2} />
        </button>
      </div>

      {tipoGrafico === "pizza" ? (
        <div className="h-60 relative">
          {/* Etapa 230 — rosca com o total no meio */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm text-ink-400">Total</span>
            <span className="text-xl font-mono font-semibold">{ocultos ? "R$ •••" : formatarMoeda(totalDados)}</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dados}
                dataKey="valor"
                nameKey="nome"
                innerRadius={68}
                outerRadius={96}
                paddingAngle={2}
                onClick={(_: unknown, i: number) => abrir(i)}
                cursor={clicavel ? "pointer" : undefined}
                style={{ filter: "drop-shadow(0 0 8px rgba(0,0,0,0.35))" }}
              >
                {dados.map((_, i) => (
                  <Cell
                    key={i}
                    fill={PALETA[i % PALETA.length]}
                    stroke="none"
                    style={{ filter: `drop-shadow(0 0 5px ${PALETA[i % PALETA.length]}80)` }}
                  />
                ))}
              </Pie>
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
                itemStyle={{ color: "#F2F0EA" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="nome"
                width={80}
                tick={{ fill: "#9B9890", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
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
                itemStyle={{ color: "#F2F0EA" }}
              />
              <Bar
                dataKey="valor"
                radius={[0, 4, 4, 0]}
                onClick={(_: unknown, i: number) => abrir(i)}
                cursor={clicavel ? "pointer" : undefined}
              >
                {dados.map((_, i) => (
                  <Cell key={i} fill={PALETA[i % PALETA.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Etapa 230 — legenda maior: ícone, nome, % e valor, com barra da proporção */}
      {clicavel && <p className="text-sm text-ink-400 mt-2 text-center">Toque numa categoria pra ver os lançamentos</p>}
      <div className="mt-3 divide-y divide-base-600">
        {dados.map((d, i) => {
          const percentual = totalDados > 0 ? (d.valor / totalDados) * 100 : 0;
          const cor = PALETA[i % PALETA.length];
          const info = mapaCategoriaInfo
            ? Array.from(mapaCategoriaInfo.values()).find((c: any) => c.nome === d.nome)
            : null;
          const conteudo = (
            <>
              <div className="flex items-center gap-3">
                {info ? (
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${classeFundoSuave(info.cor)}`}>
                    {info.icone ? <IconeCategoria icone={info.icone} /> : d.nome.charAt(0)}
                  </span>
                ) : (
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cor }} />
                )}
                <span className="text-base flex-1 min-w-0 truncate">{d.nome}</span>
                <span className="text-sm text-ink-400 shrink-0">{percentual.toFixed(0)}%</span>
                <span className="text-base font-mono font-semibold shrink-0">{ocultos ? "R$ •••" : formatarMoeda(d.valor)}</span>
                {d.href && <span className="text-ink-400 shrink-0">›</span>}
              </div>
              <div className="h-1.5 bg-base-700 rounded-full overflow-hidden mt-2 ml-12">
                <div className="h-full rounded-full" style={{ width: `${percentual}%`, backgroundColor: cor }} />
              </div>
            </>
          );
          return d.href ? (
            <Link key={d.nome} href={d.href} className="block py-3 hover:bg-base-700/40 transition -mx-2 px-2 rounded-lg">
              {conteudo}
            </Link>
          ) : (
            <div key={d.nome} className="py-3">
              {conteudo}
            </div>
          );
        })}
      </div>
    </div>
  );
}
