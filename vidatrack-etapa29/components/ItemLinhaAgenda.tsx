"use client";

import Link from "next/link";
import { useTransition } from "react";
import { classeCor, classeFundoSuave } from "@/lib/agenda/estilo";
import { alternarCheckin, ajustarQuantidadeHabito } from "@/app/habitos/actions";
import { alternarConclusaoTarefa } from "@/app/habitos/tarefas/actions";

export type ItemAgenda = {
  id: string;
  tipo: "habito" | "tarefa";
  titulo: string;
  icone: string;
  cor: string;
  feito: boolean;
  repete: boolean;
  horarioLembrete: string | null;
  progressoSubtarefas?: { feitas: number; total: number } | null;
  meta?: { atual: number; alvo: number; unidade: string | null } | null;
  ordem: number;
  /** Só vem preenchido quando o hábito é compartilhado com alguém —
   *  mostra o status do dia de cada pessoa lado a lado, pra motivarem
   *  juntos (ex: "ler a Bíblia juntos"). */
  participantes?: { nome: string; feito: boolean }[];
};

export function ItemLinhaAgenda({
  item,
  dataISO,
  aoClicarOffline,
  aoAjustarOffline,
}: {
  item: ItemAgenda;
  dataISO: string;
  aoClicarOffline?: () => void;
  aoAjustarOffline?: (delta: number) => void;
}) {
  const [pendente, iniciarTransicao] = useTransition();
  const ehNumerico = item.tipo === "habito" && item.meta && item.meta.alvo > 1;

  function alternar() {
    if (typeof navigator !== "undefined" && !navigator.onLine && aoClicarOffline) {
      aoClicarOffline();
      return;
    }
    iniciarTransicao(() => {
      if (item.tipo === "habito") {
        alternarCheckin(item.id, dataISO);
      } else {
        alternarConclusaoTarefa(item.id, dataISO);
      }
    });
  }

  function ajustar(delta: number) {
    if (typeof navigator !== "undefined" && !navigator.onLine && aoAjustarOffline) {
      aoAjustarOffline(delta);
      return;
    }
    iniciarTransicao(() => {
      ajustarQuantidadeHabito(item.id, dataISO, delta);
    });
  }

  const conteudo = (
    <>
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${classeFundoSuave(
          item.cor
        )}`}
      >
        {item.icone}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${item.feito ? "line-through text-ink-400" : ""}`}>
          {item.titulo}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded ${
              item.tipo === "habito" ? "bg-habito-soft text-habito" : "bg-nota-soft text-nota"
            }`}
          >
            {item.tipo === "habito" ? "Hábito" : "Tarefa"}
          </span>
          {item.progressoSubtarefas && (
            <span className="text-[11px] text-ink-400">
              {item.progressoSubtarefas.feitas}/{item.progressoSubtarefas.total}
            </span>
          )}
          {ehNumerico && item.meta && (
            <span className="text-[11px] text-ink-400 font-mono">
              {item.meta.atual}/{item.meta.alvo} {item.meta.unidade ?? ""}
            </span>
          )}
          {item.repete && <span className="text-ink-400 text-xs">🔁</span>}
          {item.horarioLembrete && (
            <span className="text-[11px] text-ink-400">🔔 {item.horarioLembrete.slice(0, 5)}</span>
          )}
        </div>

        {item.participantes && item.participantes.length > 1 && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {item.participantes.map((p, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full ${
                  p.feito ? "bg-habito-soft text-habito" : "bg-base-600 text-ink-400"
                }`}
              >
                {p.feito ? "✓" : "○"} {p.nome}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <li className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-xl2 p-3">
      {item.tipo === "tarefa" && item.progressoSubtarefas ? (
        <Link href={`/habitos/tarefas/${item.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          {conteudo}
        </Link>
      ) : (
        <div className="flex items-center gap-3 flex-1 min-w-0">{conteudo}</div>
      )}

      {ehNumerico ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => ajustar(-1)}
            disabled={pendente}
            aria-label="Diminuir"
            className="w-7 h-7 rounded-full border border-base-600 flex items-center justify-center hover:border-ink-400 transition text-sm"
          >
            −
          </button>
          <button
            onClick={() => ajustar(1)}
            disabled={pendente}
            aria-label="Aumentar"
            className={`w-7 h-7 rounded-full flex items-center justify-center transition text-sm ${
              item.feito ? `${classeCor(item.cor)} text-base-900` : "border border-base-600 hover:border-ink-400"
            }`}
          >
            +
          </button>
        </div>
      ) : (
        <button
          onClick={alternar}
          disabled={pendente}
          aria-pressed={item.feito}
          aria-label={item.feito ? "Desmarcar" : "Marcar como feito"}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition shrink-0 ${
            item.feito ? `${classeCor(item.cor)} border-transparent` : "border-base-600 hover:border-ink-400"
          } ${pendente ? "opacity-60" : ""}`}
        >
          {item.feito && (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8.5L6.2 11.5L13 4.5"
                stroke="#0F1013"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}
    </li>
  );
}
