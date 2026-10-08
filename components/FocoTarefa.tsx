"use client";

// Etapa 275 — modo foco numa tarefa: tela cheia só com ela, um timer
// (15/25/45 min), o checklist à mão e o "Concluí!" no fim. A contagem
// usa a hora de término, então continua certa se sair da tela.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Pause, Play, Plus, Check } from "lucide-react";
import { CheckboxSubtarefa } from "@/components/CheckboxSubtarefa";
import { alternarConclusaoTarefa } from "@/app/habitos/tarefas/actions";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { chuvaDeConfete } from "@/lib/app/festa";
import { vibrar } from "@/lib/app/vibrar";

const CHAVE = "vt-foco-tarefa";
const OPCOES = [15, 25, 45];
const COR = "#9C8FD9";

type Salvo = { tarefaId: string; total: number; fimEm: number | null; restante: number | null };

function lerSalvo(tarefaId: string): Salvo | null {
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE) ?? "null") as Salvo | null;
    return s && s.tarefaId === tarefaId ? s : null;
  } catch {
    return null;
  }
}
function gravar(s: Salvo | null) {
  try {
    if (s) localStorage.setItem(CHAVE, JSON.stringify(s));
    else localStorage.removeItem(CHAVE);
  } catch {
    /* sem armazenamento */
  }
}

function tocarSino() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.25, 0.5].forEach((t, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = [880, 1175, 1568][i];
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

export function FocoTarefa({
  tarefa,
  aoFechar,
}: {
  tarefa: { id: string; titulo: string; concluida?: boolean; repetir?: string; subtarefas?: { id: string; texto: string; feita: boolean }[] };
  aoFechar: () => void;
}) {
  const [salvo, setSalvo] = useState<Salvo | null>(null);
  const [agora, setAgora] = useState(() => Date.now());
  const [acabou, setAcabou] = useState(false);
  const [concluida, setConcluida] = useState(false);
  const [subs, setSubs] = useState(tarefa.subtarefas ?? []);
  const avisou = useRef(false);
  const wake = useRef<any>(null);

  useEffect(() => {
    setSalvo(lerSalvo(tarefa.id));
  }, [tarefa.id]);

  const total = salvo?.total ?? 25 * 60;
  const restante = salvo
    ? salvo.fimEm !== null
      ? Math.max(0, Math.ceil((salvo.fimEm - agora) / 1000))
      : salvo.restante ?? salvo.total
    : total;
  const rodando = !!salvo && salvo.fimEm !== null && restante > 0;

  // relógio
  useEffect(() => {
    if (!rodando) return;
    const i = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(i);
  }, [rodando]);

  // fim do tempo
  useEffect(() => {
    if (salvo?.fimEm && restante === 0 && !avisou.current) {
      avisou.current = true;
      setAcabou(true);
      tocarSino();
      vibrar([200, 100, 200, 100, 300]);
    }
  }, [salvo, restante]);

  // tela acesa enquanto conta
  useEffect(() => {
    if (!rodando) {
      wake.current?.release?.().catch?.(() => {});
      wake.current = null;
      return;
    }
    (navigator as any).wakeLock?.request("screen").then((w: any) => (wake.current = w)).catch(() => {});
    return () => {
      wake.current?.release?.().catch?.(() => {});
    };
  }, [rodando]);

  // botão voltar do Android / Esc fecha
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  function atualizar(s: Salvo | null) {
    setSalvo(s);
    gravar(s);
    setAgora(Date.now());
  }

  function comecar(minutos?: number) {
    avisou.current = false;
    setAcabou(false);
    const seg = minutos ? minutos * 60 : restante || total;
    atualizar({ tarefaId: tarefa.id, total: minutos ? minutos * 60 : total, fimEm: Date.now() + seg * 1000, restante: null });
    vibrar(10);
  }
  function pausar() {
    if (!salvo) return;
    atualizar({ ...salvo, fimEm: null, restante });
  }
  function maisCinco() {
    avisou.current = false;
    setAcabou(false);
    atualizar({ tarefaId: tarefa.id, total: total + 300, fimEm: Date.now() + 300 * 1000, restante: null });
  }

  async function concluir() {
    setConcluida(true);
    vibrar([15, 40, 25]);
    chuvaDeConfete({ quantidade: 80 });
    atualizar(null);
    try {
      // tarefa única já concluída: não desmarca sem querer
      if (!(tarefa.repetir === "nenhuma" && tarefa.concluida)) await alternarConclusaoTarefa(tarefa.id, hojeISO());
      void atualizarSnapshotEmTodasAsTelas();
    } catch {
      /* fica na fila da próxima sincronização da tela */
    }
    setTimeout(aoFechar, 2200);
  }

  const r = 88;
  const volta = 2 * Math.PI * r;
  const pct = total ? restante / total : 1;
  const feitasSubs = subs.filter((s) => s.feita).length;

  if (typeof document === "undefined") return null;
  // portal: fica por cima de tudo, mesmo dentro de telas com animação
  return createPortal(
    <div className="fixed inset-0 z-[80] bg-base-900 flex flex-col animate-folha" role="dialog" aria-label="Modo foco">
      <div className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <span className="text-sm text-ink-400">🎯 Modo foco</span>
        <button type="button" onClick={aoFechar} aria-label="Fechar" className="w-10 h-10 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-800 transition">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <h2 className="text-2xl font-display font-bold text-center mt-2 break-words">{tarefa.titulo}</h2>

        {concluida ? (
          <div className="text-center mt-16 animate-quicar">
            <p className="text-6xl mb-3">🏆</p>
            <p className="text-xl font-semibold">Tarefa concluída!</p>
            <p className="text-sm text-ink-400 mt-1">Foco total. Mandou muito bem.</p>
          </div>
        ) : (
          <>
            <div className="relative mx-auto mt-6" style={{ width: 220, height: 220 }}>
              <svg viewBox="0 0 200 200" className={`w-full h-full -rotate-90 ${rodando ? "" : "opacity-90"}`}>
                <circle cx="100" cy="100" r={r} fill="none" strokeWidth="10" className="stroke-base-700" />
                <circle
                  cx="100"
                  cy="100"
                  r={r}
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  stroke={COR}
                  strokeDasharray={volta}
                  strokeDashoffset={volta * (1 - pct)}
                  style={{ transition: "stroke-dashoffset .3s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-mono font-semibold tabular-nums ${rodando ? "" : "text-ink-400"}`}>{mmss(restante)}</span>
                <span className="text-xs text-ink-400 mt-1">{acabou ? "tempo!" : rodando ? "focando…" : salvo ? "pausado" : "pronto?"}</span>
              </div>
              {rodando && <span aria-hidden className="absolute inset-4 rounded-full animate-respirar" style={{ boxShadow: `0 0 40px 4px ${COR}33` }} />}
            </div>

            {!salvo && (
              <div className="flex justify-center gap-2 mt-5">
                {OPCOES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => comecar(m)}
                    className="rounded-full border border-base-600 px-4 py-2 text-sm hover:border-nota hover:text-nota transition active:scale-95"
                  >
                    {m} min
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-center gap-3 mt-5">
              {acabou ? (
                <>
                  <button type="button" onClick={maisCinco} className="flex items-center gap-1.5 rounded-full border border-base-600 px-5 py-3 text-sm active:scale-95 transition">
                    <Plus size={16} /> 5 min
                  </button>
                  <button type="button" onClick={concluir} className="flex items-center gap-1.5 rounded-full bg-nota text-base-900 font-semibold px-6 py-3 text-sm active:scale-95 transition">
                    <Check size={17} /> Concluí!
                  </button>
                </>
              ) : rodando ? (
                <button type="button" onClick={pausar} className="flex items-center gap-1.5 rounded-full border border-base-600 px-6 py-3 text-sm active:scale-95 transition">
                  <Pause size={16} /> Pausar
                </button>
              ) : salvo ? (
                <button type="button" onClick={() => comecar()} className="flex items-center gap-1.5 rounded-full bg-nota text-base-900 font-semibold px-6 py-3 text-sm active:scale-95 transition">
                  <Play size={16} /> Continuar
                </button>
              ) : null}
            </div>

            {subs.length > 0 && (
              <div className="mt-8 max-w-md mx-auto">
                <p className="text-sm text-ink-400 mb-2">
                  Checklist · {feitasSubs}/{subs.length}
                </p>
                <div className="space-y-2">
                  {subs.map((s) => (
                    <CheckboxSubtarefa
                      key={s.id}
                      tarefaId={tarefa.id}
                      subtarefaId={s.id}
                      texto={s.texto}
                      feita={s.feita}
                      aoAlternarLocal={() => setSubs((l) => l.map((x) => (x.id === s.id ? { ...x, feita: !x.feita } : x)))}
                    />
                  ))}
                </div>
              </div>
            )}

            {!acabou && (tarefa.repetir !== "nenhuma" || !tarefa.concluida) && (
              <button type="button" onClick={concluir} className="block mx-auto mt-8 text-sm text-nota hover:underline">
                Já terminei — marcar como concluída
              </button>
            )}
          </>
        )}
      </div>
    </div>
  ,
    document.body
  );
}
