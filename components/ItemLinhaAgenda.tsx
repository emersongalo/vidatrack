"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { RefreshCw, Bell } from "lucide-react";
import { classeCor, classeFundoSuave, classeTextoCor } from "@/lib/agenda/estilo";
import { IconeHabito } from "@/components/IconeHabito";
import { CelebracaoConquista } from "@/components/CelebracaoConquista";
import { alternarCheckin, ajustarQuantidadeHabito, salvarObservacaoCheckin } from "@/app/habitos/actions";
import { alternarConclusaoTarefa } from "@/app/habitos/tarefas/actions";
import { PRIORIDADES } from "@/lib/agenda/recorrencia";
import { AdiarTarefa } from "@/components/AdiarTarefa";
import { createClient } from "@/lib/supabase/client";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { FaixaDupla } from "@/components/FaixaDupla";
import { ToqueDuplo } from "@/components/ToqueDuplo";
import { avisarDupla } from "@/lib/habitos/avisarDupla";
import type { InfoDupla } from "@/lib/habitos/dupla";

// Etapa 230 — vibraçãozinha ao marcar (no celular)
const LIMITE_NOTA = 1000;

export function vibrar(padrao: number | number[] = 15) {
  try {
    (navigator as any).vibrate?.(padrao);
  } catch {
    /* sem vibração */
  }
}

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
  /** Etapa 193 — 0 nenhuma, 1 baixa, 2 média, 3 alta (só tarefas). */
  prioridade?: number;
  /** Etapa 193 — tarefa única que passou da data sem ser concluída:
   *  aparece em Hoje com o selo "Atrasada desde dd/mm". */
  atrasadaDesde?: string | null;
  /** Etapa 213 — hábito "X por semana": quantas já foram nessa semana */
  semana?: { feitos: number; meta: number } | null;
  /** Etapa 194 — tarefa que lança em Finanças ao concluir */
  financa?: { tipo: string; valor: number } | null;
  /** Etapa 230 — últimos 7 dias do hábito (bolinhas na linha) */
  ultimos7?: { dia: string; estado: "feito" | "falhou" | "folga" }[] | null;
  /** Etapa 233 — hábito feito em dupla: carinha, quem já fez, sequência juntos */
  dupla?: InfoDupla | null;
  ehHoje?: boolean;
};

/** Etapa 193 — pendentes primeiro; entre elas, atrasadas, depois
 *  prioridade maior, depois a ordem que a pessoa arrastou. */
export function ordenarItensAgenda(a: ItemAgenda, b: ItemAgenda) {
  if (a.feito !== b.feito) return a.feito ? 1 : -1;
  const atrasoA = a.atrasadaDesde ? 1 : 0;
  const atrasoB = b.atrasadaDesde ? 1 : 0;
  if (atrasoA !== atrasoB) return atrasoB - atrasoA;
  const prioA = a.prioridade ?? 0;
  const prioB = b.prioridade ?? 0;
  if (prioA !== prioB) return prioB - prioA;
  return a.ordem - b.ordem;
}

export function ItemLinhaAgenda({
  item,
  dataISO,
  aoClicarOffline,
  aoAjustarOffline,
  aoAlternarLocal,
  aoAjustarLocal,
  aoConcluirMutacao,
}: {
  item: ItemAgenda;
  dataISO: string;
  aoClicarOffline?: () => void;
  aoAjustarOffline?: (delta: number) => void;
  /** Etapa 126: chamado sempre, online ou offline — é o que mantém a
   *  lista da tela sincronizada visualmente quando a página não tem
   *  mais um servidor revalidando ela por trás (caso da tela "Hoje"
   *  local-first). Só atualiza a aparência; quem decide se grava
   *  local ou manda pro servidor continua sendo a lógica abaixo. */
  aoAlternarLocal?: () => void;
  aoAjustarLocal?: (delta: number) => void;
  /** Etapa 146 — chamado depois que o SERVIDOR confirma a gravação
   *  (não na hora do clique, como aoAlternarLocal). Sem isso, o
   *  retrato local (snapshot) usado pra montar a tela de outros dias
   *  nunca ficava sabendo do check-in novo — aí ao trocar de dia e
   *  voltar, a tela recalculava a partir do retrato ANTIGO e parecia
   *  que a marcação tinha "sumido", mesmo já estando salva no banco. */
  aoConcluirMutacao?: () => void;
}) {
  const [pendente, iniciarTransicao] = useTransition();
  const [marcoAtingido, setMarcoAtingido] = useState<number | null>(null);
  const [mostrarNota, setMostrarNota] = useState(false);
  const [textoNota, setTextoNota] = useState("");
  const ehNumerico = item.tipo === "habito" && item.meta && item.meta.alvo > 1;
  // Etapa 230 — animação ao marcar e gesto de arrastar a linha
  const [pulsar, setPulsar] = useState(0);
  const [arrasto, setArrasto] = useState(0);
  const toque = useRef<{ x: number; y: number; decidido: boolean; horizontal: boolean } | null>(null);
  const arrastou = useRef(false);
  const podeAdiar = item.tipo === "tarefa" && !item.repete && !item.feito;
  const LIMIAR = 80;
  // Etapa 233 — toque duplo quando os dois completam no mesmo dia
  const [toqueDuplo, setToqueDuplo] = useState<{ sequencia: number } | null>(null);

  async function completouEmDupla() {
    if (!item.dupla) return;
    const r = await avisarDupla("feito", item.id, { data: dataISO });
    const todos = r ? r.tipo === "dupla" : item.dupla.parceiros.every((p) => p.feito);
    if (todos) setToqueDuplo({ sequencia: item.dupla.sequencia + 1 });
  }

  function aoTocar(e: React.TouchEvent) {
    toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, decidido: false, horizontal: false };
    arrastou.current = false;
  }
  function aoMover(e: React.TouchEvent) {
    const t = toque.current;
    if (!t) return;
    const dx = e.touches[0].clientX - t.x;
    const dy = e.touches[0].clientY - t.y;
    if (!t.decidido) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      t.decidido = true;
      t.horizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (!t.horizontal) return;
    arrastou.current = true;
    const limite = dx < 0 && !podeAdiar ? 0 : 140;
    setArrasto(Math.max(-limite, Math.min(140, dx)));
  }
  function aoSoltar() {
    const dx = arrasto;
    toque.current = null;
    setArrasto(0);
    if (dx > LIMIAR) {
      if (ehNumerico) ajustar(1);
      else alternar();
    } else if (dx < -LIMIAR && podeAdiar) {
      adiarParaAmanha();
    }
  }
  async function adiarParaAmanha() {
    const d = new Date(dataISO + "T12:00:00");
    d.setDate(d.getDate() + 1);
    const amanha = d.toLocaleDateString("sv-SE");
    vibrar(10);
    const { error } = await createClient().from("tarefas").update({ data: amanha }).eq("id", item.id);
    if (!error) {
      atualizarSnapshotEmTodasAsTelas();
      aoConcluirMutacao?.();
    }
  }

  function alternar() {
    if (!item.feito) {
      vibrar(15);
      setPulsar((n) => n + 1);
    }
    aoAlternarLocal?.();

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
        if (!feitoAntes && item.dupla) void completouEmDupla();
      } else {
        await alternarConclusaoTarefa(item.id, dataISO);
      }
      aoConcluirMutacao?.();
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
    if (delta > 0) {
      vibrar(10);
      setPulsar((n) => n + 1);
    }
    aoAjustarLocal?.(delta);

    if (typeof navigator !== "undefined" && !navigator.onLine && aoAjustarOffline) {
      aoAjustarOffline(delta);
      return;
    }
    const completou = !!item.meta && item.meta.atual < item.meta.alvo && item.meta.atual + delta >= item.meta.alvo;
    iniciarTransicao(async () => {
      await ajustarQuantidadeHabito(item.id, dataISO, delta);
      aoConcluirMutacao?.();
      if (completou && item.dupla) void completouEmDupla();
    });
  }

  const conteudo = (
    <>
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 ${classeFundoSuave(
          item.cor
        )}`}
      >
        <IconeHabito icone={item.icone} tamanho={20} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-[1.0625rem] font-medium truncate ${item.feito ? "line-through text-ink-400" : ""}`}>
          {item.titulo}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap empty:hidden">
          {item.atrasadaDesde && !item.feito && (
            <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-red-400/15 text-red-400">
              Atrasada desde {new Date(item.atrasadaDesde + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </span>
          )}
          {item.semana && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                item.semana.feitos >= item.semana.meta ? "bg-habito/15 text-habito" : "bg-base-700 text-ink-400"
              }`}
            >
              {item.semana.feitos >= item.semana.meta ? "Meta da semana ✓" : `${item.semana.feitos}/${item.semana.meta} na semana`}
            </span>
          )}
          {item.financa && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium font-mono ${
                item.financa.tipo === "receita" ? "bg-habito/15 text-habito" : "bg-financa/15 text-financa"
              }`}
            >
              {item.financa.tipo === "receita" ? "+" : "−"}R$ {item.financa.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          )}
          {!!item.prioridade && item.prioridade > 0 && (
            <span className={`text-xs flex items-center gap-1 ${PRIORIDADES[item.prioridade].classe}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${PRIORIDADES[item.prioridade].fundo}`} />
              {PRIORIDADES[item.prioridade].rotulo}
            </span>
          )}
          {item.progressoSubtarefas && (
            <span className="text-xs text-ink-400">
              {item.progressoSubtarefas.feitas}/{item.progressoSubtarefas.total}
            </span>
          )}
          {ehNumerico && item.meta && (
            <span className="text-sm text-ink-400">
              <span className={item.feito ? "text-habito font-medium" : "text-ink-100 font-medium"}>{item.meta.atual}</span> de{" "}
              {item.meta.alvo} {item.meta.unidade ?? ""}
            </span>
          )}
          {item.repete && (
            <span className="text-ink-400">
              <RefreshCw size={12} strokeWidth={2} />
            </span>
          )}
          {item.horarioLembrete && (
            <span className="text-xs text-ink-400 flex items-center gap-1">
              <Bell size={11} strokeWidth={2} /> {item.horarioLembrete.slice(0, 5)}
            </span>
          )}
          {/* Etapa 220 — adiar tarefa única sem abrir */}
          {item.tipo === "tarefa" && !item.repete && !item.feito && (
            // dentro do link da linha: não deixa o toque em "Adiar" abrir a tarefa
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <AdiarTarefa tarefaId={item.id} aoAdiar={aoConcluirMutacao} />
            </span>
          )}
        </div>

        {/* Etapa 230 — barra do contador (ex: 3 de 8 copos) */}
        {ehNumerico && item.meta && (
          <div className="h-1.5 bg-base-700 rounded-full overflow-hidden mt-1.5 max-w-[12rem]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${classeCor(item.cor)}`}
              style={{ width: `${Math.min(100, (item.meta.atual / item.meta.alvo) * 100)}%` }}
            />
          </div>
        )}
        {/* Etapa 230 — semana na linha: os últimos 7 dias */}
        {item.ultimos7 && item.ultimos7.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5" aria-label="Últimos 7 dias">
            {item.ultimos7.map((d, i) => {
              const ultimo = i === item.ultimos7!.length - 1;
              const feito = ultimo ? item.feito : d.estado === "feito";
              return (
                <span
                  key={d.dia}
                  title={d.dia.split("-").reverse().slice(0, 2).join("/")}
                  className={`w-2.5 h-2.5 rounded-full ${
                    feito
                      ? classeCor(item.cor)
                      : ultimo
                        ? "border border-ink-400"
                        : d.estado === "falhou"
                          ? "bg-base-600"
                          : "border border-base-600"
                  }`}
                />
              );
            })}
          </div>
        )}

        {!item.dupla && item.participantes && item.participantes.length > 1 && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {item.participantes.map((p, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${
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
    {toqueDuplo && item.dupla && (
      <ToqueDuplo
        habito={item.titulo}
        parceiro={item.dupla.parceiros.map((p) => p.nome).join(" e ")}
        sequencia={toqueDuplo.sequencia}
        aoFechar={() => setToqueDuplo(null)}
      />
    )}
    {marcoAtingido && (
      <CelebracaoConquista
        marco={marcoAtingido}
        nomeHabito={item.titulo}
        onFechar={() => setMarcoAtingido(null)}
      />
    )}
    {/* Etapa 227 — linha no estilo do Extrato: faixa lateral (verde feito,
       vermelho atrasada, cinza pendente) e toque abre o detalhe */}
    <li data-item className="relative overflow-hidden">
      {/* Etapa 230 — arrastar: → marca (ou +1), ← adia a tarefa pra amanhã */}
      {arrasto !== 0 && (
        <div
          aria-hidden
          className={`absolute inset-0 flex items-center px-5 text-base font-semibold ${
            arrasto > 0 ? `justify-start ${classeCor(item.cor)} text-base-900` : "justify-end bg-[#4C8FCC] text-white"
          }`}
        >
          {arrasto > 0 ? (ehNumerico ? "+1" : item.feito ? "Desmarcar" : "✓ Feito") : "Amanhã →"}
        </div>
      )}
      <div
        data-gesto-proprio="1"
        onTouchStart={aoTocar}
        onTouchMove={aoMover}
        onTouchEnd={aoSoltar}
        onClickCapture={(e) => {
          if (arrastou.current) {
            e.preventDefault();
            e.stopPropagation();
            arrastou.current = false;
          }
        }}
        className="relative flex items-center gap-3 bg-base-800 pl-4 pr-3 py-3.5"
        style={{ transform: arrasto ? `translateX(${arrasto}px)` : undefined, transition: arrasto ? "none" : "transform 200ms" }}
      >
      <span
        aria-hidden
        className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
          item.feito ? "bg-habito" : item.atrasadaDesde ? "bg-red-400" : "bg-base-600"
        }`}
      />
      <Link
        href={item.tipo === "tarefa" ? `/habitos/tarefas/${item.id}` : `/habitos/${item.id}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        {conteudo}
      </Link>

      {ehNumerico ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => ajustar(-1)}
            disabled={pendente}
            aria-label="Diminuir"
            className="w-10 h-10 rounded-full border border-base-600 flex items-center justify-center hover:border-ink-400 transition text-lg"
          >
            −
          </button>
          <button
            onClick={() => ajustar(1)}
            disabled={pendente}
            aria-label="Aumentar"
            key={`mais-${pulsar}`}
            className={`${pulsar ? "animate-pop" : ""} w-10 h-10 rounded-full flex items-center justify-center transition text-lg ${
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
          key={`chk-${pulsar}`}
          className={`${pulsar ? "animate-pop" : ""} w-11 h-11 rounded-full border-2 flex items-center justify-center transition shrink-0 ${
            item.feito ? `${classeCor(item.cor)} border-transparent` : "border-base-600 hover:border-ink-400"
          } ${pendente ? "opacity-60" : ""}`}
        >
          {item.feito && (
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
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
      </div>
    </li>

    {item.dupla && (
      <li className="list-none" style={{ borderTopWidth: 0 }}>
        <FaixaDupla habitoId={item.id} dupla={item.dupla} dataISO={dataISO} ehHoje={item.ehHoje ?? true} />
      </li>
    )}

    {mostrarNota && (
      <li className="bg-base-800 px-4 pb-4 pt-1">
        {/* Etapa 232 — campo maior (até 1000 letras), com contador */}
        <textarea
          value={textoNota}
          onChange={(e) => setTextoNota(e.target.value)}
          placeholder="Quer anotar algo sobre hoje? (opcional)"
          rows={4}
          maxLength={LIMITE_NOTA}
          autoFocus
          className="w-full bg-base-900 border border-base-600 rounded-2xl px-4 py-3 text-base text-ink-100 focus:border-ink-100 outline-none transition resize-y min-h-[6.5rem] max-h-72"
        />
        <p className={`text-xs text-right mb-2 ${textoNota.length > LIMITE_NOTA - 50 ? "text-red-400" : "text-ink-400"}`}>
          {textoNota.length}/{LIMITE_NOTA}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setMostrarNota(false);
              setTextoNota("");
            }}
            className="flex-1 text-sm text-ink-400 hover:text-ink-100 transition py-2.5"
          >
            Pular
          </button>
          <button
            onClick={salvarNota}
            disabled={!textoNota.trim()}
            className="flex-1 bg-habito text-base-900 text-sm font-semibold rounded-xl py-2.5 hover:opacity-90 transition disabled:opacity-40"
          >
            Salvar nota
          </button>
        </div>
      </li>
    )}
    </>
  );
}
