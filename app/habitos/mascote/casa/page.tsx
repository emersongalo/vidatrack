"use client";

// Etapa 305 — a casa do mascote: quarto, sala, cozinha e quintal em visão
// isométrica. Com as moedas dos hábitos você libera cômodos, compra móveis
// e coloca em qualquer quadradinho (mover, girar, guardar). O mascote
// passeia pela casa. Dá pra visitar a casa de quem divide hábito com você
// (?de=id_da_pessoa), só pra olhar.
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, RotateCw, Move, Package, Check, X, Pencil } from "lucide-react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { useMascote } from "@/lib/mascote/useMascote";
import { faseDoMascote, lerMascote } from "@/lib/mascote/mascote";
import {
  casaPadrao,
  colocar,
  COMODOS,
  comprarMovel,
  desbloquearComodo,
  ESTILOS,
  girar,
  guardados,
  guardar,
  mover,
  movel,
  MOVEIS,
  NOMES_CATEGORIA,
  podeColocar,
  TAM,
  usarEstilo,
  definirDesejo,
  progressoDoDesejo,
  type Casa,
  type CategoriaMovel,
  type ComodoId,
} from "@/lib/mascote/casa";
import { CasaIso } from "@/components/mascote/CasaIso";
import { periodoDaHora } from "@/components/mascote/Mascote";
import { CarregandoTela } from "@/components/Esqueleto";
import { CabecalhoPagina } from "@/components/CabecalhoPagina";
import { vibrar } from "@/lib/app/vibrar";
import { chuvaDeConfete } from "@/lib/app/festa";

const FUNDO: Record<string, string> = {
  manha: "linear-gradient(180deg, #BFE3F7, #FCE7C8)",
  tarde: "linear-gradient(180deg, #8FD0F5, #DDF1FF)",
  entardecer: "linear-gradient(180deg, #7C6BB5, #F7A97C)",
  noite: "linear-gradient(180deg, #0E1738, #273469)",
};

export default function CasaPage() {
  return (
    <Suspense fallback={null}>
      <CasaConteudo />
    </Suspense>
  );
}

type Painel = "loja" | "guardados" | "estilos";

function CasaConteudo() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const de = useSearchParams().get("de");
  const { mascote, fase, humor, moedas, salvar, salvando, erro } = useMascote(snapshot, hoje);
  const periodo = periodoDaHora(new Date().getHours());

  const [comodoId, setComodoId] = useState<ComodoId>("quarto");
  const [decorando, setDecorando] = useState(false);
  const [painel, setPainel] = useState<Painel>("loja");
  const [categoria, setCategoria] = useState<CategoriaMovel>("quarto");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [colocando, setColocando] = useState<{ m: string; x: number; y: number; r: 0 | 1; u?: string } | null>(null);
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pulo, setPulo] = useState(0);

  // visitando o par
  const visita = useMemo(() => {
    if (!de || !snapshot) return null;
    const pm = ((snapshot.parceirosMascote ?? []) as any[]).find((p) => p.usuario_id === de);
    const m = lerMascote(pm?.mascote);
    const nome = ((snapshot.parceiros ?? []) as any[]).find((p) => p.usuario_id === de)?.nome ?? "Seu par";
    return { m, nome, fase: faseDoMascote(pm?.feitos ?? 0).nivel };
  }, [de, snapshot]);

  if (snapshot === undefined) return <CarregandoTela cartoes={1} linhas={2} />;
  if (!snapshot) return <main className="pagina px-6 pt-6 text-ink-400">Abra o app com internet uma vez pra ver a casa.</main>;

  const dono = visita ? visita.m : mascote;
  if (!dono) {
    return (
      <main className="pagina-curta px-6 pt-6">
        <CabecalhoPagina voltarHref="/habitos" voltarTexto="Hábitos" emoji="🏠" titulo="Casa" />
        <p className="text-ink-400">
          {visita ? `${visita.nome} ainda não chocou o mascote.` : "Choque seu mascote primeiro — ele precisa de alguém pra morar na casa!"}
        </p>
        {!visita && (
          <Link href="/habitos/mascote" className="inline-block mt-4 bg-habito text-base-900 font-semibold rounded-full px-4 py-2">
            🐣 Chocar meu ovinho
          </Link>
        )}
      </main>
    );
  }

  const casa: Casa = dono.casa ?? casaPadrao();
  const comodo = casa.comodos[comodoId] ?? casa.comodos.quarto!;
  const atual: ComodoId = casa.comodos[comodoId] ? comodoId : "quarto";
  const podeEditar = !visita && decorando;
  const externo = !!COMODOS.find((c) => c.id === atual)?.externo;

  async function gravar(nova: Casa, custo = 0, texto?: string) {
    if (!mascote) return false;
    const ok = await salvar({ ...mascote, casa: nova, gastos: mascote.gastos + custo });
    if (ok && texto) setAviso(texto);
    return ok;
  }

  async function tentarDesbloquear(id: ComodoId) {
    const c = COMODOS.find((x) => x.id === id)!;
    if (confirmar !== `c:${id}`) {
      setConfirmar(`c:${id}`);
      vibrar(8);
      return;
    }
    setConfirmar(null);
    const r = desbloquearComodo(casa, id, moedas);
    if ("erro" in r) return setAviso(r.erro);
    if (await gravar(r.casa, r.custo, `${c.emoji} ${c.nome} liberado!`)) {
      chuvaDeConfete({ quantidade: 40 });
      setComodoId(id);
    }
  }

  async function comprar(id: string) {
    const mv = movel(id)!;
    if (confirmar !== `m:${id}`) {
      setConfirmar(`m:${id}`);
      vibrar(8);
      return;
    }
    setConfirmar(null);
    const r = comprarMovel(casa, id, moedas);
    if ("erro" in r) return setAviso(r.erro);
    if (await gravar(r.casa, r.custo, `${mv.emoji} ${mv.nome} comprado — toque no chão pra colocar`)) {
      vibrar([12, 30, 12]);
      comecarAColocar(id);
    }
  }

  function comecarAColocar(id: string) {
    const mv = movel(id)!;
    // começa num lugar livre, se tiver
    let inicio: [number, number] = [0, 0];
    achar: for (let j = 0; j < TAM; j++)
      for (let i = 0; i < TAM; i++)
        if (podeColocar(comodo, mv, i, j, 0, atual)) {
          inicio = [i, j];
          break achar;
        }
    setSelecionado(null);
    setColocando({ m: id, x: inicio[0], y: inicio[1], r: 0 });
  }

  const previa = colocando
    ? {
        ...colocando,
        valido: podeColocar(comodo, movel(colocando.m)!, colocando.x, colocando.y, colocando.r, atual, colocando.u),
      }
    : null;

  async function confirmarColocar() {
    if (!colocando || !previa?.valido) return;
    const nova = colocando.u ? mover(casa, atual, colocando.u, colocando.x, colocando.y, colocando.r) : colocar(casa, atual, colocando.m, colocando.x, colocando.y, colocando.r);
    if (!nova) return setAviso("Não cabe aí");
    setColocando(null);
    vibrar(15);
    await gravar(nova);
  }

  const itemSel = selecionado ? comodo.itens.find((i) => i.u === selecionado) : null;
  const mvSel = itemSel ? movel(itemSel.m) : null;

  return (
    <main className="pagina-curta px-4 md:px-12 pt-4 pb-40">
      <CabecalhoPagina
        voltarHref={visita ? "/habitos/juntos" : "/habitos/mascote"}
        voltarTexto={visita ? "Juntos" : "Mascote"}
        emoji="🏠"
        titulo={visita ? `Casa de ${visita.nome}` : `Casa de ${dono.nome}`}
        subtitulo={visita ? "Você está visitando 👀" : "Monte do seu jeito com as moedas dos hábitos"}
      />

      {/* Etapa 308 — o sonho */}
      {!visita &&
        (() => {
          const p = progressoDoDesejo(casa, moedas);
          if (!p) return null;
          return (
            <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{p.movel.emoji}</span>
                <p className="text-sm flex-1 min-w-0">
                  <strong>Sonho: {p.movel.nome}</strong>
                  <span className="block text-xs text-ink-400">
                    {p.pronto ? "Você já pode comprar! 🎉 Toque em Decorar → Loja" : `Faltam ${p.faltam} 🪙 · uns ${p.habitos} hábitos feitos`}
                  </span>
                </p>
              </div>
              <div className="h-2 rounded-full bg-base-900/50 overflow-hidden mt-2">
                <div className="h-full rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${Math.round(p.progresso * 100)}%` }} />
              </div>
            </div>
          );
        })()}

      {/* cômodos */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 mb-3 scrollbar-none">
        {COMODOS.map((c) => {
          const tem = !!casa.comodos[c.id];
          if (visita && !tem) return null;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelecionado(null);
                setColocando(null);
                if (tem) setComodoId(c.id);
                else void tentarDesbloquear(c.id);
              }}
              disabled={salvando}
              className={`shrink-0 flex items-center gap-1.5 text-sm rounded-full px-3.5 py-1.5 border transition ${
                atual === c.id ? "bg-ink-100 text-base-900 border-ink-100 font-medium" : tem ? "border-base-600 text-ink-300" : confirmar === `c:${c.id}` ? "border-financa bg-financa/15 text-financa" : "border-dashed border-base-600 text-ink-400"
              }`}
            >
              {tem ? c.emoji : <Lock size={13} />} {c.nome}
              {!tem && <span className="text-xs">{confirmar === `c:${c.id}` ? `liberar por ${c.preco} 🪙?` : `${c.preco} 🪙`}</span>}
            </button>
          );
        })}
      </div>

      {/* o cômodo */}
      <section className="relative rounded-3xl overflow-hidden border border-base-600" style={{ background: externo ? FUNDO[periodo] : "radial-gradient(circle at 50% 30%, #2A2F3A, #15171C)" }}>
        <CasaIso
          comodoId={atual}
          comodo={comodo}
          periodo={periodo}
          mascote={{ cor: dono.cor, fase: visita ? Math.max(1, visita.fase) : fase.nivel, humor: visita ? "feliz" : humor, equipados: dono.equipados }}
          selecionado={podeEditar ? selecionado : null}
          previa={podeEditar ? previa : null}
          pulo={pulo}
          aoTocarMascote={() => {
            setPulo((p) => p + 1);
            vibrar(10);
          }}
          aoTocarChao={
            podeEditar
              ? (x, y) => {
                  if (colocando) setColocando({ ...colocando, x, y });
                  else setSelecionado(null);
                }
              : undefined
          }
          aoTocarItem={
            podeEditar
              ? (u) => {
                  if (colocando) {
                    // tocou num móvel enquanto coloca: usa o quadradinho dele
                    const it = comodo.itens.find((i) => i.u === u);
                    if (it) setColocando({ ...colocando, x: it.x, y: it.y });
                    return;
                  }
                  setSelecionado((s) => (s === u ? null : u));
                  vibrar(6);
                }
              : undefined
          }
        />
        {!visita && (
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span className="text-sm font-mono font-semibold rounded-full bg-black/40 backdrop-blur text-financa px-2.5 py-1">🪙 {moedas}</span>
            <button
              type="button"
              onClick={() => {
                setDecorando((d) => !d);
                setSelecionado(null);
                setColocando(null);
              }}
              className={`flex items-center gap-1.5 text-sm font-semibold rounded-full px-3 py-1.5 ${decorando ? "bg-habito text-base-900" : "bg-black/40 backdrop-blur text-white"}`}
            >
              {decorando ? <Check size={14} /> : <Pencil size={14} />} {decorando ? "Pronto" : "Decorar"}
            </button>
          </div>
        )}
      </section>

      {aviso && (
        <p className="text-sm text-habito mt-2 animate-surgir" onAnimationEnd={() => setTimeout(() => setAviso(null), 2600)}>
          {aviso}
        </p>
      )}
      {erro && <p className="text-sm text-red-400 mt-2">{erro}</p>}

      {/* ações do móvel tocado */}
      {podeEditar && itemSel && mvSel && !colocando && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-base-600 bg-base-800 p-2 animate-entrar">
          <span className="text-sm font-medium flex-1 min-w-0 truncate pl-2">
            {mvSel.emoji} {mvSel.nome}
          </span>
          <button
            type="button"
            onClick={() => setColocando({ m: itemSel.m, x: itemSel.x, y: itemSel.y, r: itemSel.r, u: itemSel.u })}
            className="flex items-center gap-1 text-xs font-semibold rounded-xl border border-base-600 px-2.5 py-2"
          >
            <Move size={13} /> Mover
          </button>
          {mvSel.tipo !== "parede" && (mvSel.w !== mvSel.d) && (
            <button
              type="button"
              disabled={salvando}
              onClick={async () => {
                const nova = girar(casa, atual, itemSel.u);
                if (!nova) return setAviso("Não dá pra girar aí — falta espaço");
                vibrar(8);
                await gravar(nova);
              }}
              className="flex items-center gap-1 text-xs font-semibold rounded-xl border border-base-600 px-2.5 py-2"
            >
              <RotateCw size={13} /> Girar
            </button>
          )}
          <button
            type="button"
            disabled={salvando}
            onClick={async () => {
              setSelecionado(null);
              await gravar(guardar(casa, atual, itemSel.u), 0, `${mvSel.emoji} guardado — está em "Guardados"`);
            }}
            className="flex items-center gap-1 text-xs font-semibold rounded-xl border border-base-600 px-2.5 py-2"
          >
            <Package size={13} /> Guardar
          </button>
        </div>
      )}

      {/* colocando / movendo */}
      {podeEditar && colocando && (
        <div className="mt-3 rounded-2xl border border-habito/40 bg-base-800 p-3 animate-entrar">
          <p className="text-sm">
            {movel(colocando.m)?.emoji} <strong>{movel(colocando.m)?.nome}</strong> —{" "}
            <span className="text-ink-400">
              {movel(colocando.m)?.tipo === "parede" ? "toque num quadradinho encostado na parede" : "toque no chão onde quer colocar"}
            </span>
          </p>
          {!previa?.valido && <p className="text-xs text-red-300 mt-1">Aí não cabe (vermelho). Tente outro lugar ou gire.</p>}
          <div className="flex gap-2 mt-2">
            {movel(colocando.m)?.tipo !== "parede" && movel(colocando.m)!.w !== movel(colocando.m)!.d && (
              <button
                type="button"
                onClick={() => setColocando({ ...colocando, r: colocando.r ? 0 : 1 })}
                className="flex items-center gap-1 text-sm rounded-xl border border-base-600 px-3 py-2"
              >
                <RotateCw size={14} /> Girar
              </button>
            )}
            <button type="button" onClick={() => setColocando(null)} className="flex items-center gap-1 text-sm rounded-xl border border-base-600 px-3 py-2">
              <X size={14} /> Cancelar
            </button>
            <button
              type="button"
              disabled={!previa?.valido || salvando}
              onClick={() => void confirmarColocar()}
              className="flex-1 flex items-center justify-center gap-1 text-sm font-semibold rounded-xl bg-habito text-base-900 px-3 py-2 disabled:opacity-40"
            >
              <Check size={14} /> Colocar aqui
            </button>
          </div>
        </div>
      )}

      {/* loja / guardados / piso e parede */}
      {podeEditar && !colocando && (
        <section className="mt-4">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-base-800 border border-base-600 mb-3">
            {(
              [
                ["loja", "🛒 Loja"],
                ["guardados", `📦 Guardados`],
                ["estilos", "🎨 Piso e parede"],
              ] as const
            ).map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setPainel(id);
                  setConfirmar(null);
                }}
                className={`rounded-xl py-2 text-sm font-semibold ${painel === id ? "bg-ink-100 text-base-900" : "text-ink-400"}`}
              >
                {rotulo}
              </button>
            ))}
          </div>

          {painel === "loja" && (
            <>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 mb-3 scrollbar-none">
                {(Object.keys(NOMES_CATEGORIA) as CategoriaMovel[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategoria(c)}
                    className={`shrink-0 text-sm rounded-full px-3 py-1.5 border ${categoria === c ? "bg-ink-100 text-base-900 border-ink-100" : "border-base-600 text-ink-400"}`}
                  >
                    {NOMES_CATEGORIA[c]}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MOVEIS.filter((m) => m.cat === categoria).map((m) => {
                  const pode = moedas >= m.preco;
                  const tem = casa.moveis[m.id] ?? 0;
                  return (
                    <div key={m.id} className={`rounded-2xl border p-3 flex flex-col items-center text-center ${confirmar === `m:${m.id}` ? "border-financa bg-financa/10" : "border-base-600 bg-base-800"}`}>
                      <span className="text-3xl">{m.emoji}</span>
                      <p className="text-sm font-medium mt-1 leading-tight">{m.nome}</p>
                      <p className="text-[10px] text-ink-400 mt-0.5">
                        {m.tipo === "parede" ? "vai na parede" : `${m.w}×${m.d} quadradinhos`}
                        {tem > 0 && <span className="text-habito font-semibold"> · tem {tem}</span>}
                      </p>
                      <button
                        type="button"
                        disabled={!pode || salvando}
                        onClick={() => void comprar(m.id)}
                        className={`mt-2 w-full rounded-xl py-1.5 text-xs font-semibold ${
                          confirmar === `m:${m.id}` ? "bg-financa text-base-900" : pode ? "border border-financa/50 text-financa" : "border border-base-600 text-ink-400 opacity-60"
                        }`}
                      >
                        {confirmar === `m:${m.id}` ? `Comprar por ${m.preco} 🪙?` : `${m.preco} 🪙`}
                      </button>
                      {/* Etapa 308 — marcar como sonho (aparece com barrinha no palco) */}
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={async () => {
                          const virou = casa.desejo === m.id ? null : m.id;
                          vibrar(8);
                          await gravar(definirDesejo(casa, virou), 0, virou ? `⭐ ${m.nome} virou seu sonho — a barrinha aparece na aba Hábitos` : "Sonho removido");
                        }}
                        className={`mt-1.5 w-full rounded-xl py-1 text-[11px] font-semibold ${casa.desejo === m.id ? "bg-amber-400/20 text-amber-300" : "text-ink-400"}`}
                      >
                        {casa.desejo === m.id ? "⭐ Meu sonho" : "☆ Quero esse"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {painel === "guardados" &&
            (() => {
              const lista = MOVEIS.filter((m) => guardados(casa, m.id) > 0);
              if (!lista.length) return <p className="text-sm text-ink-400 text-center py-6">Nada guardado. O que você comprar e não colocar fica aqui.</p>;
              return (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {lista.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => comecarAColocar(m.id)}
                      className="relative rounded-2xl border border-base-600 bg-base-800 p-3 flex flex-col items-center"
                    >
                      <span className="text-3xl">{m.emoji}</span>
                      <span className="text-xs mt-1 leading-tight">{m.nome}</span>
                      <span className="absolute top-1 right-1 text-[10px] font-bold rounded-full bg-ink-100 text-base-900 px-1.5">×{guardados(casa, m.id)}</span>
                    </button>
                  ))}
                </div>
              );
            })()}

          {painel === "estilos" && (
            <div className="space-y-4">
              {(["piso", "parede"] as const).map((tipo) => {
                if (tipo === "parede" && externo) return null;
                const lista = ESTILOS.filter((e) => e.tipo === tipo && (tipo === "parede" || !!e.externo === externo));
                return (
                  <div key={tipo}>
                    <p className="text-xs uppercase tracking-wide text-ink-400 mb-2">{tipo === "piso" ? "Piso" : "Parede"}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {lista.map((e) => {
                        const tem = e.preco === 0 || casa.estilos.includes(e.id);
                        const usando = comodo[tipo] === e.id;
                        return (
                          <button
                            key={e.id}
                            type="button"
                            disabled={usando || salvando || (!tem && moedas < e.preco)}
                            onClick={async () => {
                              if (!tem && confirmar !== `e:${e.id}`) {
                                setConfirmar(`e:${e.id}`);
                                return;
                              }
                              setConfirmar(null);
                              const r = usarEstilo(casa, atual, e.id, moedas);
                              if ("erro" in r) return setAviso(r.erro);
                              await gravar(r.casa, r.custo);
                            }}
                            className={`rounded-2xl border p-2 flex flex-col items-center gap-1 ${usando ? "border-habito bg-habito/10" : confirmar === `e:${e.id}` ? "border-financa bg-financa/10" : "border-base-600 bg-base-800"} ${!tem && moedas < e.preco ? "opacity-50" : ""}`}
                          >
                            <span className="w-full h-8 rounded-lg" style={{ background: tipo === "piso" ? `repeating-conic-gradient(${e.a} 0 25%, ${e.b} 0 50%) 0 0/16px 16px` : `linear-gradient(90deg, ${e.a} 70%, ${e.b} 70%)` }} />
                            <span className="text-xs">{e.nome}</span>
                            <span className="text-[10px] text-ink-400">{usando ? "usando" : tem ? "usar" : confirmar === `e:${e.id}` ? "confirmar?" : `${e.preco} 🪙`}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {!decorando && !visita && (
        <p className="text-xs text-ink-400 text-center mt-3">
          Toque em <strong>Decorar</strong> pra comprar móveis e arrumar. Toque no {dono.nome} pra ele pular 💚
        </p>
      )}
      {visita && <p className="text-xs text-ink-400 text-center mt-3">Gostou? Monte a sua em Mascote → 🏠 Casa.</p>}
    </main>
  );
}
