"use client";

// Etapa 341 — Agenda: dia / semana / mês, criar rápido ("jantar sexta 20h"),
// compromissos pessoais e compartilhados com "vou / talvez / não vou".
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Sparkles, MapPin, Repeat, Bell, CalendarDays } from "lucide-react";
import {
  corDoEvento,
  diaDaSemanaISO,
  diasEntreISO,
  hhmm,
  interpretarRapido,
  lembretesPadrao,
  ocorrenciasEntre,
  proximaOcorrencia,
  rotuloDia,
  somarDiasISO,
  type Ocorrencia,
  type Resposta,
} from "@/lib/agenda/eventos";
import { useAgenda, type EventoAgenda } from "@/lib/agenda/useAgenda";
import { FormEvento, type ValoresForm } from "@/components/agenda/FormEvento";
import { vibrar } from "@/lib/app/vibrar";

type Visao = "dia" | "semana" | "mes";
const SEMANA_LETRA = ["D", "S", "T", "Q", "Q", "S", "S"];
const SEMANA_NOME = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const HORA_PX = 52;
const PRIMEIRA_HORA = 6;

const hojeLocal = () => new Date().toLocaleDateString("sv-SE");
const minutosDe = (h: string) => {
  const [a, b] = h.split(":").map(Number);
  return a * 60 + b;
};
function inicioDaSemana(dia: string) {
  return somarDiasISO(dia, -diaDaSemanaISO(dia));
}
function inicioDoMes(dia: string) {
  return `${dia.slice(0, 7)}-01`;
}
function somarMeses(dia: string, n: number) {
  const [a, m] = dia.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return d.toISOString().slice(0, 10);
}

export function AgendaApp() {
  const params = useSearchParams();
  const ag = useAgenda();
  const [hoje, setHoje] = useState(hojeLocal);
  const [visao, setVisao] = useState<Visao>(() => {
    try {
      return (localStorage.getItem("vt-agenda-visao") as Visao) || "semana";
    } catch {
      return "semana";
    }
  });
  const [foco, setFoco] = useState(hoje);
  const [rapido, setRapido] = useState("");
  const [form, setForm] = useState<{ v: ValoresForm; dia?: string } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("vt-agenda-visao", visao);
    } catch {}
  }, [visao]);
  // o "hoje" vira à meia-noite com o app aberto
  useEffect(() => {
    const t = setInterval(() => setHoje(hojeLocal()), 60000);
    return () => clearInterval(t);
  }, []);

  // link da notificação: /tarefas/agenda?evento=ID → abre o evento
  const abriuLink = useRef(false);
  useEffect(() => {
    const id = params.get("evento");
    if (!id || abriuLink.current || !ag.eventos.length) return;
    const e = ag.eventos.find((x) => x.id === id);
    if (!e) return;
    abriuLink.current = true;
    const dia = proximaOcorrencia(e, hoje) ?? e.data;
    setFoco(dia);
    setVisao("dia");
    if (e.dono_id === ag.eu) abrirEdicao(e, dia);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, ag.eventos, ag.eu, hoje]);

  // período visível
  const periodo = useMemo(() => {
    if (visao === "dia") return { de: foco, ate: foco };
    if (visao === "semana") {
      const de = inicioDaSemana(foco);
      return { de, ate: somarDiasISO(de, 6) };
    }
    const de = inicioDaSemana(inicioDoMes(foco));
    return { de, ate: somarDiasISO(de, 41) };
  }, [visao, foco]);

  // eventos que eu recusei somem da minha agenda (dá pra ver em "Convites")
  const visiveis = useMemo(
    () => ag.eventos.filter((e) => e.dono_id === ag.eu || (e.evento_participantes ?? []).find((p) => p.usuario_id === ag.eu)?.resposta !== "nao_vou"),
    [ag.eventos, ag.eu]
  );
  const ocorrencias = useMemo(() => ocorrenciasEntre(visiveis, periodo.de, periodo.ate), [visiveis, periodo]);
  const porDia = useMemo(() => {
    const m = new Map<string, Ocorrencia[]>();
    for (const o of ocorrencias) m.set(o.dia, [...(m.get(o.dia) ?? []), o]);
    return m;
  }, [ocorrencias]);

  const convitesPendentes = useMemo(
    () => ag.eventos.filter((e) => e.dono_id !== ag.eu && (e.evento_participantes ?? []).some((p) => p.usuario_id === ag.eu && p.resposta === "pendente")),
    [ag.eventos, ag.eu]
  );

  // aniversários e datas especiais chegando (60 dias)
  const chegando = useMemo(
    () =>
      visiveis
        .filter((e) => e.tipo !== "evento")
        .map((e) => ({ e, dia: proximaOcorrencia(e, hoje, 60) }))
        .filter((x): x is { e: EventoAgenda; dia: string } => !!x.dia)
        .sort((a, b) => (a.dia < b.dia ? -1 : 1))
        .slice(0, 6),
    [visiveis, hoje]
  );

  const proximoHoje = useMemo(() => {
    const agora = new Date().toTimeString().slice(0, 5);
    return ocorrenciasEntre(visiveis, hoje, hoje).find((o) => !o.evento.hora_inicio || (hhmm(o.evento.hora_fim) ?? hhmm(o.evento.hora_inicio)!) >= agora);
  }, [visiveis, hoje]);

  const rascunho = useMemo(() => (rapido.trim().length > 2 ? interpretarRapido(rapido, hoje) : null), [rapido, hoje]);

  function navegar(n: number) {
    vibrar(8);
    if (visao === "dia") setFoco((f) => somarDiasISO(f, n));
    else if (visao === "semana") setFoco((f) => somarDiasISO(f, 7 * n));
    else setFoco((f) => somarMeses(f, n));
  }

  function abrirNovo(dia?: string, hora?: string) {
    setForm({ v: { data: dia ?? foco, hora_inicio: hora ?? null, hora_fim: hora ? `${String(Math.min(23, Number(hora.slice(0, 2)) + 1)).padStart(2, "0")}:${hora.slice(3, 5)}` : null } });
  }
  function abrirEdicao(e: EventoAgenda, dia: string) {
    if (e.id.startsWith("offline-")) {
      setAviso("Esse compromisso foi criado sem internet — dá pra editar quando ele sincronizar.");
      setTimeout(() => setAviso(null), 3500);
      return;
    }
    setForm({ v: { ...e, convidados: (e.evento_participantes ?? []).map((p) => p.usuario_id) }, dia });
  }

  async function adicionarRapido(detalhes = false) {
    if (!rascunho || !rascunho.titulo) return;
    const base: ValoresForm = {
      titulo: rascunho.titulo,
      data: rascunho.data,
      hora_inicio: rascunho.hora_inicio,
      hora_fim: rascunho.hora_fim,
      repetir: rascunho.repetir,
      tipo: rascunho.tipo,
      cor: rascunho.tipo === "aniversario" ? "rosa" : "nota",
      lembretes: lembretesPadrao(rascunho.tipo, !!rascunho.hora_inicio),
    };
    if (detalhes) {
      setForm({ v: base });
      setRapido("");
      return;
    }
    vibrar(15);
    const r = await ag.salvar(base, []);
    if (r) setAviso(r.includes("eventos") ? "A agenda ainda não foi ativada no servidor." : r);
    else {
      setAviso(`Adicionado: ${base.titulo} — ${rotuloDia(base.data!, hoje)}${base.hora_inicio ? ` às ${base.hora_inicio}` : ""}`);
      setRapido("");
      setFoco(base.data!);
    }
    setTimeout(() => setAviso(null), 3500);
  }

  async function responder(e: EventoAgenda, r: Resposta) {
    vibrar(12);
    const erro = await ag.responder(e.id, r);
    setAviso(erro ?? (r === "vou" ? "Confirmado! ✅" : r === "talvez" ? "Marcado como talvez 🤔" : "Você não vai — sumiu da sua agenda."));
    setTimeout(() => setAviso(null), 3000);
  }

  const tituloPeriodo =
    visao === "mes"
      ? `${MESES[Number(foco.slice(5, 7)) - 1]} ${foco.slice(0, 4)}`
      : visao === "semana"
        ? (() => {
            const de = inicioDaSemana(foco);
            const ate = somarDiasISO(de, 6);
            return `${Number(de.slice(8))} ${MESES[Number(de.slice(5, 7)) - 1].slice(0, 3).toLowerCase()} – ${Number(ate.slice(8))} ${MESES[Number(ate.slice(5, 7)) - 1].slice(0, 3).toLowerCase()}`;
          })()
        : `${SEMANA_NOME[diaDaSemanaISO(foco)]}, ${Number(foco.slice(8))} de ${MESES[Number(foco.slice(5, 7)) - 1].toLowerCase()}`;

  if (ag.semTabela)
    return (
      <div className="rounded-3xl border border-base-600 bg-base-800 p-6 text-center">
        <p className="text-4xl mb-2">🗓️</p>
        <p className="font-semibold mb-1">Agenda quase pronta</p>
        <p className="text-sm text-ink-400">Falta ativar a agenda no servidor (rodar o SQL da Etapa 341 no Supabase).</p>
      </div>
    );

  return (
    <div>
      {/* agora / próximo */}
      <div className="rounded-3xl border border-nota/30 p-4 mb-3 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgb(var(--c-nota) / 0.18), transparent 70%)" }}>
        <p className="text-xs uppercase tracking-[0.14em] text-ink-400 font-semibold mb-1">{proximoHoje ? "Próximo hoje" : "Hoje"}</p>
        {proximoHoje ? (
          <button type="button" onClick={() => (proximoHoje.evento.dono_id === ag.eu ? abrirEdicao(proximoHoje.evento as EventoAgenda, hoje) : undefined)} className="text-left w-full">
            <p className="text-lg font-display font-semibold leading-tight">{proximoHoje.evento.titulo}</p>
            <p className="text-sm text-ink-400">
              {hhmm(proximoHoje.evento.hora_inicio) ? `${hhmm(proximoHoje.evento.hora_inicio)}${hhmm(proximoHoje.evento.hora_fim) ? `–${hhmm(proximoHoje.evento.hora_fim)}` : ""}` : "Dia todo"}
              {proximoHoje.evento.local ? ` · 📍 ${proximoHoje.evento.local}` : ""}
            </p>
          </button>
        ) : (
          <p className="text-sm text-ink-400">Nada marcado pro resto do dia. Aproveite 🌿</p>
        )}
      </div>

      {/* criar rápido */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void adicionarRapido();
        }}
        className="mb-3"
      >
        <div className="flex items-center gap-2 bg-base-800 border border-base-600 rounded-2xl pl-3 pr-1.5 py-1.5">
          <Sparkles size={18} className="text-nota shrink-0" />
          <input
            value={rapido}
            onChange={(e) => setRapido(e.target.value)}
            placeholder="Ex: jantar sexta 20h"
            className="flex-1 min-w-0 bg-transparent outline-none text-base py-1.5 !shadow-none"
            enterKeyHint="done"
          />
          <button type="submit" disabled={!rascunho?.titulo} className="rounded-xl bg-nota text-base-900 text-sm font-semibold px-3 py-2 disabled:opacity-40">
            Adicionar
          </button>
        </div>
        {rascunho && rascunho.titulo && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2 animate-surgir">
            <span className="text-xs text-ink-400">Entendi:</span>
            <span className="text-xs rounded-full bg-base-700 px-2 py-0.5 font-medium">{rascunho.titulo}</span>
            {(rascunho.entendi.length ? rascunho.entendi : [rotuloDia(rascunho.data, hoje)]).map((x) => (
              <span key={x} className="text-xs rounded-full bg-nota/15 text-nota px-2 py-0.5">
                {x}
              </span>
            ))}
            <button type="button" onClick={() => adicionarRapido(true)} className="text-xs text-ink-400 underline ml-auto">
              mais detalhes
            </button>
          </div>
        )}
      </form>

      {aviso && <p className="mb-3 text-sm text-habito bg-habito/10 border border-habito/30 rounded-xl px-3 py-2 animate-surgir">{aviso}</p>}
      {ag.erro && <p className="mb-3 text-xs text-ink-400">{ag.erro}</p>}

      {/* convites esperando resposta */}
      {convitesPendentes.length > 0 && (
        <div className="rounded-2xl border border-financa/40 bg-financa/10 p-3 mb-3 space-y-2">
          <p className="text-sm font-semibold">📩 {convitesPendentes.length === 1 ? "1 convite" : `${convitesPendentes.length} convites`} pra responder</p>
          {convitesPendentes.map((e) => (
            <div key={e.id} className="flex items-center gap-2 flex-wrap">
              <span className="text-sm flex-1 min-w-0 truncate">
                <b>{e.titulo}</b> · {rotuloDia(proximaOcorrencia(e, hoje) ?? e.data, hoje)}
                {hhmm(e.hora_inicio) ? ` ${hhmm(e.hora_inicio)}` : ""} <span className="text-ink-400">de {ag.nomeDe(e.dono_id)}</span>
              </span>
              <BotoesResposta onResponder={(r) => responder(e, r)} />
            </div>
          ))}
        </div>
      )}

      {/* aniversários e datas chegando */}
      {chegando.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-1 px-1">
          {chegando.map(({ e, dia }) => {
            const faltam = diasEntreISO(hoje, dia);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => (e.dono_id === ag.eu ? abrirEdicao(e, dia) : (setFoco(dia), setVisao("dia")))}
                className="shrink-0 rounded-2xl border border-base-600 bg-base-800 px-3 py-2 text-left min-w-[8.5rem]"
              >
                <p className="text-xs text-ink-400">{e.tipo === "aniversario" ? "🎂" : "⭐"} {faltam === 0 ? "é hoje!" : faltam === 1 ? "amanhã" : `em ${faltam} dias`}</p>
                <p className="text-sm font-semibold truncate max-w-[10rem]">{e.titulo}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* visão + navegação */}
      <div className="flex items-center gap-2 mb-3">
        <div className="grid grid-cols-3 gap-1 bg-base-800 border border-base-600 rounded-full p-1 flex-1">
          {(["dia", "semana", "mes"] as Visao[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisao(v)}
              className={`rounded-full py-1.5 text-sm transition ${visao === v ? "bg-nota text-base-900 font-semibold" : "text-ink-400"}`}
            >
              {v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => abrirNovo()} aria-label="Novo compromisso" className="w-10 h-10 rounded-full bg-nota text-base-900 flex items-center justify-center shrink-0">
          <Plus size={22} strokeWidth={2.6} />
        </button>
      </div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <button type="button" onClick={() => navegar(-1)} aria-label="Anterior" className="w-9 h-9 rounded-full border border-base-600 flex items-center justify-center">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center min-w-0">
          <p key={tituloPeriodo} className="font-semibold truncate animate-surgir">
            {tituloPeriodo}
          </p>
          {!(periodo.de <= hoje && hoje <= periodo.ate) && (
            <button type="button" onClick={() => setFoco(hoje)} className="text-xs text-nota">
              Voltar pra hoje
            </button>
          )}
        </div>
        <button type="button" onClick={() => navegar(1)} aria-label="Próximo" className="w-9 h-9 rounded-full border border-base-600 flex items-center justify-center">
          <ChevronRight size={18} />
        </button>
      </div>

      {visao === "mes" && (
        <VisaoMes
          inicio={periodo.de}
          mesAtual={foco.slice(0, 7)}
          hoje={hoje}
          selecionado={foco}
          porDia={porDia}
          aoEscolher={(d) => setFoco(d)}
          aoDuploToque={(d) => {
            setFoco(d);
            setVisao("dia");
          }}
        />
      )}
      {visao === "semana" && (
        <div className="flex gap-1 mb-3">
          {Array.from({ length: 7 }, (_, i) => somarDiasISO(periodo.de, i)).map((d) => {
            const n = (porDia.get(d) ?? []).length;
            const sel = d === foco;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setFoco(d)}
                className={`flex-1 rounded-2xl py-2 flex flex-col items-center gap-0.5 border transition ${
                  sel ? "bg-nota text-base-900 border-nota" : d === hoje ? "border-nota/60" : "border-base-600 bg-base-800"
                }`}
              >
                <span className={`text-[11px] ${sel ? "" : "text-ink-400"}`}>{SEMANA_LETRA[diaDaSemanaISO(d)]}</span>
                <span className="text-base font-semibold leading-none">{Number(d.slice(8))}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${n ? (sel ? "bg-base-900" : "bg-nota") : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>
      )}

      {visao === "dia" ? (
        <VisaoDia
          dia={foco}
          hoje={hoje}
          ocorrencias={porDia.get(foco) ?? []}
          eu={ag.eu}
          nomeDe={ag.nomeDe}
          aoAbrir={(o) => (o.evento.dono_id === ag.eu ? abrirEdicao(o.evento as EventoAgenda, o.dia) : undefined)}
          aoNovo={(h) => abrirNovo(foco, h)}
          aoResponder={(e, r) => responder(e, r)}
        />
      ) : visao === "semana" ? (
        <div className="space-y-4">
          {/* dias que já passaram e ficaram vazios não ocupam espaço */}
          {Array.from({ length: 7 }, (_, i) => somarDiasISO(periodo.de, i))
            .filter((d) => d >= hoje || (porDia.get(d) ?? []).length || d === foco)
            .map((d) => (
            <ListaDoDia
              key={d}
              dia={d}
              hoje={hoje}
              destacado={d === foco}
              ocorrencias={porDia.get(d) ?? []}
              eu={ag.eu}
              nomeDe={ag.nomeDe}
              aoAbrir={(o) => (o.evento.dono_id === ag.eu ? abrirEdicao(o.evento as EventoAgenda, o.dia) : undefined)}
              aoNovo={() => abrirNovo(d)}
              aoResponder={(e, r) => responder(e, r)}
            />
          ))}
        </div>
      ) : (
        <ListaDoDia
          dia={foco}
          hoje={hoje}
          destacado
          ocorrencias={porDia.get(foco) ?? []}
          eu={ag.eu}
          nomeDe={ag.nomeDe}
          aoAbrir={(o) => (o.evento.dono_id === ag.eu ? abrirEdicao(o.evento as EventoAgenda, o.dia) : undefined)}
          aoNovo={() => abrirNovo(foco)}
          aoResponder={(e, r) => responder(e, r)}
        />
      )}

      {ag.carregando && !ag.eventos.length && <p className="text-sm text-ink-400 text-center mt-4">Carregando agenda...</p>}

      {form && (
        <FormEvento
          inicial={form.v}
          pessoas={ag.pessoas}
          diaOcorrencia={form.dia}
          aoFechar={() => setForm(null)}
          aoSalvar={(v, convidados) => ag.salvar(v, convidados)}
          aoApagar={form.v.id ? (soODia) => ag.apagar(form.v as EventoAgenda, soODia) : undefined}
        />
      )}
    </div>
  );
}

function BotoesResposta({ atual, onResponder }: { atual?: Resposta; onResponder: (r: Resposta) => void }) {
  const op: [Resposta, string][] = [
    ["vou", "Vou"],
    ["talvez", "Talvez"],
    ["nao_vou", "Não vou"],
  ];
  return (
    <div className="inline-flex bg-base-900 border border-base-600 rounded-full p-0.5 shrink-0">
      {op.map(([r, t]) => (
        <button
          key={r}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onResponder(r);
          }}
          className={`text-xs rounded-full px-2.5 py-1 transition ${
            atual === r ? (r === "vou" ? "bg-habito text-base-900 font-semibold" : r === "talvez" ? "bg-financa text-base-900 font-semibold" : "bg-red-400 text-base-900 font-semibold") : "text-ink-400"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function CartaoEvento({
  o,
  eu,
  nomeDe,
  aoAbrir,
  aoResponder,
}: {
  o: Ocorrencia;
  eu: string | null;
  nomeDe: (id: string) => string;
  aoAbrir: () => void;
  aoResponder: (r: Resposta) => void;
}) {
  const e = o.evento as EventoAgenda;
  const c = corDoEvento(e.cor);
  const ini = hhmm(e.hora_inicio);
  const fim = hhmm(e.hora_fim);
  const participantes = e.evento_participantes ?? [];
  const souConvidado = e.dono_id !== eu && !e.id.startsWith("offline-");
  const minha = participantes.find((p) => p.usuario_id === eu)?.resposta;
  const pessoas = [e.dono_id, ...participantes.map((p) => p.usuario_id)];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={aoAbrir}
      className="relative flex gap-3 bg-base-800 border border-base-600 rounded-2xl pl-4 pr-3 py-3 cursor-pointer"
    >
      <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full" style={{ background: c.hex }} aria-hidden />
      <div className="w-12 shrink-0 text-right">
        {ini ? (
          <>
            <p className="text-sm font-semibold font-mono leading-tight">{ini}</p>
            {fim && <p className="text-[11px] text-ink-400 font-mono">{fim}</p>}
          </>
        ) : (
          <p className="text-[11px] text-ink-400 leading-tight pt-0.5">{e.tipo === "aniversario" ? "🎂" : e.tipo === "data_especial" ? "⭐" : "Dia todo"}</p>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold leading-snug break-words">{e.titulo}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-400 mt-0.5">
          {e.local && (
            <span className="flex items-center gap-0.5 truncate max-w-[12rem]">
              <MapPin size={11} /> {e.local}
            </span>
          )}
          {e.repetir !== "nenhuma" && (
            <span className="flex items-center gap-0.5">
              <Repeat size={11} />
            </span>
          )}
          {(e.lembretes ?? []).length > 0 && (
            <span className="flex items-center gap-0.5">
              <Bell size={11} /> {(e.lembretes ?? []).length}
            </span>
          )}
          {souConvidado && <span>de {nomeDe(e.dono_id)}</span>}
          {e.id.startsWith("offline-") && <span className="text-financa">⏳ vai sincronizar</span>}
        </div>
        {participantes.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {pessoas.map((id) => {
              const r = id === e.dono_id ? "vou" : participantes.find((p) => p.usuario_id === id)?.resposta;
              const anel = r === "vou" ? "ring-habito" : r === "talvez" ? "ring-financa" : r === "nao_vou" ? "ring-red-400" : "ring-base-600";
              return (
                <span
                  key={id}
                  title={`${nomeDe(id)}: ${r === "vou" ? "vai" : r === "talvez" ? "talvez" : r === "nao_vou" ? "não vai" : "não respondeu"}`}
                  className={`w-6 h-6 rounded-full bg-base-700 ring-2 ${anel} flex items-center justify-center text-[10px] font-bold uppercase`}
                >
                  {nomeDe(id).slice(0, 1)}
                </span>
              );
            })}
          </div>
        )}
        {souConvidado && (
          <div className="mt-2">
            <BotoesResposta atual={minha} onResponder={aoResponder} />
          </div>
        )}
      </div>
    </div>
  );
}

function ListaDoDia({
  dia,
  hoje,
  destacado,
  ocorrencias,
  eu,
  nomeDe,
  aoAbrir,
  aoNovo,
  aoResponder,
}: {
  dia: string;
  hoje: string;
  destacado?: boolean;
  ocorrencias: Ocorrencia[];
  eu: string | null;
  nomeDe: (id: string) => string;
  aoAbrir: (o: Ocorrencia) => void;
  aoNovo: () => void;
  aoResponder: (e: EventoAgenda, r: Resposta) => void;
}) {
  const passou = dia < hoje;
  return (
    <section className={passou ? "opacity-60" : undefined}>
      <div className="flex items-center justify-between px-1 mb-1.5">
        <h3 className={`text-xs font-semibold uppercase tracking-[0.14em] flex items-center gap-2 ${dia === hoje ? "text-nota" : "text-ink-400"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${destacado || dia === hoje ? "bg-nota" : "bg-base-600"}`} />
          {rotuloDia(dia, hoje)}
          {dia !== hoje && Math.abs(diasEntreISO(hoje, dia)) > 1 ? "" : ` · ${Number(dia.slice(8))}/${dia.slice(5, 7)}`}
        </h3>
        <button type="button" onClick={aoNovo} className="text-xs text-ink-400 hover:text-nota" aria-label="Adicionar neste dia">
          + adicionar
        </button>
      </div>
      {ocorrencias.length ? (
        <div className="space-y-2">
          {ocorrencias.map((o) => (
            <CartaoEvento key={`${o.evento.id}-${o.dia}`} o={o} eu={eu} nomeDe={nomeDe} aoAbrir={() => aoAbrir(o)} aoResponder={(r) => aoResponder(o.evento as EventoAgenda, r)} />
          ))}
        </div>
      ) : (
        <button type="button" onClick={aoNovo} className="w-full text-left text-sm text-ink-400/70 border border-dashed border-base-600 rounded-2xl px-4 py-2.5">
          Livre
        </button>
      )}
    </section>
  );
}

function VisaoMes({
  inicio,
  mesAtual,
  hoje,
  selecionado,
  porDia,
  aoEscolher,
  aoDuploToque,
}: {
  inicio: string;
  mesAtual: string;
  hoje: string;
  selecionado: string;
  porDia: Map<string, Ocorrencia[]>;
  aoEscolher: (d: string) => void;
  aoDuploToque: (d: string) => void;
}) {
  const dias = Array.from({ length: 42 }, (_, i) => somarDiasISO(inicio, i));
  const semanas = dias.slice(35).every((d) => !d.startsWith(mesAtual)) ? dias.slice(0, 35) : dias;
  return (
    <div className="bg-base-800 border border-base-600 rounded-3xl p-2 mb-4">
      <div className="grid grid-cols-7 mb-1">
        {SEMANA_LETRA.map((l, i) => (
          <span key={i} className="text-center text-[11px] text-ink-400 py-1">
            {l}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {semanas.map((d) => {
          const lista = porDia.get(d) ?? [];
          const doMes = d.startsWith(mesAtual);
          const sel = d === selecionado;
          return (
            <button
              key={d}
              type="button"
              onClick={() => aoEscolher(d)}
              onDoubleClick={() => aoDuploToque(d)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition ${
                sel ? "bg-nota text-base-900" : d === hoje ? "ring-1 ring-nota/70" : ""
              } ${doMes ? "" : "opacity-35"}`}
            >
              <span className={`text-sm leading-none ${d === hoje && !sel ? "text-nota font-bold" : sel ? "font-bold" : ""}`}>{Number(d.slice(8))}</span>
              <span className="flex gap-0.5 h-1.5">
                {lista.slice(0, 3).map((o, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: sel ? "rgb(var(--c-base-900))" : corDoEvento(o.evento.cor).hex }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VisaoDia({
  dia,
  hoje,
  ocorrencias,
  eu,
  nomeDe,
  aoAbrir,
  aoNovo,
  aoResponder,
}: {
  dia: string;
  hoje: string;
  ocorrencias: Ocorrencia[];
  eu: string | null;
  nomeDe: (id: string) => string;
  aoAbrir: (o: Ocorrencia) => void;
  aoNovo: (hora: string) => void;
  aoResponder: (e: EventoAgenda, r: Resposta) => void;
}) {
  const diaTodo = ocorrencias.filter((o) => !o.evento.hora_inicio);
  const comHora = ocorrencias.filter((o) => o.evento.hora_inicio);
  const primeira = Math.min(PRIMEIRA_HORA, ...comHora.map((o) => Math.floor(minutosDe(hhmm(o.evento.hora_inicio)!) / 60)));
  const horas = Array.from({ length: 24 - primeira }, (_, i) => primeira + i);
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const caixa = useRef<HTMLDivElement>(null);
  // abre já perto da hora atual (ou do 1º compromisso)
  useEffect(() => {
    const alvo = dia === hoje ? agora.getHours() - 1 : comHora.length ? Math.floor(minutosDe(hhmm(comHora[0].evento.hora_inicio)!) / 60) - 1 : 8;
    caixa.current?.scrollTo({ top: Math.max(0, (alvo - primeira) * HORA_PX), behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dia]);

  // colunas pra compromissos que se encontram
  const blocos = comHora.map((o) => {
    const ini = minutosDe(hhmm(o.evento.hora_inicio)!);
    const fim = Math.max(ini + 30, o.evento.hora_fim ? minutosDe(hhmm(o.evento.hora_fim)!) : ini + 60);
    return { o, ini, fim, col: 0, cols: 1 };
  });
  blocos.sort((a, b) => a.ini - b.ini);
  for (let i = 0; i < blocos.length; i++) {
    const usados = blocos.filter((b, j) => j < i && b.fim > blocos[i].ini).map((b) => b.col);
    let c = 0;
    while (usados.includes(c)) c++;
    blocos[i].col = c;
  }
  for (const b of blocos) b.cols = Math.max(...blocos.filter((x) => x.ini < b.fim && x.fim > b.ini).map((x) => x.col)) + 1;

  const minAgora = agora.getHours() * 60 + agora.getMinutes();
  return (
    <div>
      {diaTodo.length > 0 && (
        <div className="space-y-2 mb-3">
          {diaTodo.map((o) => (
            <CartaoEvento key={o.evento.id} o={o} eu={eu} nomeDe={nomeDe} aoAbrir={() => aoAbrir(o)} aoResponder={(r) => aoResponder(o.evento as EventoAgenda, r)} />
          ))}
        </div>
      )}
      <div ref={caixa} className="relative bg-base-800 border border-base-600 rounded-3xl overflow-y-auto" style={{ height: "min(62vh, 560px)" }}>
        <div className="relative" style={{ height: horas.length * HORA_PX }}>
          {horas.map((h, i) => (
            <button
              key={h}
              type="button"
              onClick={() => aoNovo(`${String(h).padStart(2, "0")}:00`)}
              className="absolute left-0 right-0 flex items-start border-t border-base-600/50 text-left"
              style={{ top: i * HORA_PX, height: HORA_PX }}
              aria-label={`Novo às ${h}h`}
            >
              <span className="w-12 text-[11px] text-ink-400 font-mono text-right pr-2 -mt-2 bg-base-800">{String(h).padStart(2, "0")}:00</span>
            </button>
          ))}
          {blocos.map(({ o, ini, fim, col, cols }) => {
            const c = corDoEvento(o.evento.cor);
            const largura = `calc((100% - 3.5rem) / ${cols})`;
            return (
              <button
                key={o.evento.id}
                type="button"
                onClick={() => aoAbrir(o)}
                className="absolute rounded-xl px-2 py-1 text-left overflow-hidden border text-xs animate-surgir"
                style={{
                  top: ((ini - primeira * 60) / 60) * HORA_PX + 1,
                  height: Math.max(26, ((fim - ini) / 60) * HORA_PX - 2),
                  left: `calc(3.25rem + ${largura} * ${col})`,
                  width: `calc(${largura} - 4px)`,
                  background: `${c.hex}33`,
                  borderColor: `${c.hex}88`,
                }}
              >
                <p className="font-semibold text-ink-100 truncate">{o.evento.titulo}</p>
                <p className="text-ink-400 truncate">
                  {hhmm(o.evento.hora_inicio)}
                  {o.evento.hora_fim ? `–${hhmm(o.evento.hora_fim)}` : ""}
                  {o.evento.local ? ` · ${o.evento.local}` : ""}
                </p>
              </button>
            );
          })}
          {dia === hoje && minAgora >= primeira * 60 && (
            <div className="absolute left-11 right-0 pointer-events-none" style={{ top: ((minAgora - primeira * 60) / 60) * HORA_PX }}>
              <div className="h-0.5 bg-red-400 relative">
                <span className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-400" />
              </div>
            </div>
          )}
        </div>
      </div>
      {!ocorrencias.length && (
        <p className="text-center text-sm text-ink-400 mt-3 flex items-center justify-center gap-1.5">
          <CalendarDays size={15} /> Dia livre — toque num horário pra marcar algo.
        </p>
      )}
    </div>
  );
}
