"use client";

// Etapa 312 — trilhas e desafios: hábitos prontos pra adicionar com um
// toque e desafios de 7/21/30 dias que dão medalha e moedas.
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSnapshotOffline, atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { useMascote } from "@/lib/mascote/useMascote";
import {
  comecarDesafio,
  desafioAtivo,
  DESAFIOS,
  desistirDesafio,
  estadoDoDesafio,
  habitoDoModelo,
  infoDesafio,
  medalhas,
  pegarMedalha,
  recomecarDesafio,
  TRILHAS,
  type Duracao,
  type EstadoDesafio,
} from "@/lib/habitos/trilhas";
import type { DadosMascote, DesafioSalvo } from "@/lib/mascote/mascote";
import { criarHabitoDoModelo } from "./actions";
import { IconeHabito } from "@/components/IconeHabito";
import { hexDaCor } from "@/lib/agenda/estilo";
import { CarregandoTela } from "@/components/Esqueleto";
import { CabecalhoPagina } from "@/components/CabecalhoPagina";
import { vibrar } from "@/lib/app/vibrar";
import { chuvaDeConfete, textoFlutuante } from "@/lib/app/festa";

export default function TrilhasPage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const { mascote, salvar, salvando } = useMascote(snapshot, hoje);
  const [aberta, setAberta] = useState<string | null>(TRILHAS[0].id);
  const [escolhendo, setEscolhendo] = useState<string | null>(null);
  const [criando, setCriando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const habitos = useMemo(() => ((snapshot?.habitos ?? []) as any[]).filter((h) => !h.arquivado), [snapshot]);
  const checkins = (snapshot?.habitoCheckins ?? []) as any[];
  const desafios = useMemo(() => {
    const l = (mascote?.desafios ?? []).filter((d) => !d.resultado);
    return l.map((d) => {
      const h = habitos.find((x) => x.id === d.habitoId) ?? null;
      return { d, h, e: estadoDoDesafio(d, h, checkins, hoje) };
    });
  }, [mascote, habitos, checkins, hoje]);

  if (snapshot === undefined) return <CarregandoTela cartoes={3} linhas={3} />;
  const med = medalhas(mascote);

  async function guardar(novo: DadosMascote | null) {
    if (!novo) return false;
    return salvar(novo);
  }

  async function comecar(habitoId: string, dias: Duracao) {
    if (!mascote) return;
    setEscolhendo(null);
    vibrar(15);
    await guardar(comecarDesafio(mascote, habitoId, dias, hoje));
  }

  async function adicionar(modeloId: string, dias: Duracao | null) {
    setErro(null);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErro("Sem internet agora — tente de novo quando conectar.");
      return;
    }
    setCriando(modeloId);
    const r = await criarHabitoDoModelo(modeloId);
    if (!r.ok || !r.id) {
      setCriando(null);
      setErro(r.erro ?? "Não deu pra criar agora");
      return;
    }
    vibrar([10, 30, 10]);
    if (dias && mascote) await guardar(comecarDesafio(mascote, r.id, dias, hoje));
    await atualizarSnapshotEmTodasAsTelas();
    setCriando(null);
    setEscolhendo(null);
  }

  return (
    <main ref={ref} className="pagina-curta px-6 md:px-12 pt-4 pb-12">
      <CabecalhoPagina voltarHref="/habitos/mundo" voltarTexto="Mundo" emoji="🧭" titulo="Trilhas e desafios" subtitulo="Hábitos prontos e desafios com medalha" />

      {/* medalhas */}
      <div className="flex items-center gap-2 mb-4">
        {(
          [
            ["🥉", med.bronze, "7 dias"],
            ["🥈", med.prata, "21 dias"],
            ["🥇", med.ouro, "30 dias"],
          ] as const
        ).map(([e, n, t]) => (
          <div key={e} className={`flex-1 rounded-2xl border px-3 py-2 text-center ${n ? "border-financa/50 bg-financa/10" : "border-base-600 bg-base-800"}`}>
            <p className={`text-2xl ${n ? "" : "grayscale opacity-50"}`}>{e}</p>
            <p className="text-sm font-bold">{n}</p>
            <p className="text-[10px] text-ink-400">{t}</p>
          </div>
        ))}
      </div>

      {!mascote && (
        <p className="text-sm text-ink-300 rounded-2xl border border-base-600 bg-base-800 px-4 py-3 mb-4">
          Os desafios e as medalhas ficam com o seu mascote.{" "}
          <Link href="/habitos/mascote" className="text-habito font-semibold">
            Chocar meu ovinho 🐣
          </Link>
        </p>
      )}
      {erro && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2 mb-4">{erro}</p>}

      {/* desafios em andamento */}
      {desafios.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-wide text-ink-400 mb-2">Seus desafios</h2>
          <div className="space-y-2">
            {desafios.map(({ d, h, e }) => (
              <CartaoDesafio
                key={d.id}
                d={d}
                nome={h?.nome ?? "Hábito apagado"}
                negativo={!!h?.eh_negativo}
                e={e}
                ocupado={salvando}
                aoPegar={async () => {
                  if (!mascote) return;
                  const novo = pegarMedalha(mascote, d, e, hoje);
                  if (!novo) return;
                  vibrar([20, 50, 30]);
                  chuvaDeConfete({ quantidade: 80 });
                  textoFlutuante(ref.current, `${infoDesafio(d.dias).emoji} +${infoDesafio(d.dias).premio} 🪙`, "#F2C46D");
                  await guardar(novo);
                }}
                aoRecomecar={async () => mascote && (await guardar(recomecarDesafio(mascote, d, hoje)))}
                aoDesistir={async () => mascote && (await guardar(desistirDesafio(mascote, d, hoje)))}
              />
            ))}
          </div>
        </section>
      )}

      {/* trilhas */}
      <h2 className="text-xs uppercase tracking-wide text-ink-400 mb-2">Trilhas</h2>
      <div className="space-y-2 mb-6">
        {TRILHAS.map((t) => {
          const abertaAgora = aberta === t.id;
          const tem = t.modelos.filter((m) => habitoDoModelo(habitos, m)).length;
          return (
            <section key={t.id} className="rounded-3xl border border-base-600/70 bg-base-800 overflow-hidden">
              <button type="button" onClick={() => setAberta(abertaAgora ? null : t.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                <span className="text-2xl">{t.emoji}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold">{t.nome}</span>
                  <span className="block text-xs text-ink-400 truncate">{t.descricao}</span>
                </span>
                <span className="text-[11px] text-ink-400 shrink-0">
                  {tem}/{t.modelos.length}
                </span>
                <span className={`text-ink-400 transition-transform ${abertaAgora ? "rotate-180" : ""}`}>⌄</span>
              </button>
              {abertaAgora && (
                <ul className="px-3 pb-3 space-y-2">
                  {t.modelos.map((m) => {
                    const ja = habitoDoModelo(habitos, m);
                    const ativo = ja ? desafioAtivo(mascote, ja.id) : null;
                    const chave = `m:${m.id}`;
                    return (
                      <li key={m.id} className="rounded-2xl bg-base-900/40 px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexDaCor(m.cor) + "33", color: hexDaCor(m.cor) }}>
                            <IconeHabito icone={m.icone} tamanho={18} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-tight">
                              {m.nome}
                              {m.meta ? <span className="text-ink-400 font-normal"> · {m.meta} {m.unidade}</span> : null}
                              {m.negativo ? <span className="text-ink-400 font-normal"> · de parar</span> : null}
                            </p>
                            <p className="text-[11px] text-ink-400 leading-tight mt-0.5">{m.dica}</p>
                          </div>
                          {ja ? (
                            ativo ? (
                              <span className="text-[11px] text-habito font-semibold shrink-0">Em desafio</span>
                            ) : (
                              <button
                                type="button"
                                disabled={!mascote}
                                onClick={() => setEscolhendo(escolhendo === chave ? null : chave)}
                                className="shrink-0 text-xs font-semibold rounded-full border border-habito/60 text-habito px-3 py-1.5 disabled:opacity-40"
                              >
                                Desafiar
                              </button>
                            )
                          ) : (
                            <button
                              type="button"
                              disabled={criando !== null}
                              onClick={() => setEscolhendo(escolhendo === chave ? null : chave)}
                              className="shrink-0 text-xs font-bold rounded-full bg-habito text-base-900 px-3 py-1.5 disabled:opacity-50"
                            >
                              {criando === m.id ? "Criando…" : "+ Adicionar"}
                            </button>
                          )}
                        </div>
                        {escolhendo === chave && (
                          <EscolherDuracao
                            novo={!ja}
                            comMascote={!!mascote}
                            ocupado={criando !== null || salvando}
                            aoEscolher={(dias) => (ja ? void comecar(ja.id, dias!) : void adicionar(m.id, dias))}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {/* desafiar um hábito que já existe */}
      {mascote && habitos.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-ink-400 mb-2">Desafie um hábito seu</h2>
          <ul className="space-y-2">
            {habitos
              .filter((h) => !desafioAtivo(mascote, h.id))
              .map((h) => {
                const chave = `h:${h.id}`;
                return (
                  <li key={h.id} className="rounded-2xl border border-base-600 bg-base-800 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexDaCor(h.cor ?? "habito") + "33", color: hexDaCor(h.cor ?? "habito") }}>
                        <IconeHabito icone={h.icone} tamanho={16} />
                      </span>
                      <p className="text-sm flex-1 min-w-0 truncate">{h.nome}</p>
                      <button
                        type="button"
                        onClick={() => setEscolhendo(escolhendo === chave ? null : chave)}
                        className="shrink-0 text-xs font-semibold rounded-full border border-habito/60 text-habito px-3 py-1.5"
                      >
                        Desafiar
                      </button>
                    </div>
                    {escolhendo === chave && <EscolherDuracao comMascote ocupado={salvando} aoEscolher={(dias) => void comecar(h.id, dias!)} />}
                  </li>
                );
              })}
          </ul>
        </section>
      )}
    </main>
  );
}

function EscolherDuracao({
  novo = false,
  comMascote,
  ocupado,
  aoEscolher,
}: {
  novo?: boolean;
  comMascote: boolean;
  ocupado: boolean;
  aoEscolher: (dias: Duracao | null) => void;
}) {
  return (
    <div className="mt-2.5 animate-surgir">
      <p className="text-[11px] text-ink-400 mb-1.5">{novo ? "Já começar um desafio?" : "Quanto tempo?"} Pode faltar alguns dias (folga).</p>
      <div className={`grid gap-1.5 ${novo ? "grid-cols-4" : "grid-cols-3"}`}>
        {DESAFIOS.map((x) => (
          <button
            key={x.dias}
            type="button"
            disabled={ocupado || !comMascote}
            onClick={() => aoEscolher(x.dias)}
            className="rounded-xl border border-base-600 bg-base-900/50 px-1 py-2 text-center hover:border-habito transition disabled:opacity-40"
          >
            <span className="block text-lg leading-none">{x.emoji}</span>
            <span className="block text-xs font-semibold mt-1">{x.dias} dias</span>
            <span className="block text-[10px] text-financa">+{x.premio} 🪙</span>
          </button>
        ))}
        {novo && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => aoEscolher(null)}
            className="rounded-xl border border-base-600 bg-base-900/50 px-1 py-2 text-center text-xs text-ink-300 disabled:opacity-40"
          >
            Só adicionar
          </button>
        )}
      </div>
    </div>
  );
}

function CartaoDesafio({
  d,
  nome,
  negativo,
  e,
  ocupado,
  aoPegar,
  aoRecomecar,
  aoDesistir,
}: {
  d: DesafioSalvo;
  nome: string;
  negativo: boolean;
  e: EstadoDesafio;
  ocupado: boolean;
  aoPegar: () => void;
  aoRecomecar: () => void;
  aoDesistir: () => void;
}) {
  const info = infoDesafio(d.dias);
  const [confirmar, setConfirmar] = useState(false);
  return (
    <div className={`rounded-2xl border p-3 ${e.status === "pronto" ? "border-financa bg-financa/10" : e.status === "perdido" ? "border-red-400/40 bg-base-800" : "border-base-600 bg-base-800"}`}>
      <div className="flex items-center gap-2">
        <span className={`text-2xl ${e.status === "pronto" ? "animate-quicar" : ""}`}>{info.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{nome}</p>
          <p className="text-[11px] text-ink-400">
            {e.status === "pronto"
              ? "Desafio cumprido! 🎉"
              : e.status === "perdido"
                ? "Faltou mais que a folga… bora de novo?"
                : `${e.feitos}/${e.dias} dias${negativo ? " limpos" : ""} · folga: ${e.folgaRestante}`}
          </p>
        </div>
        {e.status === "pronto" && (
          <button type="button" disabled={ocupado} onClick={aoPegar} className="shrink-0 text-xs font-bold rounded-full bg-financa text-base-900 px-3 py-1.5">
            Pegar +{info.premio} 🪙
          </button>
        )}
        {e.status === "perdido" && (
          <button type="button" disabled={ocupado} onClick={aoRecomecar} className="shrink-0 text-xs font-semibold rounded-full bg-habito text-base-900 px-3 py-1.5">
            Recomeçar
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-[3px] mt-2.5">
        {e.grade.map((g, i) => (
          <span
            key={i}
            className={`h-2.5 rounded-sm ${d.dias > 21 ? "w-2" : "w-2.5"} ${
              g === "ok" ? "bg-habito" : g === "falta" ? "bg-red-400/60" : g === "hoje" ? "border border-habito" : "bg-base-700"
            }`}
          />
        ))}
      </div>
      {e.status === "ativo" &&
        (confirmar ? (
          <div className="flex items-center justify-end gap-2 mt-2 text-xs">
            <span className="text-ink-400">Desistir mesmo?</span>
            <button type="button" onClick={() => setConfirmar(false)} className="text-ink-300 px-2 py-1">
              Não
            </button>
            <button type="button" disabled={ocupado} onClick={aoDesistir} className="text-red-400 font-semibold px-2 py-1">
              Sim, desistir
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmar(true)} className="block ml-auto mt-1.5 text-[11px] text-ink-500 hover:text-ink-300">
            desistir
          </button>
        ))}
    </div>
  );
}
