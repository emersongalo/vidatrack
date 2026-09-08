"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { diaBateComFrequencia } from "@/lib/agenda/dias";

type ItemComLembrete = {
  chave: string; // "habito-<id>" ou "tarefa-<id>"
  nome: string;
  horario: string; // "HH:MM"
  href: string;
};

/**
 * Alarme que funciona SÓ enquanto essa aba estiver aberta — é um
 * reforço pro sistema de notificação push (que depende do agendador
 * externo funcionar certinho), não uma substituição dele. Roda em
 * qualquer tela do app, já que fica no layout raiz.
 */
export function AlarmeAlertaTela() {
  const [itens, setItens] = useState<ItemComLembrete[]>([]);
  const [alerta, setAlerta] = useState<ItemComLembrete | null>(null);
  const jaAlertadosRef = useRef<Set<string>>(new Set());

  // Busca (e depois recarrega de tempos em tempos) os hábitos e
  // tarefas de hoje que têm horário de lembrete marcado.
  useEffect(() => {
    let cancelado = false;

    async function buscar() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelado) return;

      const hoje = new Date().toLocaleDateString("sv-SE");

      const [{ data: habitos }, { data: tarefas }] = await Promise.all([
        supabase
          .from("habitos")
          .select("id, nome, frequencia, dias_semana, horario_lembrete")
          .eq("arquivado", false)
          .not("horario_lembrete", "is", null),
        supabase
          .from("tarefas")
          .select("id, titulo, repetir, dias_semana, data, horario_lembrete")
          .eq("arquivada", false)
          .not("horario_lembrete", "is", null),
      ]);

      if (cancelado) return;

      const encontrados: ItemComLembrete[] = [];

      for (const h of habitos ?? []) {
        if (diaBateComFrequencia(h.frequencia, h.dias_semana ?? [], hoje)) {
          encontrados.push({
            chave: `habito-${h.id}`,
            nome: h.nome,
            horario: (h.horario_lembrete as string).slice(0, 5),
            href: "/habitos",
          });
        }
      }

      for (const t of tarefas ?? []) {
        const apareceHoje =
          t.repetir === "nenhuma" ? t.data === hoje : diaBateComFrequencia(t.repetir, t.dias_semana ?? [], hoje);
        if (apareceHoje) {
          encontrados.push({
            chave: `tarefa-${t.id}`,
            nome: t.titulo,
            horario: (t.horario_lembrete as string).slice(0, 5),
            href: `/habitos/tarefas/${t.id}`,
          });
        }
      }

      setItens(encontrados);
    }

    buscar();
    // Recarrega de tempos em tempos — pega lembretes criados depois
    // que a aba já estava aberta, sem precisar dar F5.
    const idRecarga = setInterval(buscar, 5 * 60 * 1000);
    return () => {
      cancelado = true;
      clearInterval(idRecarga);
    };
  }, []);

  // Confere a cada 15s se o horário de agora bate com algum item —
  // e toca o alarme só uma vez por item por sessão (não fica
  // repetindo o mesmo alerta a cada 15s pra sempre).
  useEffect(() => {
    function conferir() {
      const agora = new Date();
      const horaAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

      for (const item of itens) {
        if (item.horario === horaAtual && !jaAlertadosRef.current.has(item.chave)) {
          jaAlertadosRef.current.add(item.chave);
          setAlerta(item);
          tocarSom();
          break; // um alerta de cada vez — se tiver mais, aparece no próximo ciclo
        }
      }
    }

    const idIntervalo = setInterval(conferir, 15 * 1000);
    return () => clearInterval(idIntervalo);
  }, [itens]);

  function tocarSom() {
    try {
      const contexto = new (window.AudioContext || (window as any).webkitAudioContext)();
      const tocarBip = (atraso: number) => {
        const osc = contexto.createOscillator();
        const ganho = contexto.createGain();
        osc.connect(ganho);
        ganho.connect(contexto.destination);
        osc.frequency.value = 880;
        ganho.gain.setValueAtTime(0.15, contexto.currentTime + atraso);
        ganho.gain.exponentialRampToValueAtTime(0.001, contexto.currentTime + atraso + 0.35);
        osc.start(contexto.currentTime + atraso);
        osc.stop(contexto.currentTime + atraso + 0.35);
      };
      tocarBip(0);
      tocarBip(0.45);
    } catch {
      // Navegador sem suporte a Web Audio, ou bloqueou por política de
      // autoplay — sem problema, o alerta visual continua aparecendo.
    }
  }

  if (!alerta) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70">
      <div className="bg-base-800 border border-habito rounded-xl2 p-6 max-w-sm w-full text-center shadow-2xl">
        <p className="text-3xl mb-3">⏰</p>
        <p className="text-xs text-ink-400 mb-1">{alerta.horario} — lembrete</p>
        <h2 className="text-xl font-display font-semibold mb-6">{alerta.nome}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setAlerta(null)}
            className="flex-1 border border-base-600 rounded-lg py-2.5 hover:bg-base-700 transition"
          >
            Dispensar
          </button>
          <a
            href={alerta.href}
            onClick={() => setAlerta(null)}
            className="flex-1 bg-habito text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition"
          >
            Ver
          </a>
        </div>
      </div>
    </div>
  );
}
