"use client";

// Etapa 309 — missões do dia (3 por dia, com prêmio em moedas) e o baú
// da semana (feche as 3 missões em 5 dias e abra um prêmio surpresa).
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMascote } from "@/lib/mascote/useMascote";
import { abrirBau, missoesDoDia, resgatadas, resgatarMissao, semanaDoBau, DIAS_PRO_BAU, type Premio } from "@/lib/mascote/missoes";
import { vibrar } from "@/lib/app/vibrar";
import { chuvaDeConfete, textoFlutuante } from "@/lib/app/festa";

const DIAS = ["S", "T", "Q", "Q", "S", "S", "D"];
const CHAVE_ABERTO = "vt-missoes-aberto";

export function MissoesDoDia({ snapshot, hoje }: { snapshot: any; hoje: string }) {
  const { mascote, salvar, salvando } = useMascote(snapshot, hoje);
  const missoes = useMemo(() => missoesDoDia(snapshot, hoje, mascote), [snapshot, hoje, mascote]);
  const [abrindo, setAbrindo] = useState(false);
  const [premio, setPremio] = useState<Premio | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  // Etapa 311 — fica recolhido numa linha (menos informação na aba Hábitos)
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    try {
      setAberto(localStorage.getItem(CHAVE_ABERTO) === "1");
    } catch {}
  }, []);
  const alternar = () =>
    setAberto((a) => {
      try {
        localStorage.setItem(CHAVE_ABERTO, a ? "0" : "1");
      } catch {}
      return !a;
    });
  if (!snapshot || !missoes.length) return null;

  const ja = resgatadas(mascote, hoje);
  const bau = semanaDoBau(mascote, hoje);
  const prontas = missoes.filter((m) => m.feita && !ja.includes(m.id)).length;

  async function resgatar(i: number) {
    if (!mascote) return;
    const novo = resgatarMissao(mascote, missoes[i], hoje);
    if (!novo) return;
    vibrar([10, 30, 15]);
    textoFlutuante(ref.current, `+${missoes[i].premio} 🪙`, "#F2C46D");
    await salvar(novo);
  }

  async function abrir() {
    if (!mascote) return;
    const r = abrirBau(mascote, hoje);
    if (!r) return;
    setAbrindo(true);
    vibrar([20, 60, 20, 60, 40]);
    setTimeout(async () => {
      setAbrindo(false);
      setPremio(r.premio);
      chuvaDeConfete({ quantidade: 70 });
      await salvar(r.mascote);
    }, 1100);
  }

  return (
    <section ref={ref} className={`relative mb-4 rounded-3xl border bg-base-800 animate-entrar ${prontas > 0 || bau.disponivel ? "border-financa/50" : "border-base-600/70"} ${aberto ? "p-4" : "px-4 py-3"}`}>
      <button type="button" onClick={alternar} aria-expanded={aberto} className={`w-full flex items-center gap-2 text-left ${aberto ? "mb-3" : ""}`}>
        <p className="font-semibold shrink-0">🎯 Missões</p>
        <span className="flex gap-1" aria-label={`${ja.length} de ${missoes.length} resgatadas`}>
          {missoes.map((m) => (
            <span key={m.id} className={`w-2.5 h-2.5 rounded-full ${ja.includes(m.id) ? "bg-habito" : m.feita ? "bg-financa animate-pulse" : "bg-base-600"}`} />
          ))}
        </span>
        {mascote && <span className="text-[11px] text-ink-400 shrink-0">🎁 {bau.aberto ? "✓" : `${bau.completos}/${DIAS_PRO_BAU}`}</span>}
        <span className="ml-auto flex items-center gap-2 shrink-0">
          {(prontas > 0 || bau.disponivel) && (
            <span className="text-[11px] font-semibold rounded-full bg-financa/20 text-financa px-2 py-0.5">{prontas > 0 ? `${prontas} pra resgatar!` : "Baú liberado!"}</span>
          )}
          <span className={`text-ink-400 transition-transform ${aberto ? "rotate-180" : ""}`}>⌄</span>
        </span>
      </button>

      {aberto && (
      <>
      <ul className="space-y-2">
        {missoes.map((m, i) => {
          const pego = ja.includes(m.id);
          return (
            <li key={m.id} className={`flex items-center gap-3 rounded-2xl px-3 py-2 transition ${pego ? "bg-habito/10" : "bg-base-900/40"}`}>
              <span className="text-xl shrink-0">{pego ? "✅" : m.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm leading-tight ${pego ? "text-ink-400 line-through decoration-habito/60" : ""}`}>{m.titulo}</p>
                {m.meta > 1 && !pego && (
                  <div className="h-1 rounded-full bg-base-700 overflow-hidden mt-1.5">
                    <div className="h-full rounded-full bg-habito transition-all duration-700" style={{ width: `${Math.round((m.atual / m.meta) * 100)}%` }} />
                  </div>
                )}
              </div>
              {pego ? (
                <span className="text-xs text-habito font-semibold shrink-0">+{m.premio}</span>
              ) : m.feita && mascote ? (
                <button
                  type="button"
                  disabled={salvando}
                  onClick={() => void resgatar(i)}
                  className="shrink-0 text-xs font-bold rounded-full bg-financa text-base-900 px-3 py-1.5 animate-quicar"
                >
                  +{m.premio} 🪙
                </button>
              ) : (
                <span className="text-xs text-ink-400 shrink-0">
                  {m.meta > 1 ? `${m.atual}/${m.meta} · ` : ""}
                  {m.premio} 🪙
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {!mascote && (
        <p className="text-xs text-ink-400 mt-3">
          <Link href="/habitos/mascote" className="text-habito font-semibold">
            Choque seu mascote
          </Link>{" "}
          pra guardar as moedas das missões 🐣
        </p>
      )}

      {/* baú da semana */}
      {mascote && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-base-600">
          <button
            type="button"
            disabled={!bau.disponivel || salvando || abrindo}
            onClick={() => void abrir()}
            className={`relative text-3xl shrink-0 ${bau.disponivel ? "animate-quicar" : bau.aberto ? "" : "grayscale opacity-60"} ${abrindo ? "vtm-bau" : ""}`}
            aria-label="Baú da semana"
          >
            {bau.aberto ? "📭" : "🎁"}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">
              {bau.aberto ? "Baú desta semana já aberto ✓" : bau.disponivel ? "Baú liberado! Toque pra abrir 🎉" : `Baú da semana · ${bau.completos}/${DIAS_PRO_BAU} dias`}
            </p>
            <div className="flex gap-1 mt-1.5">
              {bau.dias.map((d, i) => (
                <span
                  key={d.dia}
                  className={`flex-1 h-5 rounded-md text-[9px] font-bold flex items-center justify-center ${
                    d.completo ? "bg-habito text-base-900" : d.hoje ? "border border-habito text-habito" : d.futuro ? "bg-base-900/30 text-ink-500" : "bg-base-900/60 text-ink-400"
                  }`}
                >
                  {DIAS[i]}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      </>
      )}

      {premio && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-6" onClick={() => setPremio(null)}>
          <div className="w-full max-w-xs rounded-3xl bg-base-800 border border-financa/40 p-6 text-center animate-entrar">
            <p className="text-6xl vtm-pulo">{premio.emoji}</p>
            <p className="text-lg font-display font-bold mt-3">Você ganhou!</p>
            <p className="text-sm text-ink-300 mt-1">{premio.texto}</p>
            <button type="button" onClick={() => setPremio(null)} className="mt-5 w-full rounded-2xl bg-financa text-base-900 font-semibold py-3">
              Oba! 🎉
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
