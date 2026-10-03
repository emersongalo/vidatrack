"use client";

// Etapa 245 — no celular: toque num horário vazio cria um bloco ali (abre
// o editor) e dá pra rolar a grade normalmente. No computador, arrastar
// com o mouse continua criando o bloco do tamanho arrastado.
// Etapa 246 — no celular o editor abria no "soltar o dedo" e o clique que
// vem logo depois caía no fundo escuro do editor, fechando na hora. Agora o
// toque abre pelo onClick (que já é o fim do toque) e o arrasto é só mouse.
import { useEffect, useRef, useState } from "react";
import { BlocoTempo, Bloco } from "./BlocoTempo";
import {
  HORA_INICIO_GRADE,
  HORA_FIM_GRADE,
  ALTURA_TOTAL_GRADE,
  minutosDoDiaParaY,
  yParaMinutosDoDia,
  arredondarPara15Min,
  minutosParaHora,
  horarioAtualEmMinutos,
} from "@/lib/planejador/tempo";
import type { RascunhoBloco } from "./EditorBloco";

const HORAS = Array.from({ length: HORA_FIM_GRADE - HORA_INICIO_GRADE + 1 }, (_, i) => HORA_INICIO_GRADE + i);

export function GradeDia({
  blocos,
  ehHoje,
  aoAbrir,
  aoMudar,
}: {
  blocos: Bloco[];
  dataISO: string;
  ehHoje: boolean;
  aoAbrir: (r: RascunhoBloco) => void;
  aoMudar: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [criando, setCriando] = useState<{ y1: number; y2: number } | null>(null);
  const [minutoAgora, setMinutoAgora] = useState(horarioAtualEmMinutos());
  const inicio = useRef<{ y: number; tipo: string } | null>(null);
  const [marcado, setMarcado] = useState<number | null>(null);

  useEffect(() => {
    const intervalo = setInterval(() => setMinutoAgora(horarioAtualEmMinutos()), 60000);
    return () => clearInterval(intervalo);
  }, []);

  // abre a grade perto da hora atual
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const alvo = Math.max(0, minutosDoDiaParaY(Math.max(HORA_INICIO_GRADE * 60, horarioAtualEmMinutos() - 60)));
    const topo = el.getBoundingClientRect().top + window.scrollY + alvo - 120;
    window.scrollTo({ top: topo, behavior: "smooth" });
  }, []);

  const yRel = (clientY: number) => clientY - (containerRef.current?.getBoundingClientRect().top ?? 0);

  const ignorarClique = useRef(false);

  function horarioDoToque(y: number, termina?: number): RascunhoBloco {
    const comeca = arredondarPara15Min(yParaMinutosDoDia(y) - 7);
    const fim = termina ?? comeca + 60;
    return { titulo: "", inicio: minutosParaHora(comeca), fim: minutosParaHora(Math.min(24 * 60, fim)), cor: "habito" };
  }

  function ehAreaVazia(alvo: EventTarget | null) {
    const el = alvo as HTMLElement | null;
    return !!el && (el === containerRef.current || el.dataset?.linha === "1");
  }

  // computador: arrastar com o mouse desenha o bloco
  function aoTocar(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || e.button !== 0 || !ehAreaVazia(e.target)) return;
    const y = yRel(e.clientY);
    inicio.current = { y, tipo: "mouse" };
    setCriando({ y1: y, y2: y });
  }

  function aoMover(e: React.PointerEvent) {
    if (!inicio.current) return;
    setCriando({ y1: inicio.current.y, y2: yRel(e.clientY) });
  }

  function aoSoltar(e: React.PointerEvent) {
    const i = inicio.current;
    inicio.current = null;
    setCriando(null);
    if (!i) return;
    const yFim = yRel(e.clientY);
    if (Math.abs(yFim - i.y) <= 10) return; // foi só um clique: o onClick cuida
    ignorarClique.current = true;
    setTimeout(() => (ignorarClique.current = false), 400);
    const y1 = Math.min(i.y, yFim);
    const y2 = Math.max(i.y, yFim);
    const comeca = arredondarPara15Min(yParaMinutosDoDia(y1));
    const termina = Math.max(comeca + 15, arredondarPara15Min(yParaMinutosDoDia(y2)));
    aoAbrir({ titulo: "", inicio: minutosParaHora(comeca), fim: minutosParaHora(Math.min(24 * 60, termina)), cor: "habito" });
  }

  // toque (celular) ou clique simples: abre o editor naquele horário
  function aoClicar(e: React.MouseEvent) {
    if (ignorarClique.current || !ehAreaVazia(e.target)) return;
    const y = yRel(e.clientY);
    setMarcado(y);
    setTimeout(() => setMarcado(null), 500);
    aoAbrir(horarioDoToque(y));
  }

  return (
    <div className="relative border border-base-600 rounded-3xl overflow-hidden">
      <div className="flex">
        <div className="w-14 shrink-0 relative bg-base-900" style={{ height: ALTURA_TOTAL_GRADE }}>
          {HORAS.map((h) => (
            <div key={h} className="absolute left-0 right-0 text-xs text-ink-400 -translate-y-1/2 text-right pr-2" style={{ top: minutosDoDiaParaY(h * 60) }}>
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div
          ref={containerRef}
          className="relative flex-1 bg-base-800 cursor-crosshair touch-pan-y"
          style={{ height: ALTURA_TOTAL_GRADE }}
          onPointerDown={aoTocar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onClick={aoClicar}
          onPointerCancel={() => {
            inicio.current = null;
            setCriando(null);
          }}
        >
          {HORAS.map((h) => (
            <div key={h} data-linha="1" className="absolute left-0 right-0 border-t border-base-600" style={{ top: minutosDoDiaParaY(h * 60) }} />
          ))}

          {ehHoje && minutoAgora >= HORA_INICIO_GRADE * 60 && minutoAgora <= HORA_FIM_GRADE * 60 && (
            <div className="absolute left-0 right-0 h-0.5 bg-red-400 z-10 pointer-events-none" style={{ top: minutosDoDiaParaY(minutoAgora) }}>
              <span className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-400" />
            </div>
          )}

          {marcado !== null && (
            <div
              className="absolute left-1 right-1 h-12 rounded-xl bg-habito/25 pointer-events-none animate-pulse"
              style={{ top: minutosDoDiaParaY(arredondarPara15Min(yParaMinutosDoDia(marcado) - 7)) }}
            />
          )}

          {criando && (
            <div
              className="absolute left-1 right-1 rounded-xl border-2 border-dashed border-ink-400 bg-ink-100/10 pointer-events-none"
              style={{ top: Math.min(criando.y1, criando.y2), height: Math.abs(criando.y2 - criando.y1) }}
            />
          )}

          {blocos.map((bloco) => (
            <BlocoTempo
              key={bloco.id}
              bloco={bloco}
              aoMudar={aoMudar}
              aoAbrir={(b) => aoAbrir({ id: b.id, titulo: b.titulo, inicio: b.hora_inicio, fim: b.hora_fim, cor: b.cor })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
