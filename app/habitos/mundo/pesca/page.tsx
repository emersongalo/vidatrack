"use client";

// Etapa 316 — pescaria no píer: 1 isca por hábito feito hoje (até 5).
// Lança, espera beliscar e puxa na hora certa.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { useMascote } from "@/lib/mascote/useMascote";
import { ACHADOS, achado, COR_RARIDADE, iscasHoje, MAX_ISCAS_DIA, NOMES_RARIDADE, pescar, progressoColecao, venderDoBalde, type Achado } from "@/lib/mascote/pesca";
import { Mascote } from "@/components/mascote/Mascote";
import { CarregandoTela } from "@/components/Esqueleto";
import { CabecalhoPagina } from "@/components/CabecalhoPagina";
import { vibrar } from "@/lib/app/vibrar";
import { chuvaDeConfete, textoFlutuante } from "@/lib/app/festa";

type Fase = "parado" | "esperando" | "beliscou" | "resultado";

export default function PescaPage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const { mascote, fase: faseMascote, dia, salvar, salvando } = useMascote(snapshot, hoje);
  const [fase, setFase] = useState<Fase>("parado");
  const [resultado, setResultado] = useState<{ achado: Achado | null; motivo?: string } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const feitosHoje = dia?.habitos.feitos ?? 0;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (snapshot === undefined) return <CarregandoTela cartoes={2} linhas={3} />;
  const iscas = iscasHoje(mascote, feitosHoje, hoje);
  const quem = snapshot?.perfil?.id ?? "";

  function limpar() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  async function terminar(pegou: boolean, motivo?: string) {
    limpar();
    if (!mascote) return;
    const r = pescar(mascote, feitosHoje, hoje, pegou, quem);
    if (!r) return setFase("parado");
    setResultado({ achado: r.achado, motivo });
    setFase("resultado");
    if (r.achado) {
      vibrar(r.achado.raridade === "lendario" ? [30, 60, 30, 60, 60] : [20, 40, 20]);
      if (r.achado.raridade === "lendario" || r.achado.raridade === "raro") chuvaDeConfete({ quantidade: r.achado.raridade === "lendario" ? 90 : 45 });
    }
    await salvar(r.mascote);
  }

  function lancar() {
    if (!mascote || iscas <= 0) return;
    vibrar(10);
    setResultado(null);
    setFase("esperando");
    const espera = 1400 + Math.random() * 2600;
    timers.current.push(
      setTimeout(() => {
        setFase("beliscou");
        vibrar([40]);
        // janela pra puxar
        timers.current.push(setTimeout(() => void terminar(false, "Demorou… o peixe comeu a isca e fugiu 🐟💨"), 1150));
      }, espera)
    );
  }

  function puxar() {
    if (fase === "esperando") return void terminar(false, "Puxou cedo demais! Espere o ❗ aparecer.");
    if (fase === "beliscou") return void terminar(true);
  }

  const col = progressoColecao(mascote);
  const balde = Object.entries(mascote?.pesca?.balde ?? {}).filter(([, q]) => q > 0);

  return (
    <main ref={ref} className="pagina-curta px-6 md:px-12 pt-4 pb-12">
      <CabecalhoPagina voltarHref="/habitos/mundo" voltarTexto="Mundo" emoji="🎣" titulo="Pescaria" subtitulo="1 isca por hábito feito hoje" />

      <div className="flex items-center gap-2 mb-3 text-sm">
        <span className="rounded-full bg-base-800 border border-base-600 px-3 py-1.5 font-semibold">
          🪱 {iscas} {iscas === 1 ? "isca" : "iscas"}
        </span>
        <span className="rounded-full bg-base-800 border border-base-600 px-3 py-1.5">
          📖 {col.achados}/{col.total}
        </span>
      </div>

      {/* cena */}
      <div className="relative rounded-3xl overflow-hidden border border-base-600/70 mb-3 h-56" style={{ background: "linear-gradient(180deg, #8FD0F5 0%, #BFE3F7 45%, #3B82F6 46%, #1D4ED8 100%)" }}>
        <div className="absolute left-0 top-[46%] w-[42%] h-4 bg-[#B98B5E] border-b-4 border-[#8B5E3C]" />
        {[8, 22, 36].map((x) => (
          <div key={x} className="absolute top-[46%] w-1.5 h-24 bg-[#5B3A1E]" style={{ left: `${x}%` }} />
        ))}
        {mascote && (
          <div className="absolute" style={{ left: "16%", top: "calc(46% - 92px)" }}>
            <Mascote cor={mascote.cor} fase={Math.max(1, faseMascote.nivel)} humor="feliz" equipados={{ ...mascote.equipados, mao: undefined, fundo: undefined }} tamanho={96} volume={false} />
          </div>
        )}
        {/* vara e linha */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="33" y1="32" x2="52" y2="12" stroke="#7A4E2E" strokeWidth="0.9" />
          {fase !== "parado" && fase !== "resultado" && <path d={`M52 12 Q66 14 72 ${fase === "beliscou" ? 58 : 52}`} stroke="#F8FAFC" strokeWidth="0.3" fill="none" />}
        </svg>
        {(fase === "esperando" || fase === "beliscou") && (
          <div className="absolute" style={{ left: "70%", top: fase === "beliscou" ? "56%" : "50%", transition: "top 0.15s" }}>
            <div className={fase === "esperando" ? "vtm-onda" : ""}>
              <span className="block w-4 h-4 rounded-full bg-red-500 border-2 border-white" />
            </div>
            {fase === "beliscou" && <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-3xl font-black text-amber-300 animate-quicar">❗</span>}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-30 vtm-onda" style={{ background: "repeating-linear-gradient(90deg, transparent 0 18px, rgba(255,255,255,.35) 18px 26px)" }} />
      </div>

      {!mascote ? (
        <p className="text-sm text-ink-300 rounded-2xl border border-base-600 bg-base-800 px-4 py-3">
          Choque seu mascote pra pescar.{" "}
          <Link href="/habitos/mascote" className="text-habito font-semibold">
            Chocar 🐣
          </Link>
        </p>
      ) : fase === "esperando" || fase === "beliscou" ? (
        <button
          type="button"
          onClick={puxar}
          className={`w-full rounded-2xl py-4 text-lg font-black transition ${fase === "beliscou" ? "bg-amber-400 text-base-900 scale-[1.02]" : "bg-base-700 text-ink-200"}`}
        >
          {fase === "beliscou" ? "PUXA! 🎣" : "Esperando beliscar…"}
        </button>
      ) : (
        <button
          type="button"
          disabled={iscas <= 0 || salvando}
          onClick={lancar}
          className="w-full rounded-2xl py-4 text-lg font-bold bg-habito text-base-900 disabled:opacity-40"
        >
          {iscas > 0 ? "🎣 Lançar a linha" : feitosHoje >= MAX_ISCAS_DIA ? "Acabaram as iscas de hoje — volte amanhã" : "Faça um hábito pra ganhar isca 🪱"}
        </button>
      )}

      {/* resultado */}
      {fase === "resultado" && resultado && (
        <div className={`mt-3 rounded-2xl border p-4 text-center animate-entrar bg-base-800 ${resultado.achado ? "" : "border-base-600"}`} style={resultado.achado ? { borderColor: COR_RARIDADE[resultado.achado.raridade] } : undefined}>
          {resultado.achado ? (
            <>
              <p className="text-5xl vtm-pulo">{resultado.achado.emoji}</p>
              <p className="font-display font-bold text-lg mt-2">{resultado.achado.nome}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: COR_RARIDADE[resultado.achado.raridade] }}>
                {NOMES_RARIDADE[resultado.achado.raridade]}
              </p>
              <p className="text-sm text-ink-300 mt-2">{resultado.achado.texto}</p>
            </>
          ) : (
            <p className="text-sm text-ink-300">{resultado.motivo}</p>
          )}
        </div>
      )}

      {/* balde */}
      {balde.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs uppercase tracking-wide text-ink-400 mb-2">🪣 Seu balde</h2>
          <ul className="space-y-2">
            {balde.map(([id, q]) => {
              const a = achado(id)!;
              return (
                <li key={id} className="flex items-center gap-3 rounded-2xl border border-base-600 bg-base-800 px-3 py-2">
                  <span className="text-2xl">{a.emoji}</span>
                  <span className="flex-1 min-w-0 text-sm">
                    <span className="font-semibold">{a.nome}</span> <span className="text-ink-400">×{q}</span>
                  </span>
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={async () => {
                      if (!mascote) return;
                      const r = venderDoBalde(mascote, id);
                      if (!r) return;
                      vibrar(15);
                      textoFlutuante(ref.current, `+${r.moedas} 🪙`, "#F2C46D");
                      await salvar(r.mascote);
                    }}
                    className="shrink-0 text-xs font-bold rounded-full bg-financa text-base-900 px-3 py-1.5"
                  >
                    Vender +{a.preco * q} 🪙
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* coleção */}
      <section className="mt-6">
        <h2 className="text-xs uppercase tracking-wide text-ink-400 mb-2">📖 Coleção</h2>
        <div className="grid grid-cols-4 gap-2">
          {ACHADOS.map((a) => {
            const n = mascote?.pesca?.colecao?.[a.id] ?? 0;
            return (
              <div key={a.id} className={`rounded-2xl border bg-base-800 p-2 text-center ${n ? "" : "border-base-600"}`} style={n ? { borderColor: COR_RARIDADE[a.raridade] + "88" } : undefined}>
                <p className={`text-2xl ${n ? "" : "grayscale opacity-25 blur-[1px]"}`}>{a.emoji}</p>
                <p className="text-[10px] leading-tight mt-1 min-h-[24px]">{n ? a.nome : "???"}</p>
                {n > 0 && <p className="text-[10px] text-ink-400">×{n}</p>}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
