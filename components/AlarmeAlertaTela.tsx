"use client";

// Alarme na tela: reforço do lembrete enquanto o app está aberto.
// Etapa 271:
// - só na versão WEB (navegador). No aplicativo do celular o aviso já
//   chega como notificação do sistema — mostrar os dois era repetido;
// - não avisa o que já foi feito hoje;
// - visual novo: cartão no topo (não trava a tela), na cor do hábito
//   (verde) ou da tarefa (lilás), com "Feito", "Daqui a 10 min" e "Ver".
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, Clock, X } from "lucide-react";
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";
import { tarefaApareceNoDia } from "@/lib/agenda/recorrencia";
import { horariosDoHabito } from "@/lib/habitos/horariosLembrete";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";
import { EVENTO_SNAPSHOT, atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { alternarCheckin } from "@/app/habitos/actions";
import { alternarConclusaoTarefa } from "@/app/habitos/tarefas/actions";
import { vibrar } from "@/lib/app/vibrar";

type Item = {
  chave: string; // "habito-<id>-HH:MM" ou "tarefa-<id>"
  id: string;
  tipo: "habito" | "tarefa";
  nome: string;
  horario: string; // "HH:MM"
  href: string;
  podeMarcar: boolean;
};

function hojeLocal() {
  return new Date().toLocaleDateString("sv-SE");
}

function montarItens(): Item[] {
  const s = lerSnapshotOffline();
  if (!s) return [];
  const hoje = hojeLocal();
  const feitosHabito = new Map<string, number>();
  for (const c of s.habitoCheckins ?? []) if (c.data === hoje) feitosHabito.set(c.habito_id, (feitosHabito.get(c.habito_id) ?? 0) + Number(c.quantidade ?? 1));
  const tarefasFeitas = new Set((s.conclusoesTarefas ?? []).filter((c) => c.data === hoje).map((c) => c.tarefa_id));
  const itens: Item[] = [];

  for (const h of (s.habitos ?? []) as any[]) {
    if (!habitoDevidoNoDia(h, hoje)) continue;
    const meta = Math.max(1, Number(h.meta_diaria) || 1);
    if ((feitosHabito.get(h.id) ?? 0) >= meta) continue; // já fez hoje
    for (const horario of horariosDoHabito(h)) {
      itens.push({ chave: `habito-${h.id}-${horario}`, id: h.id, tipo: "habito", nome: h.nome, horario, href: "/habitos", podeMarcar: meta === 1 && !h.eh_negativo });
    }
  }
  for (const t of (s.tarefas ?? []) as any[]) {
    if (!t.horario_lembrete || !tarefaApareceNoDia(t, hoje)) continue;
    const feita = t.repetir === "nenhuma" ? t.concluida : tarefasFeitas.has(t.id);
    if (feita) continue;
    itens.push({ chave: `tarefa-${t.id}`, id: t.id, tipo: "tarefa", nome: t.titulo, horario: String(t.horario_lembrete).slice(0, 5), href: `/tarefas/${t.id}`, podeMarcar: true });
  }
  return itens;
}

function tocarSom() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // três notinhas suaves subindo (no lugar do bip seco)
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(ganho);
      ganho.connect(ctx.destination);
      const t0 = ctx.currentTime + i * 0.16;
      ganho.gain.setValueAtTime(0.0001, t0);
      ganho.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      osc.start(t0);
      osc.stop(t0 + 0.55);
    });
  } catch {
    // sem áudio liberado: fica só o aviso visual
  }
}

export function AlarmeAlertaTela() {
  const [ativo, setAtivo] = useState(false);
  const [itens, setItens] = useState<Item[]>([]);
  const [alerta, setAlerta] = useState<Item | null>(null);
  const [salvando, setSalvando] = useState(false);
  const jaAlertados = useRef<Set<string>>(new Set());
  const adiados = useRef<Map<string, number>>(new Map()); // chave → horário (ms) pra avisar de novo

  // só no navegador (no app nativo quem avisa é a notificação do sistema)
  useEffect(() => {
    const nativo = !!(window as any).Capacitor?.isNativePlatform?.();
    setAtivo(!nativo);
  }, []);

  useEffect(() => {
    if (!ativo) return;
    const recalcular = () => setItens(montarItens());
    recalcular();
    window.addEventListener(EVENTO_SNAPSHOT, recalcular);
    const id = setInterval(recalcular, 5 * 60 * 1000);
    return () => {
      window.removeEventListener(EVENTO_SNAPSHOT, recalcular);
      clearInterval(id);
    };
  }, [ativo]);

  useEffect(() => {
    if (!ativo) return;
    function conferir() {
      if (document.visibilityState !== "visible") return;
      const agora = new Date();
      const hora = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
      // adiados que chegaram a hora
      for (const [chave, quando] of adiados.current) {
        if (Date.now() >= quando) {
          adiados.current.delete(chave);
          const item = itens.find((i) => i.chave === chave);
          if (item) {
            setAlerta(item);
            tocarSom();
            return;
          }
        }
      }
      for (const item of itens) {
        if (item.horario === hora && !jaAlertados.current.has(item.chave)) {
          jaAlertados.current.add(item.chave);
          setAlerta(item);
          tocarSom();
          return; // um de cada vez
        }
      }
    }
    const id = setInterval(conferir, 15 * 1000);
    return () => clearInterval(id);
  }, [itens, ativo]);

  if (!ativo || !alerta) return null;

  const habito = alerta.tipo === "habito";
  const cor = habito ? "#7FB894" : "#9C8FD9";

  async function feito() {
    if (!alerta || salvando) return;
    setSalvando(true);
    try {
      if (alerta.tipo === "habito") await alternarCheckin(alerta.id, hojeLocal());
      else await alternarConclusaoTarefa(alerta.id, hojeLocal());
      vibrar([15, 40, 25]);
      atualizarSnapshotEmTodasAsTelas();
      setAlerta(null);
    } catch {
      // sem internet: deixa aberto pra tentar de novo / abrir
    }
    setSalvando(false);
  }

  function depois() {
    if (!alerta) return;
    adiados.current.set(alerta.chave, Date.now() + 10 * 60 * 1000);
    setAlerta(null);
  }

  return (
    <div className="fixed z-[90] inset-x-3 top-3 sm:inset-x-auto sm:right-5 sm:top-5 flex justify-center pointer-events-none" role="alertdialog" aria-live="assertive">
      <div
        className="pointer-events-auto animate-surgir w-full sm:w-[22rem] bg-base-800/95 backdrop-blur border rounded-3xl shadow-2xl shadow-black/50 overflow-hidden"
        style={{ borderColor: `${cor}66` }}
      >
        {/* faixa de cor no topo */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${cor}, ${cor}55)` }} />
        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="relative w-11 h-11 shrink-0">
              <span className="absolute inset-0 rounded-2xl animate-ping opacity-30" style={{ background: cor }} />
              <span className="relative w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${cor}26`, color: cor }}>
                <Bell size={20} className="animate-balancar" />
              </span>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium" style={{ color: cor }}>
                {habito ? "Hora do hábito" : "Lembrete de tarefa"} · {alerta.horario}
              </p>
              <p className="text-lg font-display font-semibold leading-tight truncate">{alerta.nome}</p>
            </div>
            <button type="button" onClick={() => setAlerta(null)} aria-label="Fechar" className="text-ink-400 hover:text-ink-100 p-1 -m-1">
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4">
            {alerta.podeMarcar && (
              <button
                type="button"
                onClick={feito}
                disabled={salvando}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-base-900 disabled:opacity-60 active:scale-[0.98] transition"
                style={{ background: cor }}
              >
                <Check size={16} strokeWidth={3} /> {salvando ? "…" : "Feito"}
              </button>
            )}
            <button
              type="button"
              onClick={depois}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm border border-base-600 text-ink-100 hover:bg-base-700 transition"
            >
              <Clock size={15} /> 10 min
            </button>
            <Link
              href={alerta.href}
              onClick={() => setAlerta(null)}
              className="flex-1 flex items-center justify-center rounded-xl py-2.5 text-sm border border-base-600 text-ink-400 hover:text-ink-100 transition"
            >
              Ver
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
