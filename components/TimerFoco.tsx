"use client";

// Etapa 237 — Timer de foco novo:
// • Pomodoro (25 foco / 5 pausa, pausa longa a cada 4) ou tempo livre
// • anel grande que vai esvaziando, fase atual e tomatinhos do ciclo
// • continua contando se sair da tela (usa a hora de término)
// • escolhe um hábito pra focar; no fim marca o hábito (ou soma os minutos)
// • som + vibração + aviso no fim, tela não apaga enquanto conta
// • minutos de foco de hoje e da semana (fica neste aparelho)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward, Minus, Plus } from "lucide-react";
import { useSnapshotOffline, atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";
import { alternarCheckin, ajustarQuantidadeHabito } from "@/app/habitos/actions";
import { IconeHabito } from "@/components/IconeHabito";
import {
  POMODORO,
  focoDaSemana,
  formatarTempo,
  iniciar,
  lerTimer,
  pausar,
  proximaFase,
  restante,
  rodando,
  timerInicial,
  type Sessao,
  type TimerSalvo,
} from "@/lib/habitos/timer";

const CHAVE = "vidatrack-timer";
const CHAVE_SESSOES = "vidatrack-timer-sessoes";
const PRESETS = [5, 10, 15, 25, 45, 60];

const ROTULO_FASE = { foco: "Foco", pausa: "Pausa", pausaLonga: "Pausa longa" } as const;
const COR_FASE = { foco: "#7FB894", pausa: "#6BA3C7", pausaLonga: "#9C8FD9" } as const;

function ler<T>(chave: string, padrao: T): T {
  try {
    const b = localStorage.getItem(chave);
    return b ? (JSON.parse(b) as T) : padrao;
  } catch {
    return padrao;
  }
}
function gravar(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {}
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
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.6);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.7);
    });
  } catch {}
}

export function TimerFoco() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const [t, setT] = useState<TimerSalvo>(() => timerInicial("pomodoro"));
  const [minutosLivre, setMinutosLivre] = useState(25);
  const [agora, setAgora] = useState(() => Date.now());
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [fim, setFim] = useState<{ minutos: number; habitoId: string | null } | null>(null);
  const [marcando, setMarcando] = useState(false);
  const [marcado, setMarcado] = useState<string | null>(null);
  const wake = useRef<any>(null);
  const carregou = useRef(false);

  // carrega o que estava salvo (inclusive um timer que estava rodando)
  useEffect(() => {
    const salvo = lerTimer((() => {
      try {
        return localStorage.getItem(CHAVE);
      } catch {
        return null;
      }
    })());
    if (salvo) setT(salvo);
    setSessoes(ler<Sessao[]>(CHAVE_SESSOES, []).slice(-200));
    carregou.current = true;
  }, []);

  useEffect(() => {
    if (carregou.current) gravar(CHAVE, t);
  }, [t]);

  // relógio
  useEffect(() => {
    if (!rodando(t)) return;
    const i = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(i);
  }, [t]);

  // tela acesa enquanto conta
  useEffect(() => {
    if (!rodando(t)) {
      wake.current?.release?.().catch?.(() => {});
      wake.current = null;
      return;
    }
    (navigator as any).wakeLock
      ?.request("screen")
      .then((w: any) => (wake.current = w))
      .catch(() => {});
  }, [t]);

  const resta = restante(t, agora);
  const habitos = useMemo(
    () => ((snapshot?.habitos ?? []) as any[]).filter((h) => !h.eh_negativo && habitoDevidoNoDia(h, hoje)),
    [snapshot, hoje]
  );
  const habitoEscolhido = habitos.find((h) => h.id === t.habitoId) ?? null;

  const concluirFase = useCallback(() => {
    tocarSino();
    try {
      (navigator as any).vibrate?.([200, 100, 200, 100, 400]);
    } catch {}
    const terminouFoco = t.fase === "foco";
    if (terminouFoco) {
      const minutos = Math.round(t.total / 60);
      const nova = [...sessoes, { dia: hoje, minutos, habito: habitoEscolhido?.nome ?? null }].slice(-200);
      setSessoes(nova);
      gravar(CHAVE_SESSOES, nova);
      setFim({ minutos, habitoId: t.habitoId });
      setMarcado(null);
    }
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(terminouFoco ? "⏰ Foco concluído!" : "☕ Pausa acabou", {
          body: terminouFoco ? "Hora de uma pausa." : "Bora pro próximo foco?",
        });
      }
    } catch {}
    setT((atual) => proximaFase(atual, minutosLivre));
  }, [t, sessoes, hoje, habitoEscolhido, minutosLivre]);

  // chegou a zero
  useEffect(() => {
    if (rodando(t) && resta === 0) concluirFase();
  }, [resta, t, concluirFase]);

  function alternar() {
    if (rodando(t)) return setT(pausar(t, Date.now()));
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission().catch(() => {});
    } catch {}
    setFim(null);
    setAgora(Date.now());
    setT(iniciar(t, Date.now()));
  }

  function reiniciar() {
    setFim(null);
    setT({ ...timerInicial(t.modo, minutosLivre), habitoId: t.habitoId });
  }

  function trocarModo(modo: "pomodoro" | "livre") {
    setFim(null);
    setT({ ...timerInicial(modo, minutosLivre), habitoId: t.habitoId });
  }

  function escolherMinutos(m: number) {
    const v = Math.max(1, Math.min(180, m));
    setMinutosLivre(v);
    if (!rodando(t)) setT({ ...t, fase: "foco", total: v * 60, restantePausado: null });
  }

  async function marcarHabito() {
    if (!fim?.habitoId) return;
    const h = habitos.find((x) => x.id === fim.habitoId);
    if (!h) return;
    setMarcando(true);
    try {
      const meta = Math.max(1, Number(h.meta_diaria) || 1);
      const emMinutos = /min/i.test(String(h.unidade ?? ""));
      if (meta > 1 && emMinutos) {
        await ajustarQuantidadeHabito(h.id, hoje, fim.minutos);
        setMarcado(`+${fim.minutos} min em ${h.nome}`);
      } else if (meta > 1) {
        await ajustarQuantidadeHabito(h.id, hoje, 1);
        setMarcado(`+1 em ${h.nome}`);
      } else {
        const jaFeito = ((snapshot?.habitoCheckins ?? []) as any[]).some((c) => c.habito_id === h.id && c.data === hoje);
        if (!jaFeito) await alternarCheckin(h.id, hoje);
        setMarcado(jaFeito ? `${h.nome} já estava feito hoje` : `${h.nome} marcado ✓`);
      }
      atualizarSnapshotEmTodasAsTelas();
    } finally {
      setMarcando(false);
    }
  }

  // anel
  const R = 120;
  const C = 2 * Math.PI * R;
  const progresso = t.total > 0 ? resta / t.total : 0;
  const cor = COR_FASE[t.fase];
  const semana = focoDaSemana(sessoes, hoje);
  const minutosHoje = semana[6].minutos;
  const sessoesHoje = sessoes.filter((s) => s.dia === hoje).length;
  const maiorDia = Math.max(1, ...semana.map((d) => d.minutos));

  return (
    <div className="flex flex-col items-center">
      {/* modo */}
      <div className="grid grid-cols-2 gap-1 bg-base-800 border border-base-600 rounded-2xl p-1 w-full mb-5">
        {(["pomodoro", "livre"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => trocarModo(m)}
            className={`rounded-xl py-2.5 text-base transition ${t.modo === m ? "bg-ink-100 text-base-900 font-semibold" : "text-ink-400"}`}
          >
            {m === "pomodoro" ? "🍅 Pomodoro" : "⏱️ Tempo livre"}
          </button>
        ))}
      </div>

      {t.modo === "livre" && !rodando(t) && (
        <div className="w-full mb-4">
          <div className="grid grid-cols-6 gap-1.5 mb-2">
            {PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => escolherMinutos(m)}
                className={`rounded-xl py-2 text-sm border transition ${minutosLivre === m ? "bg-habito/15 border-habito text-habito font-semibold" : "border-base-600 text-ink-400"}`}
              >
                {m}m
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-ink-400">
            <button type="button" onClick={() => escolherMinutos(minutosLivre - 1)} className="w-9 h-9 rounded-full border border-base-600 flex items-center justify-center" aria-label="Menos 1 minuto">
              <Minus size={16} />
            </button>
            <span className="text-ink-100 font-semibold w-20 text-center">{minutosLivre} min</span>
            <button type="button" onClick={() => escolherMinutos(minutosLivre + 1)} className="w-9 h-9 rounded-full border border-base-600 flex items-center justify-center" aria-label="Mais 1 minuto">
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      {/* anel */}
      <div className="relative w-[17rem] h-[17rem] my-2">
        <svg viewBox="0 0 280 280" className="w-full h-full -rotate-90">
          <circle cx="140" cy="140" r={R} fill="none" strokeWidth="14" className="stroke-base-700" />
          <circle
            cx="140"
            cy="140"
            r={R}
            fill="none"
            stroke={cor}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progresso)}
            style={{ transition: rodando(t) ? "stroke-dashoffset 300ms linear" : "stroke-dashoffset 500ms ease", filter: `drop-shadow(0 0 10px ${cor}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: cor }}>
            {ROTULO_FASE[t.fase]}
          </span>
          <span className={`font-mono font-bold text-6xl tabular-nums ${rodando(t) ? "" : "opacity-90"}`}>{formatarTempo(resta)}</span>
          {habitoEscolhido && (
            <span className="text-sm text-ink-400 mt-1 max-w-[11rem] truncate">em {habitoEscolhido.nome}</span>
          )}
          {t.modo === "pomodoro" && (
            <span className="flex gap-1 mt-2" aria-label={`${t.ciclo % POMODORO.focosAteLonga} de ${POMODORO.focosAteLonga} focos`}>
              {Array.from({ length: POMODORO.focosAteLonga }, (_, i) => (
                <span key={i} className={`text-base ${i < t.ciclo % POMODORO.focosAteLonga ? "" : "grayscale opacity-30"}`}>
                  🍅
                </span>
              ))}
            </span>
          )}
        </div>
      </div>

      {/* controles */}
      <div className="flex items-center justify-center gap-5 mt-4 mb-6">
        <button type="button" onClick={reiniciar} aria-label="Reiniciar" className="w-14 h-14 rounded-full border border-base-600 flex items-center justify-center text-ink-400 hover:text-ink-100">
          <RotateCcw size={22} />
        </button>
        <button
          type="button"
          onClick={alternar}
          aria-label={rodando(t) ? "Pausar" : "Iniciar"}
          className="w-20 h-20 rounded-full flex items-center justify-center text-base-900 shadow-lg active:scale-95 transition"
          style={{ background: cor, boxShadow: `0 8px 30px ${cor}55` }}
        >
          {rodando(t) ? <Pause size={34} fill="currentColor" /> : <Play size={34} fill="currentColor" className="ml-1" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setFim(null);
            setT(proximaFase(t, minutosLivre));
          }}
          aria-label="Pular fase"
          disabled={t.modo === "livre"}
          className="w-14 h-14 rounded-full border border-base-600 flex items-center justify-center text-ink-400 hover:text-ink-100 disabled:opacity-30"
        >
          <SkipForward size={22} />
        </button>
      </div>

      {/* terminou um foco */}
      {fim && (
        <div className="animate-surgir w-full bg-habito/10 border border-habito/40 rounded-3xl p-4 mb-6 text-center">
          <p className="text-lg font-semibold">🎉 {fim.minutos} minutos de foco!</p>
          {fim.habitoId && !marcado && (
            <button
              type="button"
              onClick={marcarHabito}
              disabled={marcando}
              className="mt-3 bg-habito text-base-900 rounded-xl px-4 py-2.5 text-base font-semibold disabled:opacity-50"
            >
              {marcando ? "Marcando..." : `Marcar "${habitos.find((h) => h.id === fim.habitoId)?.nome ?? "hábito"}"`}
            </button>
          )}
          {marcado && <p className="text-base text-habito mt-2">{marcado}</p>}
          {t.modo === "pomodoro" && <p className="text-sm text-ink-400 mt-2">Agora uma pausa — toque em ▶ quando quiser.</p>}
        </div>
      )}

      {/* hábito pra focar */}
      {habitos.length > 0 && (
        <div className="w-full mb-6">
          <p className="text-base text-ink-400 mb-2">Focar em qual hábito? (opcional)</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" data-gesto-proprio="1">
            <button
              type="button"
              onClick={() => setT({ ...t, habitoId: null })}
              className={`shrink-0 rounded-full px-3 py-2 text-sm border ${!t.habitoId ? "border-ink-100 text-ink-100" : "border-base-600 text-ink-400"}`}
            >
              Nenhum
            </button>
            {habitos.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setT({ ...t, habitoId: h.id })}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-2 text-sm border ${
                  t.habitoId === h.id ? "border-habito bg-habito/10 text-habito font-semibold" : "border-base-600 text-ink-400"
                }`}
              >
                <IconeHabito icone={h.icone} tamanho={14} /> {h.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* hoje e semana */}
      <div className="w-full bg-base-800 border border-base-600 rounded-3xl p-5">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-lg font-semibold">Seu foco</p>
          <p className="text-sm text-ink-400">
            Hoje: <span className="text-ink-100 font-semibold">{minutosHoje} min</span> · {sessoesHoje} {sessoesHoje === 1 ? "sessão" : "sessões"}
          </p>
        </div>
        <div className="flex items-end gap-2 h-24">
          {semana.map((d, i) => (
            <div key={d.dia} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[0.7rem] text-ink-400">{d.minutos ? d.minutos : ""}</span>
              <div
                className={`w-full rounded-lg ${i === 6 ? "bg-habito" : "bg-habito/40"}`}
                style={{ height: `${Math.max(4, (d.minutos / maiorDia) * 75)}%` }}
              />
              <span className={`text-xs ${i === 6 ? "text-ink-100 font-semibold" : "text-ink-400"}`}>
                {["D", "S", "T", "Q", "Q", "S", "S"][new Date(d.dia + "T12:00:00").getDay()]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
