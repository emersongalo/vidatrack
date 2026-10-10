"use client";

// Etapa 233 — faixa embaixo de um hábito compartilhado na tela Hoje:
// carinha do dia, quem já fez, sequência juntos, cutucar e reagir.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CarinhaDupla } from "@/components/CarinhaDupla";
import { PlantaDupla } from "@/components/PlantaDupla";
import { ChuvaEmoji } from "@/components/ToqueDuplo";
import { avisarDupla } from "@/lib/habitos/avisarDupla";
import { fraseDoHumor, REACOES, type InfoDupla } from "@/lib/habitos/dupla";

function lerMarca(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}
function gravarMarca(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {}
}

export function FaixaDupla({ habitoId, dupla, dataISO, ehHoje }: { habitoId: string; dupla: InfoDupla; dataISO: string; ehHoje: boolean }) {
  const chaveCutucar = `vidatrack-cutucou-${habitoId}-${dataISO}`;
  const chaveReacao = `vidatrack-reagiu-${habitoId}-${dataISO}`;
  const [cutucou, setCutucou] = useState(false);
  const [reacao, setReacao] = useState<string | null>(null);
  const [escolhendo, setEscolhendo] = useState(false);
  const [chuva, setChuva] = useState<string | null>(null);
  const [tremendo, setTremendo] = useState(false);

  useEffect(() => {
    setCutucou(!!lerMarca(chaveCutucar));
    setReacao(lerMarca(chaveReacao));
  }, [chaveCutucar, chaveReacao]);

  // Etapa 286 — quando o parceiro marca com a tela aberta: toquinho + coração
  const antes = useRef<Map<string, boolean> | null>(null);
  const [recemFeito, setRecemFeito] = useState<Set<string>>(new Set());
  useEffect(() => {
    const atual = new Map(dupla.parceiros.map((p) => [p.id, p.feito]));
    const ant = antes.current;
    antes.current = atual;
    if (!ant || !ehHoje) return;
    const novos = dupla.parceiros.filter((p) => p.feito && ant.get(p.id) === false).map((p) => p.id);
    if (!novos.length) return;
    setRecemFeito(new Set(novos));
    try {
      (navigator as any).vibrate?.([10, 40, 10]);
    } catch {}
    setTimeout(() => setRecemFeito(new Set()), 1600);
  }, [dupla.parceiros, ehHoje]);

  const nomes = dupla.parceiros.map((p) => p.nome);
  const faltaAlguem = dupla.parceiros.some((p) => !p.feito);
  const alguemFez = dupla.parceiros.some((p) => p.feito);

  async function cutucar() {
    setTremendo(true);
    setCutucou(true);
    gravarMarca(chaveCutucar, "1");
    try {
      (navigator as any).vibrate?.([15, 30, 15]);
    } catch {}
    setTimeout(() => setTremendo(false), 1600);
    await avisarDupla("cutucar", habitoId);
  }

  async function reagir(emoji: string) {
    setEscolhendo(false);
    setReacao(emoji);
    gravarMarca(chaveReacao, emoji);
    setChuva(emoji);
    await avisarDupla("reacao", habitoId, { emoji });
  }

  return (
    <div className="bg-base-800 pl-4 pr-3 pb-3 -mt-1">
      {chuva && <ChuvaEmoji emoji={chuva} aoFechar={() => setChuva(null)} />}
      <div className="flex items-center gap-3 rounded-2xl bg-base-900/60 border border-base-600 px-3 py-2">
        <CarinhaDupla humor={dupla.humor} tamanho={36} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fraseDoHumor(dupla.humor, nomes)}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${dupla.euFiz ? "bg-habito/15 text-habito" : "bg-base-700 text-ink-400"}`}>
              {dupla.euFiz ? "✓" : "○"} Você
            </span>
            {dupla.parceiros.map((p) => (
              <span
                key={p.id}
                className={`relative text-xs px-1.5 py-0.5 rounded-full ${p.feito ? "bg-habito/15 text-habito" : "bg-base-700 text-ink-400"} ${
                  recemFeito.has(p.id) ? "animate-quicar" : ""
                }`}
              >
                {p.feito ? "✓" : "○"} {p.nome}
                {recemFeito.has(p.id) && (
                  <span className="coracao-subir text-base" aria-hidden>
                    💚
                  </span>
                )}
              </span>
            ))}
            {dupla.sequencia > 0 && <span className="text-xs text-ink-400">🔥 {dupla.sequencia} juntos</span>}
          </div>
        </div>

        {ehHoje && faltaAlguem && (
          <button
            type="button"
            onClick={cutucar}
            disabled={cutucou}
            className={`shrink-0 text-sm rounded-xl px-2.5 py-1.5 border transition ${
              cutucou ? "border-base-600 text-ink-400" : "border-nota/50 text-nota hover:bg-nota/10"
            }`}
          >
            <span className={`inline-block ${tremendo ? "animate-tremer" : ""}`}>👉</span> {cutucou ? "Cutucado" : "Cutucar"}
          </button>
        )}
        {ehHoje && !faltaAlguem && alguemFez && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setEscolhendo((v) => !v)}
              aria-label="Reagir"
              className={`text-xl w-10 h-10 rounded-xl border flex items-center justify-center transition ${
                reacao ? "border-habito/50 bg-habito/10" : "border-base-600 hover:border-ink-400"
              }`}
            >
              {reacao ?? "😊"}
            </button>
            {escolhendo && (
              <div className="animate-surgir absolute right-0 bottom-12 z-20 flex gap-1 bg-base-800 border border-base-600 rounded-2xl p-1.5 shadow-xl">
                {REACOES.map((e) => (
                  <button key={e} type="button" onClick={() => reagir(e)} className="text-2xl w-10 h-10 rounded-xl hover:bg-base-700 active:scale-90 transition">
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Link href={`/habitos/juntos#${habitoId}`} aria-label="Ver o jardim da dupla" className="shrink-0 -my-1">
          <PlantaDupla estagio={dupla.estagio} saude={dupla.saude} tamanho={30} />
        </Link>
      </div>
    </div>
  );
}
