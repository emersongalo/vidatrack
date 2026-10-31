"use client";

// Etapa 368 — rosca grossa de categorias: cada fatia com o ícone da
// categoria, o total no meio "contando" e a rosca se desenhando ao
// abrir. Tocar na fatia (ou na legenda) abre o Extrato da categoria.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";
import { classeFundoSuave } from "@/lib/agenda/estilo";
import { IconeCategoria } from "@/components/IconeCategoria";
import { agruparFatias, calcularFatias, pontoNoAnel } from "@/lib/financas/rosca";
import { semAnimacao, useContagem } from "@/lib/app/useContagem";

export const PALETA_DESPESAS = ["#D9A24C", "#E0708F", "#8B6FE0", "#4F9BE8", "#3FB8A0", "#E89A4F", "#9C8FD9"];
export const PALETA_RECEITAS = ["#4FBF8A", "#6BA3C7", "#8BD17C", "#3E9C9A", "#A3C76B", "#5C8FD9", "#7FD1B9"];

type Dado = { nome: string; valor: number; href?: string };

const TAM = 240; // viewBox
const RAIO = 92;
const ESPESSURA = 34;
const VOLTA = 2 * Math.PI * RAIO;
const FOLGA = 6; // espaço entre as fatias (px no viewBox)

export function RoscaCategorias({
  dados,
  mapaCategoriaInfo,
  paleta = PALETA_DESPESAS,
  rotuloTotal = "Total",
}: {
  dados: Dado[];
  mapaCategoriaInfo?: Map<string, any>;
  paleta?: string[];
  rotuloTotal?: string;
}) {
  const ocultos = useValoresOcultos();
  const router = useRouter();
  const [desenhada, setDesenhada] = useState(false);
  const [destaque, setDestaque] = useState<number | null>(null);

  const infoPorNome = useMemo(() => {
    const m = new Map<string, any>();
    Array.from(mapaCategoriaInfo?.values() ?? []).forEach((c: any) => m.set(c.nome, c));
    return m;
  }, [mapaCategoriaInfo]);

  const agrupados = useMemo(() => agruparFatias(dados, 6) as Dado[], [dados]);
  const fatias = useMemo(() => calcularFatias(agrupados), [agrupados]);
  const total = agrupados.reduce((s, d) => s + d.valor, 0);
  const totalAnimado = useContagem(total);
  const chaveDados = agrupados.map((d) => `${d.nome}:${d.valor}`).join("|");

  // redesenha quando muda o mês/os dados
  useEffect(() => {
    if (semAnimacao()) return setDesenhada(true);
    setDesenhada(false);
    const q = requestAnimationFrame(() => requestAnimationFrame(() => setDesenhada(true)));
    return () => cancelAnimationFrame(q);
  }, [chaveDados]);

  if (!fatias.length) return null;
  const cor = (i: number) => paleta[i % paleta.length];

  return (
    <div>
      <div className="relative mx-auto w-full max-w-[280px] aspect-square">
        <svg viewBox={`0 0 ${TAM} ${TAM}`} className="w-full h-full -rotate-90 overflow-visible" role="img" aria-label="Gastos por categoria">
          {/* trilho de fundo */}
          <circle cx={TAM / 2} cy={TAM / 2} r={RAIO} fill="none" className="stroke-base-700/60" strokeWidth={ESPESSURA} />
          {fatias.map((f) => {
            const sozinha = fatias.length === 1;
            const comprimento = sozinha ? VOLTA : Math.max(0.01, f.fracao * VOLTA - FOLGA - ESPESSURA);
            const deslocamento = -(f.inicio * VOLTA + (sozinha ? 0 : (FOLGA + ESPESSURA) / 2));
            const clicavel = !!(f.item as Dado).href;
            return (
              <circle
                key={f.item.nome}
                cx={TAM / 2}
                cy={TAM / 2}
                r={RAIO}
                fill="none"
                stroke={cor(f.indice)}
                strokeWidth={destaque === f.indice ? ESPESSURA + 6 : ESPESSURA}
                strokeLinecap={sozinha ? "butt" : "round"}
                strokeDasharray={`${desenhada ? comprimento : 0} ${VOLTA}`}
                strokeDashoffset={deslocamento}
                onClick={() => clicavel && router.push((f.item as Dado).href!)}
                onPointerEnter={() => setDestaque(f.indice)}
                onPointerLeave={() => setDestaque(null)}
                style={{
                  transition: `stroke-dasharray 700ms cubic-bezier(.2,.8,.2,1) ${f.indice * 90}ms, stroke-width 200ms`,
                  cursor: clicavel ? "pointer" : undefined,
                  filter: `drop-shadow(0 0 6px ${cor(f.indice)}55)`,
                }}
              />
            );
          })}
        </svg>

        {/* ícone de cada categoria em cima da fatia */}
        {fatias.map((f) => {
          if (f.fracao < 0.06) return null; // fatia fina demais pro ícone
          const info = infoPorNome.get(f.item.nome);
          const p = pontoNoAnel(f.meio, RAIO / (TAM / 2));
          return (
            <span
              key={f.item.nome}
              aria-hidden
              className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/25 text-white flex items-center justify-center pointer-events-none"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                opacity: desenhada ? 1 : 0,
                transform: `translate(-50%, -50%) scale(${desenhada ? 1 : 0.4})`,
                transition: `opacity 300ms ease ${450 + f.indice * 90}ms, transform 400ms cubic-bezier(.3,1.6,.5,1) ${450 + f.indice * 90}ms`,
              }}
            >
              {info?.icone ? <IconeCategoria icone={info.icone} tamanho={14} /> : <span className="text-xs font-semibold">{f.item.nome.charAt(0)}</span>}
            </span>
          );
        })}

        {/* total no meio */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {destaque !== null ? (
            <>
              <span className="text-sm text-ink-400 truncate max-w-[60%]">{fatias[destaque]?.item.nome}</span>
              <span className="text-2xl font-mono font-semibold">
                {ocultos ? "R$ •••" : formatarMoeda(fatias[destaque]?.item.valor ?? 0)}
              </span>
              <span className="text-xs text-ink-400">{Math.round((fatias[destaque]?.fracao ?? 0) * 100)}%</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-mono font-semibold">{ocultos ? "R$ •••" : formatarMoeda(totalAnimado)}</span>
              <span className="text-sm text-ink-400">{rotuloTotal}</span>
            </>
          )}
        </div>
      </div>

      {/* legenda: ícone, nome, %, valor e barrinha */}
      <div className="mt-4 divide-y divide-base-600">
        {[...dados]
          .sort((a, b) => b.valor - a.valor)
          .map((d, i) => {
            const percentual = total > 0 ? (d.valor / total) * 100 : 0;
            const indiceFatia = fatias.findIndex((f) => f.item.nome === d.nome);
            const corLinha = cor(indiceFatia >= 0 ? indiceFatia : fatias.length - 1);
            const info = infoPorNome.get(d.nome);
            const conteudo = (
              <>
                <div className="flex items-center gap-3">
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${info ? classeFundoSuave(info.cor) : ""}`}
                    style={info ? undefined : { backgroundColor: `${corLinha}33`, color: corLinha }}
                  >
                    {info?.icone ? <IconeCategoria icone={info.icone} /> : d.nome.charAt(0)}
                  </span>
                  <span className="text-base flex-1 min-w-0 truncate">{d.nome}</span>
                  <span className="text-sm text-ink-400 shrink-0">{percentual.toFixed(0)}%</span>
                  <span className="text-base font-mono font-semibold shrink-0">{ocultos ? "R$ •••" : formatarMoeda(d.valor)}</span>
                  {d.href && <span className="text-ink-400 shrink-0">›</span>}
                </div>
                <div className="h-1.5 bg-base-700 rounded-full overflow-hidden mt-2 ml-12">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: desenhada ? `${percentual}%` : "0%",
                      backgroundColor: corLinha,
                      transition: `width 700ms cubic-bezier(.2,.8,.2,1) ${200 + i * 60}ms`,
                    }}
                  />
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
