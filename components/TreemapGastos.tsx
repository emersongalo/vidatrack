"use client";

import { useRouter } from "next/navigation";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { formatarMoeda } from "@/lib/financas/formatacao";

const PALETA = ["#D9A24C", "#7FB894", "#9C8FD9", "#E08A8A", "#6BA3C7", "#C7A36B", "#8FA6D9", "#B694C4"];

function ConteudoCelula(props: any) {
  const { x, y, width, height, index, name, value, href, aoAbrir } = props;
  if (width < 2 || height < 2) return null;
  const cor = PALETA[index % PALETA.length];
  const mostrarTexto = width > 70 && height > 40;

  return (
    <g onClick={href && aoAbrir ? () => aoAbrir(href) : undefined} style={{ cursor: href ? "pointer" : undefined }}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{ fill: cor, stroke: "#0F1013", strokeWidth: 2 }}
      />
      {mostrarTexto && (
        <>
          <text x={x + 10} y={y + 22} fill="#0F1013" fontSize={13} fontWeight={600}>
            {name}
          </text>
          <text x={x + 10} y={y + 40} fill="#0F1013" fontSize={12} opacity={0.75}>
            {formatarMoeda(value)}
          </text>
        </>
      )}
    </g>
  );
}

export function TreemapGastos({ dados }: { dados: { nome: string; valor: number; href?: string }[] }) {
  const router = useRouter();
  if (dados.length === 0) return null;

  // Etapa 197 — tocar num bloco abre o Extrato só daquela categoria
  const dadosFormatados = dados.map((d) => ({ name: d.nome, value: d.valor, href: d.href }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={dadosFormatados}
          dataKey="value"
          content={<ConteudoCelula aoAbrir={(href: string) => router.push(href)} />}
          animationDuration={400}
        >
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
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
