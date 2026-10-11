"use client";

// Etapa 298 — o mascote dos hábitos: nasce de um ovinho, cresce conforme
// você faz seus hábitos, muda de humor com o seu dia e veste o que você
// compra na lojinha com as moedas (cada hábito feito = 10 🪙).
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Lock, Check, Pencil } from "lucide-react";
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
  comprar,
  fraseDoHumor,
  mascotePadrao,
  type CorMascote,
  type Slot,
} from "@/lib/mascote/mascote";
import { Mascote } from "@/components/mascote/Mascote";
import { CarregandoTela } from "@/components/Esqueleto";
import { CabecalhoPagina } from "@/components/CabecalhoPagina";
import { chuvaDeConfete, textoFlutuante } from "@/lib/app/festa";
import { vibrar } from "@/lib/app/vibrar";
import { useContagem } from "@/components/NumeroAnimado";

type Aba = Slot | "cores";
const ABAS: { id: Aba; nome: string }[] = [
  { id: "chapeu", nome: "🎩 Chapéus" },
  { id: "oculos", nome: "🕶️ Óculos" },
  { id: "roupa", nome: "🧣 Roupas" },
  { id: "mao", nome: "☕ Na mão" },
  { id: "fundo", nome: "🏖️ Cenários" },
  { id: "cores", nome: "🎨 Cores" },
];

export default function MascotePage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const { mascote, feitos, fase, humor, moedas, salvar, salvando, erro } = useMascote(snapshot, hoje);
  const [aba, setAba] = useState<Aba>("chapeu");
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [toques, setToques] = useState(0);
  const [editandoNome, setEditandoNome] = useState(false);
  const [nome, setNome] = useState("");
  const [corInicial, setCorInicial] = useState<CorMascote>("verde");
  const refPalco = useRef<HTMLDivElement>(null);
  const moedasAnim = useContagem(moedas, 700);
  const frase = useMemo(() => fraseDoHumor(humor, toques), [humor, toques]);

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

  const fundo = mascote.equipados.fundo;

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
      vibrar([15, 40, 25]);
      chuvaDeConfete({ quantidade: 40 });
      textoFlutuante(refPalco.current, "Presente novo! 🎁", "#F2C46D");
    }
  }

  function vestir(id: string) {
    if (!mascote) return;
    vibrar(10);
    void salvar(alternarEquipado(mascote, id));
  }

  return (
    <main className="pagina-curta px-6 md:px-12 pt-4 pb-12">
      <CabecalhoPagina voltarHref="/habitos" voltarTexto="Hábitos" emoji="🐣" titulo="Seu mascote" subtitulo="Ele cresce com os seus hábitos." />

      {/* palco */}
      <section
        className="relative overflow-hidden rounded-3xl border border-habito/30 mb-4"
        style={fundo ? undefined : { background: "linear-gradient(160deg, rgb(var(--c-habito) / 0.18), rgb(var(--c-nota) / 0.08))" }}
      >
        <div ref={refPalco} className="relative flex justify-center">
          <div key={toques} className={toques ? "vtm-pulo" : ""}>
            <Mascote
              cor={mascote.cor}
              fase={fase.nivel}
              humor={humor}
              equipados={mascote.equipados}
              comFundo={!!fundo}
              tamanho={260}
              aoTocar={() => {
                setToques((n) => n + 1);
                vibrar(10);
                textoFlutuante(refPalco.current, "💚", "#8FD3A6");
              }}
            />
          </div>
          {/* balão de fala */}
          <div className="absolute top-3 left-3 right-3 flex justify-center pointer-events-none">
            <span key={frase} className="vtm-fala bg-base-900/80 backdrop-blur text-ink-100 text-sm rounded-2xl px-3 py-1.5 shadow-lg max-w-[85%] text-center">
              {frase}
            </span>
          </div>
        </div>

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

      <p className="text-xs text-ink-400 mb-4 text-center">
        Cada hábito feito vale {MOEDAS_POR_HABITO} 🪙 · fica feliz quando você cumpre o dia · toque nele 💚
      </p>
      {erro && <p className="text-sm text-red-400 mb-3">{erro}</p>}

      {/* lojinha / armário */}
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

      {aba === "cores" ? (
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
          {ITENS.filter((i) => i.slot === aba).map((item) => {
            const tem = mascote.inventario.includes(item.id);
            const usando = mascote.equipados[item.slot] === item.id;
            const bloqueado = !tem && fase.nivel < item.nivel;
            const pode = !bloqueado && moedas >= item.preco;
            const chave = item.id;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-2.5 flex flex-col items-center text-center transition ${
                  usando ? "border-habito bg-habito/10" : confirmar === chave ? "border-financa bg-financa/10" : "border-base-600 bg-base-800"
                }`}
              >
                <div className={`relative ${bloqueado ? "opacity-40 grayscale" : ""}`}>
                  <Mascote
                    cor={mascote.cor}
                    fase={Math.max(1, fase.nivel)}
                    humor="feliz"
                    equipados={{ [item.slot]: item.id }}
                    comFundo={item.slot === "fundo"}
                    tamanho={92}
                    animado={false}
                  />
                  {bloqueado && <Lock size={18} className="absolute inset-0 m-auto text-ink-100" />}
                </div>
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
                      "Usar"
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

      <Link href="/habitos" className="block text-center text-sm text-ink-400 mt-8 hover:text-ink-100">
        Fazer meus hábitos de hoje →
      </Link>
    </main>
  );
}
