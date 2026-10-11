"use client";

// Etapa 298 — o mascote dos hábitos: nasce de um ovinho, cresce conforme
// você faz seus hábitos, muda de humor com o seu dia e veste o que você
// compra na lojinha com as moedas (cada hábito feito = 10 🪙).
// Etapa 301 — o que você compra vai pro Armário (com looks salvos), dá pra
// provar antes de comprar, girar o bichinho e tem muito mais itens.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Lock, Check, Pencil, X, Shirt, ShoppingBag, Bookmark, Trash2 } from "lucide-react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { useMascote } from "@/lib/mascote/useMascote";
import {
  CORES_MASCOTE,
  FASES,
  ITENS,
  MOEDAS_POR_HABITO,
  NOMES_SLOT,
  alternarEquipado,
  apagarLook,
  CONSUMIVEIS,
  comprarConsumivel,
  comprar,
  itensDoArmario,
  MAX_LOOKS,
  mesmoLook,
  quantosNoArmario,
  salvarLook,
  tirarTudo,
  usarLook,
  fraseDoHumor,
  mascotePadrao,
  type CorMascote,
  type Slot,
} from "@/lib/mascote/mascote";
import { useGiro } from "@/lib/mascote/useGiro";
import { BandejaComida, BarrasVida } from "@/components/mascote/BandejaComida";
import { Mascote } from "@/components/mascote/Mascote";
import { CarregandoTela } from "@/components/Esqueleto";
import { CabecalhoPagina } from "@/components/CabecalhoPagina";
import { chuvaDeConfete, textoFlutuante } from "@/lib/app/festa";
import { vibrar } from "@/lib/app/vibrar";
import { useContagem } from "@/components/NumeroAnimado";

type Aba = Slot | "cores" | "comidas";
const ABAS: { id: Aba; nome: string }[] = [
  { id: "comidas", nome: "🍎 Comidinhas" },
  { id: "chapeu", nome: "🎩 Chapéus" },
  { id: "oculos", nome: "🕶️ Óculos" },
  { id: "roupa", nome: "🧣 Roupas" },
  { id: "mao", nome: "☕ Na mão" },
  { id: "amigo", nome: "🐾 Amigos" },
  { id: "fundo", nome: "🏡 Lugares" },
  { id: "cores", nome: "🎨 Cores" },
];

export default function MascotePage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const { mascote, feitos, fase, humor, moedas, vida, salvar, salvando, erro } = useMascote(snapshot, hoje);
  const [comendo, setComendo] = useState<{ emoji: string; n: number } | null>(null);
  // Etapa 302 — /habitos/mascote?aba=comidas abre direto nas comidinhas
  useEffect(() => {
    try {
      const a = new URLSearchParams(window.location.search).get("aba");
      if (a && ABAS.some((x) => x.id === a)) setAba(a as Aba);
    } catch {}
  }, []);
  const [aba, setAba] = useState<Aba>("chapeu");
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [toques, setToques] = useState(0);
  const [editandoNome, setEditandoNome] = useState(false);
  const [nome, setNome] = useState("");
  const [corInicial, setCorInicial] = useState<CorMascote>("verde");
  const refPalco = useRef<HTMLDivElement>(null);
  const moedasAnim = useContagem(moedas, 700);
  const frase = useMemo(() => fraseDoHumor(humor, toques), [humor, toques]);
  const [modo, setModo] = useState<"loja" | "armario">("loja");
  const [provando, setProvando] = useState<{ slot: Slot; id: string } | null>(null);
  const [nomeLook, setNomeLook] = useState("");
  const { angulo, eventos } = useGiro(() => {
    setToques((n) => n + 1);
    vibrar(10);
    textoFlutuante(refPalco.current, "💚", "#8FD3A6");
  });

  if (snapshot === undefined) return <CarregandoTela cartoes={2} linhas={3} />;
  if (!snapshot) return <main className="pagina px-6 pt-6 text-ink-400">Abra o app com internet uma vez pra conhecer seu mascote.</main>;

  // ——— primeiro contato: chocar o ovo ———
  if (!mascote) {
    return (
      <main className="pagina-curta px-6 md:px-12 pt-4 pb-12">
        <CabecalhoPagina voltarHref="/habitos" voltarTexto="Hábitos" emoji="🥚" titulo="Seu mascote" subtitulo="Ele cresce com os seus hábitos." />
        <div className="rounded-3xl border border-habito/30 p-6 text-center" style={{ background: "linear-gradient(160deg, rgb(var(--c-habito) / 0.18), rgb(var(--c-nota) / 0.08))" }}>
          <div className="flex justify-center">
            <Mascote cor={corInicial} fase={feitos >= 5 ? 1 : 0} humor="feliz" tamanho={190} />
          </div>
          <p className="text-xl font-semibold mt-2">Você ganhou um ovinho! 🥚</p>
          <p className="text-sm text-ink-400 mt-1 max-w-xs mx-auto">
            Cada hábito que você faz vale {MOEDAS_POR_HABITO} 🪙. Seu mascote cresce, fica feliz quando você cumpre o dia e
            ganha roupas e presentes na lojinha.
          </p>
          <label className="block text-left text-xs uppercase tracking-wide text-ink-400 mt-5 mb-1.5">Nome</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Vidinho"
            maxLength={20}
            className="w-full bg-base-900 border border-base-600 rounded-2xl px-4 py-3 text-ink-100 outline-none focus:border-habito"
          />
          <p className="text-left text-xs uppercase tracking-wide text-ink-400 mt-4 mb-2">Cor</p>
          <div className="flex gap-2">
            {(["verde", "lilas", "dourado"] as CorMascote[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCorInicial(c)}
                aria-pressed={corInicial === c}
                className={`flex-1 rounded-2xl border py-2.5 text-sm transition ${corInicial === c ? "border-ink-100 bg-base-800" : "border-base-600 text-ink-400"}`}
              >
                <span className="inline-block w-4 h-4 rounded-full align-middle mr-1.5" style={{ background: CORES_MASCOTE[c].corpo }} />
                {CORES_MASCOTE[c].nome}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={salvando}
            onClick={async () => {
              if (await salvar(mascotePadrao(nome.trim() || "Vidinho", corInicial))) {
                vibrar([20, 50, 30]);
                chuvaDeConfete({ quantidade: 60 });
              }
            }}
            className="w-full mt-6 bg-habito text-base-900 font-semibold rounded-2xl py-3.5 disabled:opacity-50"
          >
            {salvando ? "Chocando…" : "🐣 Chocar meu mascote"}
          </button>
          {erro && <p className="text-sm text-red-400 mt-3">{erro}</p>}
        </div>
      </main>
    );
  }

  const vestindo: Partial<Record<Slot, string>> = provando ? { ...mascote.equipados, [provando.slot]: provando.id } : mascote.equipados;
  const fundo = vestindo.fundo;
  const itemProvando = provando ? ITENS.find((i) => i.id === provando.id) : null;
  const armario = itensDoArmario(mascote);
  const noArmario = quantosNoArmario(mascote);
  const looks = mascote.looks ?? [];
  const algoVestido = Object.values(mascote.equipados).some(Boolean);

  async function tentarComprar(alvo: { tipo: "item"; id: string } | { tipo: "cor"; cor: CorMascote }, chave: string) {
    if (!mascote) return;
    if (confirmar !== chave) {
      setConfirmar(chave);
      vibrar(8);
      return;
    }
    setConfirmar(null);
    const r = comprar(mascote, feitos, alvo);
    if (!r.ok) return;
    if (await salvar(r.mascote)) {
      setProvando(null);
      vibrar([15, 40, 25]);
      chuvaDeConfete({ quantidade: 40 });
      textoFlutuante(refPalco.current, "Guardado no armário! 🎒", "#F2C46D");
    }
  }

  function vestir(id: string) {
    if (!mascote) return;
    vibrar(10);
    setProvando(null);
    void salvar(alternarEquipado(mascote, id));
  }

  function provar(slot: Slot, id: string) {
    vibrar(6);
    setConfirmar(null);
    setProvando((p) => (p?.id === id ? null : { slot, id }));
  }

  return (
    <main className="pagina-curta px-6 md:px-12 pt-4 pb-12">
      <CabecalhoPagina voltarHref="/habitos" voltarTexto="Hábitos" emoji="🐣" titulo="Seu mascote" subtitulo="Ele cresce com os seus hábitos." />

      {/* palco */}
      <section
        className="relative overflow-hidden rounded-3xl border border-habito/30 mb-4"
        style={{ background: "linear-gradient(160deg, rgb(var(--c-habito) / 0.18), rgb(var(--c-nota) / 0.08))" }}
      >
        <div ref={refPalco} className="relative flex justify-center cursor-grab active:cursor-grabbing select-none" {...eventos}>
          <div key={toques} className={toques ? "vtm-pulo" : ""}>
            <Mascote cor={mascote.cor} fase={fase.nivel} humor={humor} equipados={vestindo} comFundo tamanho={260} angulo={angulo} />
          </div>
          {comendo && (
            <span key={comendo.n} className="absolute left-1/2 top-1/2 -ml-4 -mt-2 text-4xl vtm-comer" style={{ ["--de-x" as any]: "0px", ["--de-y" as any]: "120px" }}>
              {comendo.emoji}
            </span>
          )}
          {/* balão de fala */}
          <div className="absolute top-3 left-3 right-3 flex justify-center pointer-events-none">
            <span key={itemProvando ? itemProvando.id : frase} className="vtm-fala bg-base-900/80 backdrop-blur text-ink-100 text-sm rounded-2xl px-3 py-1.5 shadow-lg max-w-[85%] text-center">
              {itemProvando ? `Provando: ${itemProvando.emoji} ${itemProvando.nome}` : frase}
            </span>
          </div>
          <span className="absolute bottom-2 right-3 text-[10px] text-ink-100/70 pointer-events-none">↔ gire</span>
        </div>

        {itemProvando && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-financa/15 border-t border-financa/30">
            <p className="text-sm flex-1 min-w-0 truncate">
              {itemProvando.emoji} <strong>{itemProvando.nome}</strong>
            </p>
            {fase.nivel < itemProvando.nivel ? (
              <span className="text-xs text-ink-400">Libera: {FASES[itemProvando.nivel].nome}</span>
            ) : (
              <button
                type="button"
                onClick={() => void tentarComprar({ tipo: "item", id: itemProvando.id }, itemProvando.id)}
                disabled={moedas < itemProvando.preco || salvando}
                className={`text-xs font-semibold rounded-full px-3 py-1.5 disabled:opacity-50 ${confirmar === itemProvando.id ? "bg-financa text-base-900" : "border border-financa/60 text-financa"}`}
              >
                {confirmar === itemProvando.id ? `Comprar por ${itemProvando.preco} 🪙?` : moedas < itemProvando.preco ? `Faltam ${itemProvando.preco - moedas} 🪙` : `Comprar · ${itemProvando.preco} 🪙`}
              </button>
            )}
            <button type="button" aria-label="Parar de provar" onClick={() => setProvando(null)} className="p-1.5 text-ink-400">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="bg-base-800/90 backdrop-blur border-t border-base-600 px-4 py-3">
          <div className="flex items-center gap-2">
            {editandoNome ? (
              <form
                className="flex-1 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = nome.trim();
                  if (n) void salvar({ ...mascote, nome: n.slice(0, 20) });
                  setEditandoNome(false);
                }}
              >
                <input
                  autoFocus
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={20}
                  className="flex-1 min-w-0 bg-base-900 border border-base-600 rounded-xl px-3 py-1.5 text-base outline-none focus:border-habito"
                />
                <button type="submit" className="text-sm text-habito px-2">
                  Salvar
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNome(mascote.nome);
                  setEditandoNome(true);
                }}
                className="flex items-center gap-1.5 text-lg font-display font-bold min-w-0"
              >
                <span className="truncate">{mascote.nome}</span>
                <Pencil size={13} className="text-ink-400 shrink-0" />
              </button>
            )}
            <span className="ml-auto shrink-0 text-xs font-semibold rounded-full bg-habito/15 text-habito px-2.5 py-1">{fase.nome}</span>
            <span className="shrink-0 text-sm font-mono font-semibold rounded-full bg-financa/15 text-financa px-2.5 py-1">🪙 {Math.round(moedasAnim)}</span>
          </div>
          {fase.proxima ? (
            <>
              <div className="h-2 rounded-full bg-base-700 overflow-hidden mt-2.5">
                <div className="h-full rounded-full bg-habito transition-[width] duration-700" style={{ width: `${Math.round(fase.progresso * 100)}%` }} />
              </div>
              <p className="text-xs text-ink-400 mt-1.5">
                Mais {fase.faltam} {fase.faltam === 1 ? "hábito feito" : "hábitos feitos"} pra virar <strong className="text-ink-100">{fase.proxima.nome}</strong>
              </p>
            </>
          ) : (
            <p className="text-xs text-financa mt-2">Fase máxima! Seu mascote é lendário 👑</p>
          )}
        </div>
      </section>

      {/* Etapa 302 — cuidar: barriga, saúde e despensa */}
      {vida && (
        <section className="rounded-3xl border border-base-600 bg-base-800 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold">Cuidar de {mascote.nome}</p>
            {vida.estado !== "bem" && (
              <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${vida.estado === "doente" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300"}`}>
                {vida.estado === "doente" ? "🤒 Doente" : "🍎 Com fome"}
              </span>
            )}
          </div>
          <BarrasVida vida={vida} />
          <p className="text-[11px] text-ink-400 mt-2 mb-3">
            {vida.estado === "doente"
              ? "Ficou dodói por falta de cuidado. Faça seus hábitos e dê um 💊 remédio — ele melhora rapidinho (e nunca morre)."
              : vida.diasSemCuidar > 0
                ? `Ficou ${vida.diasSemCuidar} ${vida.diasSemCuidar === 1 ? "dia" : "dias"} sem hábitos — cuide dele hoje!`
                : "Cada hábito feito alimenta ele. Comidinhas e frutas do jardim dão um reforço."}
          </p>
          <BandejaComida
            mascote={mascote}
            vida={vida}
            hoje={hoje}
            salvar={salvar}
            salvando={salvando}
            aoComer={(emoji) => {
              setComendo({ emoji, n: Date.now() });
              setTimeout(() => setToques((n) => n + 1), 650);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </section>
      )}

      <p className="text-xs text-ink-400 mb-4 text-center">
        Cada hábito feito vale {MOEDAS_POR_HABITO} 🪙 · arraste pro lado pra girar · toque nele 💚
      </p>
      {erro && <p className="text-sm text-red-400 mb-3">{erro}</p>}

      {/* Etapa 301 — Lojinha × Armário */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-base-800 border border-base-600 mb-3">
        {(
          [
            ["loja", <ShoppingBag key="i" size={15} />, "Lojinha"],
            ["armario", <Shirt key="i" size={15} />, `Armário${noArmario ? ` (${noArmario})` : ""}`],
          ] as const
        ).map(([id, icone, rotulo]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setModo(id);
              setConfirmar(null);
              setProvando(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition ${modo === id ? "bg-ink-100 text-base-900" : "text-ink-400"}`}
          >
            {icone} {rotulo}
          </button>
        ))}
      </div>

      {modo === "armario" ? (
        <div className="space-y-5 animate-entrar">
          {/* vestindo agora + looks */}
          <section className="rounded-2xl border border-base-600 bg-base-800 p-3">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-semibold">Vestindo agora</p>
              {algoVestido && (
                <button type="button" onClick={() => void salvar(tirarTudo(mascote))} disabled={salvando} className="ml-auto text-xs text-ink-400 hover:text-ink-100">
                  Tirar tudo
                </button>
              )}
            </div>
            {algoVestido ? (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(mascote.equipados).map(([slot, id]) => {
                  const it = ITENS.find((i) => i.id === id);
                  if (!it) return null;
                  return (
                    <button key={slot} type="button" onClick={() => vestir(it.id)} className="flex items-center gap-1 text-xs rounded-full bg-habito/15 text-habito px-2.5 py-1">
                      {it.emoji} {it.nome} <X size={11} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-ink-400">Nada por enquanto — toque num item abaixo pra vestir.</p>
            )}

            <p className="text-sm font-semibold mt-4 mb-2">Meus looks</p>
            <div className="grid grid-cols-4 gap-2">
              {looks.map((l, i) => {
                const atual = mesmoLook(l.equipados, mascote.equipados);
                return (
                  <div key={i} className={`relative rounded-xl border p-1 flex flex-col items-center ${atual ? "border-habito bg-habito/10" : "border-base-600"}`}>
                    <button type="button" onClick={() => void salvar(usarLook(mascote, i))} disabled={salvando} className="flex flex-col items-center">
                      <Mascote cor={mascote.cor} fase={Math.max(1, fase.nivel)} humor="feliz" equipados={l.equipados} comFundo={!!l.equipados.fundo} tamanho={64} animado={false} />
                      <span className="text-[10px] leading-tight truncate max-w-full">{l.nome}</span>
                    </button>
                    <button type="button" aria-label="Apagar look" onClick={() => void salvar(apagarLook(mascote, i))} className="absolute -top-1.5 -right-1.5 bg-base-700 rounded-full p-1 text-ink-400">
                      <Trash2 size={10} />
                    </button>
                  </div>
                );
              })}
              {algoVestido && !looks.some((l) => mesmoLook(l.equipados, mascote.equipados)) && (
                <form
                  className="rounded-xl border border-dashed border-base-500 p-1.5 flex flex-col items-center justify-center gap-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void salvar(salvarLook(mascote, nomeLook));
                    setNomeLook("");
                    vibrar(10);
                  }}
                >
                  <Bookmark size={16} className="text-ink-400" />
                  <input
                    value={nomeLook}
                    onChange={(e) => setNomeLook(e.target.value)}
                    maxLength={16}
                    placeholder="Nome"
                    className="w-full bg-transparent text-[11px] text-center outline-none border-b border-base-600"
                  />
                  <button type="submit" disabled={salvando} className="text-[11px] text-habito font-semibold">
                    Salvar look
                  </button>
                </form>
              )}
            </div>
            {looks.length >= MAX_LOOKS && <p className="text-[11px] text-ink-400 mt-2">Até {MAX_LOOKS} looks — salvar outro substitui o mais antigo.</p>}
          </section>

          {/* Etapa 302 — despensa */}
          {CONSUMIVEIS.some((c) => (mascote.estoque?.[c.id] ?? 0) > 0) && (
            <section>
              <p className="text-xs uppercase tracking-wide text-ink-400 mb-2">Despensa</p>
              <div className="flex flex-wrap gap-2">
                {CONSUMIVEIS.filter((c) => (mascote.estoque?.[c.id] ?? 0) > 0).map((c) => (
                  <span key={c.id} className="flex items-center gap-1.5 text-sm rounded-full bg-base-800 border border-base-600 px-3 py-1.5">
                    {c.emoji} {c.nome} <strong>×{mascote.estoque?.[c.id]}</strong>
                  </span>
                ))}
              </div>
            </section>
          )}

          {armario.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl">🎒</p>
              <p className="font-semibold mt-2">Seu armário está vazio</p>
              <p className="text-sm text-ink-400 mt-1">Tudo que você comprar na lojinha fica guardado aqui.</p>
              <button type="button" onClick={() => setModo("loja")} className="mt-4 text-sm font-semibold rounded-full bg-habito text-base-900 px-4 py-2">
                Ir pra lojinha
              </button>
            </div>
          ) : (
            armario.map((g) => (
              <section key={g.slot}>
                <p className="text-xs uppercase tracking-wide text-ink-400 mb-2">
                  {NOMES_SLOT[g.slot]} · {g.itens.length}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {g.itens.map((item) => {
                    const usando = mascote.equipados[item.slot] === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => vestir(item.id)}
                        disabled={salvando}
                        className={`relative rounded-2xl border p-1.5 flex flex-col items-center transition ${usando ? "border-habito bg-habito/10" : "border-base-600 bg-base-800"}`}
                      >
                        <Mascote cor={mascote.cor} fase={Math.max(1, fase.nivel)} humor="feliz" equipados={{ [item.slot]: item.id }} comFundo={item.slot === "fundo"} tamanho={74} animado={false} />
                        <span className="text-[11px] font-medium leading-tight mt-0.5">{item.nome}</span>
                        <span className={`text-[10px] mt-0.5 ${usando ? "text-habito font-semibold" : "text-ink-400"}`}>{usando ? "✓ usando" : "vestir"}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 md:mx-0 md:px-0 mb-3 scrollbar-none">
            {ABAS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setAba(a.id);
                  setConfirmar(null);
                }}
                className={`shrink-0 text-sm rounded-full px-3.5 py-1.5 border transition ${aba === a.id ? "bg-ink-100 text-base-900 border-ink-100 font-medium" : "border-base-600 text-ink-400"}`}
              >
                {a.nome}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-ink-400 mb-2">
            {aba === "comidas" ? "Comidinhas e remédios vão pra despensa; o adubo é pras plantas de dupla 🌱" : "Toque no desenho pra provar antes de comprar 👀"}
          </p>

          {aba === "comidas" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CONSUMIVEIS.filter((c) => c.preco > 0).map((c) => {
                const tem = mascote.estoque?.[c.id] ?? 0;
                const pode = moedas >= c.preco;
                return (
                  <div key={c.id} className="rounded-2xl border border-base-600 bg-base-800 p-3 flex flex-col items-center text-center">
                    <span className="text-4xl">{c.emoji}</span>
                    <p className="text-sm font-medium mt-1">{c.nome}</p>
                    <p className="text-[11px] text-ink-400 leading-tight mt-0.5 min-h-[28px]">{c.descricao}</p>
                    <p className="text-[10px] text-ink-400 mt-1">
                      {c.barriga > 0 && `🍗 +${c.barriga} `}
                      {c.saude > 0 && `❤️ +${c.saude}`}
                      {c.tipo === "planta" && "🌱 +2 dias"}
                      {tem > 0 && <span className="text-habito font-semibold"> · tem {tem}</span>}
                    </p>
                    <button
                      type="button"
                      disabled={!pode || salvando}
                      onClick={async () => {
                        const r = comprarConsumivel(mascote, feitos, c.id);
                        if (!r.ok) return;
                        if (await salvar(r.mascote)) {
                          vibrar(12);
                          textoFlutuante(refPalco.current, `+1 ${c.emoji}`, "#F2C46D");
                        }
                      }}
                      className={`mt-2 w-full rounded-xl py-1.5 text-xs font-semibold ${pode ? "border border-financa/50 text-financa" : "border border-base-600 text-ink-400 opacity-60"}`}
                    >
                      Comprar · {c.preco} 🪙
                    </button>
                  </div>
                );
              })}
            </div>
          ) : aba === "cores" ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {(Object.keys(CORES_MASCOTE) as CorMascote[]).map((c) => {
                const info = CORES_MASCOTE[c];
                const tem = info.preco === 0 || mascote.inventario.includes(`cor:${c}`);
                const usando = mascote.cor === c;
                const chave = `cor:${c}`;
                const pode = tem || moedas >= info.preco;
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={usando || salvando || (!tem && !pode)}
                    onClick={() => (tem ? void salvar({ ...mascote, cor: c }) : void tentarComprar({ tipo: "cor", cor: c }, chave))}
                    className={`rounded-2xl border p-2 flex flex-col items-center gap-1 transition ${
                      usando ? "border-habito bg-habito/10" : confirmar === chave ? "border-financa bg-financa/10" : "border-base-600 bg-base-800"
                    } ${!tem && !pode ? "opacity-50" : ""}`}
                  >
                    <Mascote cor={c} fase={Math.max(1, fase.nivel)} humor="feliz" tamanho={70} animado={false} />
                    <span className="text-xs font-medium">{info.nome}</span>
                    <span className="text-[11px] text-ink-400">
                      {usando ? "usando" : tem ? "usar" : confirmar === chave ? "confirmar?" : `${info.preco} 🪙`}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ITENS.filter((i) => i.slot === aba)
                .slice()
                .sort((a, b) => a.nivel - b.nivel || a.preco - b.preco)
                .map((item) => {
                  const tem = mascote.inventario.includes(item.id);
                  const usando = mascote.equipados[item.slot] === item.id;
                  const bloqueado = !tem && fase.nivel < item.nivel;
                  const pode = !bloqueado && moedas >= item.preco;
                  const chave = item.id;
                  const naProva = provando?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-2.5 flex flex-col items-center text-center transition ${
                        usando || naProva ? "border-habito bg-habito/10" : confirmar === chave ? "border-financa bg-financa/10" : "border-base-600 bg-base-800"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => (tem ? vestir(item.id) : provar(item.slot, item.id))}
                        className={`relative ${bloqueado ? "opacity-40 grayscale" : ""}`}
                        aria-label={tem ? `Vestir ${item.nome}` : `Provar ${item.nome}`}
                      >
                        <Mascote cor={mascote.cor} fase={Math.max(1, fase.nivel)} humor="feliz" equipados={{ [item.slot]: item.id }} comFundo={item.slot === "fundo"} tamanho={92} animado={false} />
                        {bloqueado && <Lock size={18} className="absolute inset-0 m-auto text-ink-100" />}
                        {tem && <span className="absolute top-0 right-0 text-[10px] rounded-full bg-habito text-base-900 font-semibold px-1.5">✓ seu</span>}
                      </button>
                      <p className="text-sm font-medium leading-tight mt-1">{item.nome}</p>
                      {tem ? (
                        <button
                          type="button"
                          onClick={() => vestir(item.id)}
                          disabled={salvando}
                          className={`mt-2 w-full rounded-xl py-1.5 text-xs font-semibold ${usando ? "bg-habito text-base-900" : "border border-base-600 text-ink-100"}`}
                        >
                          {usando ? (
                            <span className="inline-flex items-center gap-1">
                              <Check size={12} strokeWidth={3} /> Usando
                            </span>
                          ) : (
                            "No armário · usar"
                          )}
                        </button>
                      ) : bloqueado ? (
                        <p className="mt-2 text-[11px] text-ink-400">Libera: {FASES[item.nivel].nome}</p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void tentarComprar({ tipo: "item", id: item.id }, chave)}
                          disabled={!pode || salvando}
                          className={`mt-2 w-full rounded-xl py-1.5 text-xs font-semibold transition ${
                            confirmar === chave ? "bg-financa text-base-900" : pode ? "border border-financa/50 text-financa" : "border border-base-600 text-ink-400 opacity-60"
                          }`}
                        >
                          {confirmar === chave ? `Comprar por ${item.preco} 🪙?` : `${item.preco} 🪙`}
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}

      <Link href="/habitos" className="block text-center text-sm text-ink-400 mt-8 hover:text-ink-100">
        Fazer meus hábitos de hoje →
      </Link>
    </main>
  );
}
