"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { RefreshCw, Bell } from "lucide-react";
import { classeCor, classeFundoSuave, classeTextoCor } from "@/lib/agenda/estilo";
import { IconeHabito } from "@/components/IconeHabito";
import { CelebracaoConquista } from "@/components/CelebracaoConquista";
import { alternarCheckin, ajustarQuantidadeHabito, salvarObservacaoCheckin } from "@/app/habitos/actions";
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
  const [marcoAtingido, setMarcoAtingido] = useState<number | null>(null);
  const [mostrarNota, setMostrarNota] = useState(false);
  const [textoNota, setTextoNota] = useState("");
  const ehNumerico = item.tipo === "habito" && item.meta && item.meta.alvo > 1;

  function alternar() {
    if (typeof navigator !== "undefined" && !navigator.onLine && aoClicarOffline) {
      aoClicarOffline();
      return;
    }
    iniciarTransicao(async () => {
      if (item.tipo === "habito") {
        const feitoAntes = item.feito;
        const resultado = await alternarCheckin(item.id, dataISO);
        if (resultado?.marcoAtingido) setMarcoAtingido(resultado.marcoAtingido);
        // Convite pra anotar só quando está MARCANDO (não quando
        // desmarca) — não faz sentido pedir nota de algo que a
        // pessoa acabou de dizer que não fez.
        if (!feitoAntes && !resultado?.marcoAtingido) setMostrarNota(true);
      } else {
        await alternarConclusaoTarefa(item.id, dataISO);
      }
    });
  }

  function salvarNota() {
    iniciarTransicao(async () => {
      await salvarObservacaoCheckin(item.id, dataISO, textoNota);
      setMostrarNota(false);
      setTextoNota("");
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
        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${classeFundoSuave(
          item.cor
        )}`}
      >
        <IconeHabito icone={item.icone} tamanho={20} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${item.feito ? "line-through text-ink-400" : ""}`}>
          {item.titulo}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${classeFundoSuave(
              item.cor
            )} ${classeTextoCor(item.cor)}`}
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
          {item.repete && (
            <span className="text-ink-400">
              <RefreshCw size={12} strokeWidth={2} />
            </span>
          )}
          {item.horarioLembrete && (
            <span className="text-[11px] text-ink-400 flex items-center gap-1">
              <Bell size={11} strokeWidth={2} /> {item.horarioLembrete.slice(0, 5)}
            </span>
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
    <>
    {marcoAtingido && (
      <CelebracaoConquista
        marco={marcoAtingido}
        nomeHabito={item.titulo}
        onFechar={() => setMarcoAtingido(null)}
      />
    )}
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

    {mostrarNota && (
      <li className="bg-base-800 border border-base-600 rounded-xl2 p-3 -mt-1">
        <textarea
          value={textoNota}
          onChange={(e) => setTextoNota(e.target.value)}
          placeholder="Quer anotar algo sobre hoje? (opcional)"
          rows={2}
          autoFocus
          className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none transition resize-none mb-2"
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              setMostrarNota(false);
              setTextoNota("");
            }}
            className="flex-1 text-xs text-ink-400 hover:text-ink-100 transition py-1.5"
          >
            Pular
          </button>
          <button
            onClick={salvarNota}
            disabled={!textoNota.trim()}
            className="flex-1 bg-habito text-base-900 text-xs font-medium rounded-lg py-1.5 hover:opacity-90 transition disabled:opacity-40"
          >
            Salvar nota
          </button>
        </div>
      </li>
    )}
    </>
  );
}
