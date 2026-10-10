"use client";

// Etapa 282 — timer embutido no hábito de minutos (ex: "Ler 20 min").
// Tela cheia com um anel que enche até a meta do dia. Ao parar, os
// minutos contados entram sozinhos no contador do hábito.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Pause, Play, Check } from "lucide-react";
import { gravarTimer, lerTimer, minutosParaLancar, segundosContados, type TimerSalvo } from "@/lib/habitos/timerHabito";
import { IconeHabito } from "@/components/IconeHabito";
import { chuvaDeConfete } from "@/lib/app/festa";
import { vibrar } from "@/lib/app/vibrar";

function tocarSino() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.25, 0.5].forEach((t, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = [784, 988, 1319][i];
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.6);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.7);
    });
  } catch {
    /* sem som */
  }
}

function mmss(seg: number) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TimerHabito({
  habito,
  dataISO,
  faltamMin,
  cor,
  aoLancar,
  aoFechar,
}: {
  habito: { id: string; titulo: string; icone: string };
  dataISO: string;
  /** minutos que ainda faltam pra meta do dia (0 = já bateu) */
  faltamMin: number;
  cor: string;
  aoLancar: (minutos: number) => void;
  aoFechar: () => void;
}) {
  const [timer, setTimer] = useState<TimerSalvo>(() => {
    const salvo = lerTimer(habito.id);
    if (salvo && salvo.data === dataISO) return salvo;
    const novo = { habitoId: habito.id, data: dataISO, desde: Date.now(), acumulado: 0 };
    gravarTimer(novo);
    return novo;
  });
  const [agora, setAgora] = useState(() => Date.now());
  const avisou = useRef(false);
  const wake = useRef<any>(null);

  useEffect(() => {
    const i = setInterval(() => setAgora(Date.now()), 500);
    // tela acesa enquanto conta (quando o aparelho deixa)
    (navigator as any).wakeLock
      ?.request?.("screen")
      .then((w: any) => (wake.current = w))
      .catch(() => {});
    return () => {
      clearInterval(i);
      wake.current?.release?.().catch?.(() => {});
    };
  }, []);

  const seg = segundosContados(timer, agora);
  const alvoSeg = Math.max(60, faltamMin * 60);
  const frac = Math.min(1, seg / alvoSeg);
  const bateu = faltamMin > 0 && seg >= faltamMin * 60;

  useEffect(() => {
    if (bateu && !avisou.current) {
      avisou.current = true;
      tocarSino();
      vibrar([30, 60, 30, 60, 60]);
      chuvaDeConfete({ quantidade: 40 });
    }
  }, [bateu]);

  function pausarOuSeguir() {
    const novo: TimerSalvo = timer.desde
      ? { ...timer, acumulado: segundosContados(timer, Date.now()), desde: null }
      : { ...timer, desde: Date.now() };
    setTimer(novo);
    gravarTimer(novo);
    vibrar(10);
  }

  function terminar() {
    const min = minutosParaLancar(segundosContados(timer, Date.now()));
    gravarTimer(null);
    if (min > 0) aoLancar(min);
    aoFechar();
  }

  function descartar() {
    gravarTimer(null);
    aoFechar();
  }

  const R = 110;
  const C = 2 * Math.PI * R;
  const min = minutosParaLancar(seg);

  return createPortal(
    <div className="fixed inset-0 z-[80] bg-base-900/95 backdrop-blur-sm flex flex-col items-center justify-center px-6 animate-surgir" role="dialog" aria-label={`Timer de ${habito.titulo}`}>
      <button type="button" onClick={descartar} aria-label="Fechar sem lançar" className="absolute top-5 right-5 w-10 h-10 rounded-full border border-base-600 flex items-center justify-center text-ink-400">
        <X size={18} />
      </button>

      <div className="flex items-center gap-2 mb-6 text-ink-400">
        <IconeHabito icone={habito.icone} tamanho={18} />
        <span className="text-base font-medium text-ink-100 truncate max-w-[16rem]">{habito.titulo}</span>
      </div>

      <div className="relative" style={{ width: 260, height: 260 }}>
        <svg viewBox="0 0 260 260" className="w-full h-full -rotate-90">
          <circle cx="130" cy="130" r={R} fill="none" strokeWidth="12" className="stroke-base-700" />
          <circle
            cx="130"
            cy="130"
            r={R}
            fill="none"
            stroke={cor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - frac)}
            style={{ transition: "stroke-dashoffset 500ms linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className={`text-5xl font-mono font-semibold tabular-nums ${timer.desde ? "" : "opacity-60"}`}>{mmss(seg)}</p>
          <p className="text-sm text-ink-400 mt-2">
            {bateu ? "Meta do dia batida! 🎯" : faltamMin > 0 ? `meta: ${faltamMin} min` : "meta já batida — conta extra"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-10">
        <button
          type="button"
          onClick={pausarOuSeguir}
          aria-label={timer.desde ? "Pausar" : "Continuar"}
          className="w-16 h-16 rounded-full border border-base-600 flex items-center justify-center hover:border-ink-400 transition active:scale-95"
        >
          {timer.desde ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          type="button"
          onClick={terminar}
          className="h-16 rounded-full px-7 flex items-center gap-2 font-semibold text-base-900 transition active:scale-95"
          style={{ background: cor }}
        >
          <Check size={20} /> {min > 0 ? `Lançar ${min} min` : "Parar"}
        </button>
      </div>
      <p className="text-xs text-ink-400 mt-6 text-center max-w-xs">Pode sair da tela: a contagem continua. Os minutos entram no hábito quando você tocar em Lançar.</p>
    </div>,
    document.body
  );
}
