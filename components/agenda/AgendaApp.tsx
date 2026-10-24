"use client";

// Etapa 341 — Agenda: dia / semana / mês, criar rápido ("jantar sexta 20h"),
// compromissos pessoais e compartilhados com "vou / talvez / não vou".
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Sparkles, MapPin, Repeat, Bell, CalendarDays, Palette } from "lucide-react";
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
import { explodirEm } from "@/lib/app/festa";
import { DetalheEvento } from "@/components/agenda/DetalheEvento";
import { coresDasPessoas, separarEmoji, sugerirEmoji, juntarEmoji } from "@/lib/agenda/visual";

type Visao = "dia" | "semana" | "mes";
const SEMANA_LETRA = ["D", "S", "T", "Q", "Q", "S", "S"];
const SEMANA_NOME = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const HORA_PX = 46; // Etapa 357 — grade mais enxuta
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
  // Etapa 357 — card completo (todo mundo vê; só o dono edita)
  const [detalhe, setDetalhe] = useState<Ocorrencia | null>(null);
  // Etapa 357 — pintar pela cor de quem é o dono (em vez da cor do compromisso)
  const [porPessoa, setPorPessoa] = useState<boolean>(() => {
    try {
      return localStorage.getItem("vt-agenda-cor-pessoa") === "1";
    } catch {
      return false;
    }
  });
  const botaoAdd = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem("vt-agenda-visao", visao);
      localStorage.setItem("vt-agenda-cor-pessoa", porPessoa ? "1" : "0");
    } catch {}
  }, [visao, porPessoa]);

  // cor de cada pessoa (igual nos dois celulares)
  const coresPessoa = useMemo(
    () => coresDasPessoas([ag.eu ?? "", ...ag.eventos.flatMap((e) => [e.dono_id, ...(e.evento_participantes ?? []).map((p) => p.usuario_id)])]),
    [ag.eventos, ag.eu]
  );
  const corDe = (id: string) => coresPessoa.get(id) ?? "#9C8FD9";
  const corFaixa = (e: { dono_id: string; cor?: string | null }) => (porPessoa ? corDe(e.dono_id) : corDoEvento(e.cor).hex);
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
    setDetalhe({ evento: e, dia });
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
  const abrirDetalhe = (o: Ocorrencia) => {
    vibrar(6);
    setDetalhe(o);
  };
  function abrirEdicao(e: EventoAgenda, dia: string) {
    setForm({ v: { ...e, convidados: (e.evento_participantes ?? []).map((p) => p.usuario_id) }, dia });
  }

  async function adicionarRapido(detalhes = false) {
    if (!rascunho || !rascunho.titulo) return;
    const base: ValoresForm = {
      // Etapa 357 — já entra com o emoji que combina ("🦷 Dentista")
      titulo: juntarEmoji(separarEmoji(rascunho.titulo).emoji ?? sugerirEmoji(rascunho.titulo, rascunho.tipo), rascunho.titulo),
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
      explodirEm(botaoAdd.current, { cor: "#9C8FD9", quantidade: 14, emojis: separarEmoji(base.titulo).emoji ? [separarEmoji(base.titulo).emoji!] : undefined });
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

  const props = { eu: ag.eu, nomeDe: ag.nomeDe, corDe, corFaixa, aoAbrir: abrirDetalhe, aoResponder: (e: EventoAgenda, r: Resposta) => responder(e, r) };
  const proxEmoji = proximoHoje ? separarEmoji(proximoHoje.evento.titulo) : null;

  return (
    <div>
      {/* agora / próximo — Etapa 357: uma linha só */}
      <button
        type="button"
        onClick={() => proximoHoje && abrirDetalhe({ evento: proximoHoje.evento, dia: hoje })}
        className="w-full flex items-center gap-3 rounded-2xl border border-nota/30 px-3 py-2.5 mb-2 text-left animate-entrar"
        style={{ background: "linear-gradient(135deg, rgb(var(--c-nota) / 0.16), transparent 70%)" }}
      >
        <span className="w-9 h-9 shrink-0 rounded-xl bg-nota/20 flex items-center justify-center text-lg">{proxEmoji?.emoji ?? (proximoHoje ? "⏰" : "🌿")}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-[10px] uppercase tracking-[0.14em] text-ink-400 font-semibold">{proximoHoje ? "Próximo hoje" : "Hoje"}</span>
          <span className="block text-sm font-semibold truncate">{proximoHoje ? proxEmoji!.texto : "Nada marcado pro resto do dia"}</span>
        </span>
        {proximoHoje && (
          <span className="text-xs text-ink-400 font-mono shrink-0">{hhmm(proximoHoje.evento.hora_inicio) ?? "dia todo"}</span>
        )}
      </button>

      {/* criar rápido */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void adicionarRapido();
        }}
        className="mb-2"
      >
        <div className="flex items-center gap-2 bg-base-800 border border-base-600 rounded-2xl pl-3 pr-1 py-1">
          <Sparkles size={16} className="text-nota shrink-0" />
          <input
            value={rapido}
            onChange={(e) => setRapido(e.target.value)}
            placeholder="Ex: dentista sexta 14h"
            className="flex-1 min-w-0 bg-transparent outline-none text-[15px] py-1.5 !shadow-none"
            enterKeyHint="done"
          />
          <button ref={botaoAdd} type="submit" disabled={!rascunho?.titulo} className="rounded-xl bg-nota text-base-900 text-xs font-semibold px-3 py-2 disabled:opacity-40">
            Adicionar
          </button>
        </div>
        {rascunho && rascunho.titulo && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 animate-surgir">
            <span className="text-[11px] text-ink-400">Entendi:</span>
            <span className="text-[11px] rounded-full bg-base-700 px-2 py-0.5 font-medium">
              {sugerirEmoji(rascunho.titulo, rascunho.tipo) ? `${sugerirEmoji(rascunho.titulo, rascunho.tipo)} ` : ""}
              {rascunho.titulo}
            </span>
            {(rascunho.entendi.length ? rascunho.entendi : [rotuloDia(rascunho.data, hoje)]).map((x) => (
              <span key={x} className="text-[11px] rounded-full bg-nota/15 text-nota px-2 py-0.5">
                {x}
              </span>
            ))}
            <button type="button" onClick={() => adicionarRapido(true)} className="text-[11px] text-ink-400 underline ml-auto">
              mais detalhes
            </button>
          </div>
        )}
      </form>

      {aviso && <p className="mb-2 text-sm text-habito bg-habito/10 border border-habito/30 rounded-xl px-3 py-2 animate-surgir">{aviso}</p>}
      {ag.erro && <p className="mb-2 text-xs text-ink-400">{ag.erro}</p>}

      {/* convites esperando resposta */}
      {convitesPendentes.length > 0 && (
        <div className="rounded-2xl border border-financa/40 bg-financa/10 p-2.5 mb-2 space-y-2 animate-entrar">
          <p className="text-xs font-semibold">📩 {convitesPendentes.length === 1 ? "1 convite" : `${convitesPendentes.length} convites`} pra responder</p>
          {convitesPendentes.map((e) => {
            const dia = proximaOcorrencia(e, hoje) ?? e.data;
            return (
              <div key={e.id} className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={() => abrirDetalhe({ evento: e, dia })} className="text-sm flex-1 min-w-0 truncate text-left">
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: corDe(e.dono_id) }} />
                  <b>{e.titulo}</b> · {rotuloDia(dia, hoje)}
                  {hhmm(e.hora_inicio) ? ` ${hhmm(e.hora_inicio)}` : ""} <span className="text-ink-400">de {ag.nomeDe(e.dono_id)}</span>
                </button>
                <BotoesResposta onResponder={(r) => responder(e, r)} />
              </div>
            );
          })}
        </div>
      )}

      {/* aniversários e datas chegando */}
      {chegando.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2 -mx-1 px-1">
          {chegando.map(({ e, dia }, i) => {
            const faltam = diasEntreISO(hoje, dia);
            const { emoji, texto } = separarEmoji(e.titulo);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => abrirDetalhe({ evento: e, dia })}
                className="shrink-0 flex items-center gap-2 rounded-xl border border-base-600 bg-base-800 pl-2 pr-3 py-1.5 text-left animate-entrar"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className={`text-lg ${faltam === 0 ? "animate-bounce" : ""}`}>{emoji ?? (e.tipo === "aniversario" ? "🎂" : "⭐")}</span>
                <span>
                  <span className="block text-[11px] text-ink-400 leading-tight">{faltam === 0 ? "é hoje!" : faltam === 1 ? "amanhã" : `em ${faltam} dias`}</span>
                  <span className="block text-xs font-semibold truncate max-w-[8.5rem]">{texto}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* visão + navegação — Etapa 357: tudo numa barra fina */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className="grid grid-cols-3 gap-0.5 bg-base-800 border border-base-600 rounded-full p-0.5 flex-1">
          {(["dia", "semana", "mes"] as Visao[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisao(v)}
              className={`rounded-full py-1 text-xs transition ${visao === v ? "bg-nota text-base-900 font-semibold" : "text-ink-400"}`}
            >
              {v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            vibrar(8);
            setPorPessoa((p) => !p);
          }}
          aria-label={porPessoa ? "Colorir pela cor do compromisso" : "Colorir pela cor de cada pessoa"}
          title={porPessoa ? "Cores: por pessoa" : "Cores: por compromisso"}
          className={`h-8 shrink-0 rounded-full border px-2.5 flex items-center gap-1 text-[11px] transition ${porPessoa ? "border-nota bg-nota/15 text-nota" : "border-base-600 text-ink-400"}`}
        >
          <Palette size={13} /> {porPessoa ? "Pessoa" : "Cor"}
        </button>
        <button type="button" onClick={() => abrirNovo()} aria-label="Novo compromisso" className="w-8 h-8 rounded-full bg-nota text-base-900 flex items-center justify-center shrink-0">
          <Plus size={19} strokeWidth={2.6} />
        </button>
      </div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <button type="button" onClick={() => navegar(-1)} aria-label="Anterior" className="w-8 h-8 rounded-full border border-base-600 flex items-center justify-center">
          <ChevronLeft size={16} />
        </button>
        <div className="text-center min-w-0 flex items-baseline gap-2 justify-center">
          <p key={tituloPeriodo} className="text-sm font-semibold truncate animate-surgir">
            {tituloPeriodo}
          </p>
          {!(periodo.de <= hoje && hoje <= periodo.ate) && (
            <button type="button" onClick={() => setFoco(hoje)} className="text-[11px] text-nota shrink-0">
              hoje
            </button>
          )}
        </div>
        <button type="button" onClick={() => navegar(1)} aria-label="Próximo" className="w-8 h-8 rounded-full border border-base-600 flex items-center justify-center">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* legenda das cores das pessoas */}
      {porPessoa && coresPessoa.size > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-2 animate-surgir">
          {[...coresPessoa.entries()]
            .filter(([id]) => id)
            .map(([id, cor]) => (
              <span key={id} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]" style={{ background: `${cor}22`, color: cor }}>
                <span className="w-2 h-2 rounded-full" style={{ background: cor }} />
                {ag.nomeDe(id)}
              </span>
            ))}
        </div>
      )}

      {visao === "mes" && (
        <VisaoMes
          inicio={periodo.de}
          mesAtual={foco.slice(0, 7)}
          hoje={hoje}
          selecionado={foco}
          porDia={porDia}
          corFaixa={corFaixa}
          aoEscolher={(d) => setFoco(d)}
          aoDuploToque={(d) => {
            setFoco(d);
            setVisao("dia");
          }}
        />
      )}
      {visao === "semana" && (
        <div className="flex gap-1 mb-2">
          {Array.from({ length: 7 }, (_, i) => somarDiasISO(periodo.de, i)).map((d) => {
            const lista = porDia.get(d) ?? [];
            const sel = d === foco;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setFoco(d)}
                className={`flex-1 rounded-xl py-1.5 flex flex-col items-center gap-0.5 border transition ${
                  sel ? "bg-nota text-base-900 border-nota scale-[1.04]" : d === hoje ? "border-nota/60" : "border-base-600 bg-base-800"
                }`}
              >
                <span className={`text-[10px] ${sel ? "" : "text-ink-400"}`}>{SEMANA_LETRA[diaDaSemanaISO(d)]}</span>
                <span className="text-sm font-semibold leading-none">{Number(d.slice(8))}</span>
                <span className="flex gap-0.5 h-1">
                  {lista.slice(0, 3).map((o, i) => (
                    <span key={i} className="w-1 h-1 rounded-full" style={{ background: sel ? "rgb(var(--c-base-900))" : corFaixa(o.evento) }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {visao === "dia" ? (
        <VisaoDia dia={foco} hoje={hoje} ocorrencias={porDia.get(foco) ?? []} {...props} aoNovo={(h) => abrirNovo(foco, h)} />
      ) : visao === "semana" ? (
        <div className="space-y-3">
          {/* dias que já passaram e ficaram vazios não ocupam espaço */}
          {Array.from({ length: 7 }, (_, i) => somarDiasISO(periodo.de, i))
            .filter((d) => d >= hoje || (porDia.get(d) ?? []).length || d === foco)
            .map((d) => (
              <ListaDoDia key={d} dia={d} hoje={hoje} destacado={d === foco} ocorrencias={porDia.get(d) ?? []} {...props} aoNovo={() => abrirNovo(d)} />
            ))}
        </div>
      ) : (
        <ListaDoDia dia={foco} hoje={hoje} destacado ocorrencias={porDia.get(foco) ?? []} {...props} aoNovo={() => abrirNovo(foco)} />
      )}

      {ag.carregando && !ag.eventos.length && <p className="text-sm text-ink-400 text-center mt-4">Carregando agenda...</p>}

      {detalhe && (
        <DetalheEvento
          o={detalhe}
          eu={ag.eu}
          hoje={hoje}
          nomeDe={ag.nomeDe}
          corDe={corDe}
          aoFechar={() => setDetalhe(null)}
          aoEditar={() => {
            const d = detalhe;
            setDetalhe(null);
            abrirEdicao(d.evento as EventoAgenda, d.dia);
          }}
          aoResponder={(r) => void responder(detalhe.evento as EventoAgenda, r)}
          aoSair={async () => {
            const id = detalhe.evento.id;
            setDetalhe(null);
            await ag.sair(id);
            setAviso("Você saiu desse compromisso.");
            setTimeout(() => setAviso(null), 3000);
          }}
        />
      )}

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

type PropsLista = {
  eu: string | null;
  nomeDe: (id: string) => string;
  corDe: (id: string) => string;
  corFaixa: (e: { dono_id: string; cor?: string | null }) => string;
  aoAbrir: (o: Ocorrencia) => void;
  aoResponder: (e: EventoAgenda, r: Resposta) => void;
};

/** acontecendo agora? (pra piscar o pontinho) */
function acontecendoAgora(o: Ocorrencia, hoje: string) {
  if (o.dia !== hoje || !o.evento.hora_inicio) return false;
  const agora = new Date().toTimeString().slice(0, 5);
  const ini = hhmm(o.evento.hora_inicio)!;
  const fim = hhmm(o.evento.hora_fim) ?? `${String(Math.min(23, Number(ini.slice(0, 2)) + 1)).padStart(2, "0")}:${ini.slice(3)}`;
  return agora >= ini && agora < fim;
}

// Etapa 357 — card enxuto: emoji, título, hora, local e a bolinha da cor
// de quem é o dono. Tocar abre o card completo (DetalheEvento).
function CartaoEvento({ o, hoje, indice, eu, nomeDe, corDe, corFaixa, aoAbrir, aoResponder }: PropsLista & { o: Ocorrencia; hoje: string; indice: number }) {
  const e = o.evento as EventoAgenda;
  const faixa = corFaixa(e);
  const { emoji, texto } = separarEmoji(e.titulo);
  const ini = hhmm(e.hora_inicio);
  const fim = hhmm(e.hora_fim);
  const participantes = e.evento_participantes ?? [];
  const souConvidado = e.dono_id !== eu && !e.pendente;
  const minha = participantes.find((p) => p.usuario_id === eu)?.resposta;
  const pessoas = [e.dono_id, ...participantes.map((p) => p.usuario_id)];
  const agora = acontecendoAgora(o, hoje);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => aoAbrir(o)}
      onKeyDown={(ev) => ev.key === "Enter" && aoAbrir(o)}
      className="relative flex items-center gap-2.5 bg-base-800 border border-base-600 rounded-xl pl-3 pr-2.5 py-2 cursor-pointer animate-entrar hover:border-ink-400/40"
      style={{ animationDelay: `${Math.min(indice, 8) * 35}ms`, boxShadow: agora ? `0 0 0 1px ${faixa}88, 0 6px 18px -8px ${faixa}` : undefined }}
    >
      <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ background: faixa }} aria-hidden />
      <span
        className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-base"
        style={{ background: `${faixa}22` }}
        aria-hidden
      >
        {emoji ?? (e.tipo === "aniversario" ? "🎂" : e.tipo === "data_especial" ? "⭐" : <span className="w-2 h-2 rounded-full" style={{ background: faixa }} />)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold leading-tight truncate">{texto}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-ink-400 mt-0.5 min-w-0">
          <span className="font-mono shrink-0">{ini ? `${ini}${fim ? `–${fim}` : ""}` : "dia todo"}</span>
          {agora && (
            <span className="flex items-center gap-1 text-red-400 shrink-0">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-red-400" />
              </span>
              agora
            </span>
          )}
          {e.local && (
            <span className="flex items-center gap-0.5 truncate min-w-0">
              <MapPin size={10} className="shrink-0" /> <span className="truncate">{e.local}</span>
            </span>
          )}
          {e.repetir !== "nenhuma" && <Repeat size={10} className="shrink-0" />}
          {(e.lembretes ?? []).length > 0 && <Bell size={10} className="shrink-0" />}
          {e.pendente && <span className="text-financa shrink-0">⏳</span>}
        </div>
        {souConvidado && minha === "pendente" && (
          <div className="mt-1.5" onClick={(ev) => ev.stopPropagation()}>
            <BotoesResposta atual={minha} onResponder={(r) => aoResponder(e, r)} />
          </div>
        )}
      </div>
      {/* quem: bolinhas na cor de cada pessoa (o dono primeiro) */}
      <div className="flex -space-x-1.5 shrink-0">
        {(participantes.length ? pessoas.slice(0, 3) : [e.dono_id]).map((id) => {
          const r = id === e.dono_id ? "vou" : participantes.find((p) => p.usuario_id === id)?.resposta;
          return (
            <span
              key={id}
              title={`${nomeDe(id)}${id === e.dono_id ? " (dono)" : r === "vou" ? ": vai" : r === "talvez" ? ": talvez" : r === "nao_vou" ? ": não vai" : ": não respondeu"}`}
              className={`w-5 h-5 rounded-full ring-2 ring-base-800 flex items-center justify-center text-[9px] font-bold uppercase text-base-900 ${r === "nao_vou" ? "opacity-40" : ""}`}
              style={{ background: corDe(id) }}
            >
              {nomeDe(id).slice(0, 1)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ListaDoDia({ dia, hoje, destacado, ocorrencias, aoNovo, ...props }: PropsLista & { dia: string; hoje: string; destacado?: boolean; ocorrencias: Ocorrencia[]; aoNovo: () => void }) {
  const passou = dia < hoje;
  return (
    <section className={passou ? "opacity-60" : undefined}>
      <div className="flex items-center justify-between px-1 mb-1">
        <h3 className={`text-[11px] font-semibold uppercase tracking-[0.14em] flex items-center gap-1.5 ${dia === hoje ? "text-nota" : "text-ink-400"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${destacado || dia === hoje ? "bg-nota" : "bg-base-600"}`} />
          {rotuloDia(dia, hoje)}
          {dia !== hoje && Math.abs(diasEntreISO(hoje, dia)) > 1 ? "" : ` · ${Number(dia.slice(8))}/${dia.slice(5, 7)}`}
        </h3>
        <button type="button" onClick={aoNovo} className="text-[11px] text-ink-400 hover:text-nota" aria-label="Adicionar neste dia">
          + adicionar
        </button>
      </div>
      {ocorrencias.length ? (
        <div className="space-y-1.5">
          {ocorrencias.map((o, i) => (
            <CartaoEvento key={`${o.evento.id}-${o.dia}`} o={o} hoje={hoje} indice={i} {...props} />
          ))}
        </div>
      ) : (
        <button type="button" onClick={aoNovo} className="w-full text-left text-xs text-ink-400/70 border border-dashed border-base-600 rounded-xl px-3 py-2">
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
  corFaixa,
  aoEscolher,
  aoDuploToque,
}: {
  inicio: string;
  mesAtual: string;
  hoje: string;
  selecionado: string;
  porDia: Map<string, Ocorrencia[]>;
  corFaixa: (e: { dono_id: string; cor?: string | null }) => string;
  aoEscolher: (d: string) => void;
  aoDuploToque: (d: string) => void;
}) {
  const dias = Array.from({ length: 42 }, (_, i) => somarDiasISO(inicio, i));
  const semanas = dias.slice(35).every((d) => !d.startsWith(mesAtual)) ? dias.slice(0, 35) : dias;
  return (
    <div className="bg-base-800 border border-base-600 rounded-2xl p-1.5 mb-3 animate-entrar">
      <div className="grid grid-cols-7">
        {SEMANA_LETRA.map((l, i) => (
          <span key={i} className="text-center text-[10px] text-ink-400 py-0.5">
            {l}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {semanas.map((d) => {
          const lista = porDia.get(d) ?? [];
          const doMes = d.startsWith(mesAtual);
          const sel = d === selecionado;
          const emoji = lista.map((o) => separarEmoji(o.evento.titulo).emoji).find(Boolean);
          return (
            <button
              key={d}
              type="button"
              onClick={() => aoEscolher(d)}
              onDoubleClick={() => aoDuploToque(d)}
              className={`h-11 rounded-lg flex flex-col items-center justify-center gap-0.5 transition ${
                sel ? "bg-nota text-base-900 scale-105" : d === hoje ? "ring-1 ring-nota/70" : ""
              } ${doMes ? "" : "opacity-35"}`}
            >
              <span className={`text-[13px] leading-none ${d === hoje && !sel ? "text-nota font-bold" : sel ? "font-bold" : ""}`}>{Number(d.slice(8))}</span>
              {emoji && lista.length === 1 ? (
                <span className="text-[11px] leading-none">{emoji}</span>
              ) : (
                <span className="flex gap-0.5 h-1.5">
                  {lista.slice(0, 3).map((o, i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: sel ? "rgb(var(--c-base-900))" : corFaixa(o.evento) }} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VisaoDia({ dia, hoje, ocorrencias, aoNovo, ...props }: PropsLista & { dia: string; hoje: string; ocorrencias: Ocorrencia[]; aoNovo: (hora: string) => void }) {
  const { corDe, corFaixa, aoAbrir } = props;
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
        <div className="space-y-1.5 mb-2">
          {diaTodo.map((o, i) => (
            <CartaoEvento key={o.evento.id} o={o} hoje={hoje} indice={i} {...props} />
          ))}
        </div>
      )}
      <div ref={caixa} className="relative bg-base-800 border border-base-600 rounded-2xl overflow-y-auto overflow-x-hidden" style={{ height: "min(64vh, 560px)" }}>
        <div className="relative" style={{ height: horas.length * HORA_PX }}>
          {horas.map((h, i) => (
            <button
              key={h}
              type="button"
              onClick={() => aoNovo(`${String(h).padStart(2, "0")}:00`)}
              className="absolute left-0 right-0 flex items-start border-t border-base-600/40 text-left hover:bg-base-700/30"
              style={{ top: i * HORA_PX, height: HORA_PX }}
              aria-label={`Novo às ${h}h`}
            >
              <span className="w-11 text-[10px] text-ink-400 font-mono text-right pr-1.5 -mt-1.5 bg-base-800">{String(h).padStart(2, "0")}:00</span>
            </button>
          ))}
          {blocos.map(({ o, ini, fim, col, cols }, i) => {
            const faixa = corFaixa(o.evento);
            const largura = `calc((100% - 3.1rem) / ${cols})`;
            const { emoji, texto } = separarEmoji(o.evento.titulo);
            const altura = Math.max(24, ((fim - ini) / 60) * HORA_PX - 2);
            return (
              <button
                key={o.evento.id}
                type="button"
                onClick={() => aoAbrir(o)}
                className="absolute rounded-lg pl-2 pr-1.5 py-0.5 text-left overflow-hidden border text-[11px] animate-entrar"
                style={{
                  top: ((ini - primeira * 60) / 60) * HORA_PX + 1,
                  height: altura,
                  left: `calc(2.9rem + ${largura} * ${col})`,
                  width: `calc(${largura} - 3px)`,
                  background: `${faixa}2e`,
                  borderColor: `${faixa}80`,
                  animationDelay: `${i * 40}ms`,
                }}
              >
                <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: corDe(o.evento.dono_id) }} aria-hidden />
                <p className="font-semibold text-ink-100 truncate">
                  {emoji ? `${emoji} ` : ""}
                  {texto}
                </p>
                {altura > 34 && (
                  <p className="text-ink-400 truncate">
                    {hhmm(o.evento.hora_inicio)}
                    {o.evento.hora_fim ? `–${hhmm(o.evento.hora_fim)}` : ""}
                    {o.evento.local ? ` · ${o.evento.local}` : ""}
                  </p>
                )}
              </button>
            );
          })}
          {dia === hoje && minAgora >= primeira * 60 && (
            <div className="absolute left-10 right-0 pointer-events-none" style={{ top: ((minAgora - primeira * 60) / 60) * HORA_PX }}>
              <div className="h-0.5 bg-red-400 relative">
                <span className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>
      {!ocorrencias.length && (
        <p className="text-center text-xs text-ink-400 mt-2 flex items-center justify-center gap-1.5">
          <CalendarDays size={14} /> Dia livre — toque num horário pra marcar algo.
        </p>
      )}
    </div>
  );
}
