"use client";

import type { PontoMapaContribuicoes } from "@/lib/habitos/mapa-contribuicoes";

function corDoQuadrado(percentual: number | null): string {
  if (percentual === null) return "bg-base-800";
  if (percentual === 0) return "bg-base-700";
  if (percentual < 34) return "bg-habito/25";
  if (percentual < 67) return "bg-habito/50";
  if (percentual < 100) return "bg-habito/75";
  return "bg-habito";
}

export function MapaContribuicoes({ pontos }: { pontos: PontoMapaContribuicoes[] }) {
  // Agrupa em semanas (colunas), começando no domingo, igual o
  // calendário do GitHub — o primeiro ponto pode não cair num
  // domingo, então preenche o começo da primeira semana com
  // espaços vazios até alinhar.
  const primeiraData = new Date(pontos[0]?.data + "T00:00:00");
  const diaSemanaInicial = primeiraData.getDay();

  const celulas: (PontoMapaContribuicoes | null)[] = [
    ...Array(diaSemanaInicial).fill(null),
    ...pontos,
  ];

  const semanas: (PontoMapaContribuicoes | null)[][] = [];
  for (let i = 0; i < celulas.length; i += 7) {
    semanas.push(celulas.slice(i, i + 7));
  }

  // Etapa 230 — quadrados maiores, nome do mês em cima e começa mostrando o fim (hoje)
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const rotulos = semanas.map((semana, i) => {
    const primeiro = semana.find((p) => p)?.data;
    if (!primeiro) return "";
    const mes = Number(primeiro.slice(5, 7)) - 1;
    const anterior = i > 0 ? semanas[i - 1].find((p) => p)?.data : null;
    return !anterior || Number(anterior.slice(5, 7)) - 1 !== mes ? MESES[mes] : "";
  });
  return (
    <div
      className="overflow-x-auto pb-2"
      ref={(el) => {
        if (el && !el.dataset.rolado) {
          el.scrollLeft = el.scrollWidth;
          el.dataset.rolado = "1";
        }
      }}
    >
      <div className="flex gap-1 mb-1" style={{ minWidth: `${semanas.length * 18}px` }}>
        {rotulos.map((r, i) => (
          <span key={i} className="w-3.5 text-xs text-ink-400 overflow-visible whitespace-nowrap">
            {r}
          </span>
        ))}
      </div>
      <div className="flex gap-1" style={{ minWidth: `${semanas.length * 18}px` }}>
        {semanas.map((semana, i) => (
          <div key={i} className="flex flex-col gap-1">
            {semana.map((ponto, j) => (
              <div
                key={j}
                title={ponto ? `${new Date(ponto.data + "T00:00:00").toLocaleDateString("pt-BR")} — ${ponto.percentual ?? "sem hábitos"}${ponto.percentual !== null ? "%" : ""}` : ""}
                className={`w-3.5 h-3.5 rounded ${ponto ? corDoQuadrado(ponto.percentual) : "opacity-0"}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-xs text-ink-400">
        Menos
        <span className="w-3 h-3 rounded bg-base-700" />
        <span className="w-3 h-3 rounded bg-habito/25" />
        <span className="w-3 h-3 rounded bg-habito/50" />
        <span className="w-3 h-3 rounded bg-habito/75" />
        <span className="w-3 h-3 rounded bg-habito" />
        Mais
      </div>
    </div>
  );
}
