"use client";

// Etapa 360 — compromissos da Agenda na tela Hoje (junto com hábitos e
// tarefas). Toque abre o compromisso na Agenda. Funciona sem internet
// (usa a cópia guardada da agenda).
import Link from "next/link";
import { useMemo } from "react";
import { CalendarDays, MapPin, Navigation } from "lucide-react";
import { useAgenda } from "@/lib/agenda/useAgenda";
import { corDoEvento, hhmm, ocorrenciasEntre } from "@/lib/agenda/eventos";
import { separarEmoji, urlRota } from "@/lib/agenda/visual";
import { ehLembreteSair, minutosDoLembrete } from "@/lib/agenda/lembretesSair";

function menos(hora: string, min: number) {
  const [h, m] = hora.split(":").map(Number);
  const t = Math.max(0, h * 60 + m - min);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export function AgendaDoDia({ dia, hoje }: { dia: string; hoje: string }) {
  const ag = useAgenda();
  const lista = useMemo(() => {
    const visiveis = ag.eventos.filter(
      (e) => e.dono_id === ag.eu || (e.evento_participantes ?? []).find((p) => p.usuario_id === ag.eu)?.resposta !== "nao_vou"
    );
    return ocorrenciasEntre(visiveis, dia, dia).sort((a, b) => String(a.evento.hora_inicio ?? "").localeCompare(String(b.evento.hora_inicio ?? "")));
  }, [ag.eventos, ag.eu, dia]);

  if (ag.semTabela) return null;
  const agora = new Date().toTimeString().slice(0, 5);
  const ehHoje = dia === hoje;

  return (
    <section className="mb-4">
      <div className="flex items-center justify-between px-1 mb-1.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400 flex items-center gap-1.5">
          <CalendarDays size={13} /> Agenda {ehHoje ? "de hoje" : "do dia"}
        </h3>
        <Link href="/tarefas/agenda" className="text-[11px] text-ink-400 hover:text-nota">
          abrir agenda ›
        </Link>
      </div>
      {lista.length === 0 ? (
        <Link href="/tarefas/agenda" className="block text-xs text-ink-400/80 border border-dashed border-base-600 rounded-xl px-3 py-2">
          {ag.carregando ? "Carregando…" : "Nada marcado. Toque pra adicionar um compromisso."}
        </Link>
      ) : (
        <ul className="space-y-1.5">
          {lista.map((o, i) => {
            const e = o.evento as any;
            const c = corDoEvento(e.cor);
            const { emoji, texto } = separarEmoji(e.titulo);
            const ini = hhmm(e.hora_inicio);
            const fim = hhmm(e.hora_fim);
            const passou = ehHoje && !!ini && (fim ?? ini) < agora;
            const acontecendo = ehHoje && !!ini && ini <= agora && agora < (fim ?? ini);
            const sair = (e.lembretes ?? []).find((v: number) => ehLembreteSair(v));
            const horaSair = sair !== undefined && ini ? menos(ini, minutosDoLembrete(sair)) : null;
            return (
              <li key={`${e.id}-${o.dia}`} className={`animate-entrar ${passou ? "opacity-50" : ""}`} style={{ animationDelay: `${i * 35}ms` }}>
                <div className="relative flex items-center gap-2.5 rounded-xl border border-base-600 bg-base-800 pl-3 pr-2 py-2">
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ background: c.hex }} />
                  <Link href={`/tarefas/agenda?evento=${e.id}`} className="flex flex-1 min-w-0 items-center gap-2.5">
                    <span className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-base" style={{ background: `${c.hex}22` }}>
                      {emoji ?? (e.tipo === "aniversario" ? "🎂" : "📅")}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold truncate">{texto}</span>
                      <span className="flex items-center gap-1.5 text-[11px] text-ink-400 min-w-0">
                        <span className="font-mono shrink-0">{ini ? `${ini}${fim ? `–${fim}` : ""}` : "dia todo"}</span>
                        {acontecendo && <span className="text-red-400 shrink-0">● agora</span>}
                        {horaSair && !passou && !acontecendo && <span className="text-financa shrink-0">🚗 sair {horaSair}</span>}
                        {e.local && (
                          <span className="flex items-center gap-0.5 truncate min-w-0">
                            <MapPin size={10} className="shrink-0" /> <span className="truncate">{e.local}</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </Link>
                  {e.local && ehHoje && !passou && (
                    <a href={urlRota(e.local)} target="_blank" rel="noopener noreferrer" aria-label="Rota" className="w-8 h-8 shrink-0 rounded-lg border border-base-600 flex items-center justify-center text-ink-400 hover:text-ink-100">
                      <Navigation size={14} />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
