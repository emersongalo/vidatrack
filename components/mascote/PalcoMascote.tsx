"use client";

// Etapa 300 — o mascote fica direto na aba Hábitos, num palquinho:
// arrasta pro lado e ele gira (com embalo), toca e ele pula, e o palco
// muda com o humor do dia (sol quando completa, chuvinha quando está
// tristinho, noite estrelada quando dorme). Marcou um hábito? Ele
// comemora e mostra +10 🪙.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useMascote } from "@/lib/mascote/useMascote";
import { fraseDoHumor, MOEDAS_POR_HABITO, type Humor } from "@/lib/mascote/mascote";
import { Mascote } from "@/components/mascote/Mascote";
import { vibrar } from "@/lib/app/vibrar";
import { useGiro } from "@/lib/mascote/useGiro";
import { BandejaComida, BarrasVida } from "@/components/mascote/BandejaComida";

export const PALCO_HUMOR: Record<Humor, { rotulo: string; fundo: string }> = {
  radiante: { rotulo: "🤩 Radiante", fundo: "linear-gradient(170deg, rgba(251,191,36,.32), rgba(251,146,60,.12) 60%, rgba(251,191,36,.05))" },
  feliz: { rotulo: "😊 Feliz", fundo: "linear-gradient(170deg, rgb(var(--c-habito) / .26), rgb(var(--c-habito) / .06))" },
  neutro: { rotulo: "🙂 Esperando você", fundo: "linear-gradient(170deg, rgba(148,163,184,.22), rgba(148,163,184,.05))" },
  triste: { rotulo: "🥺 Com saudade", fundo: "linear-gradient(170deg, rgba(96,165,250,.26), rgba(71,85,105,.12))" },
  dormindo: { rotulo: "😴 Dormindo", fundo: "linear-gradient(170deg, rgba(49,46,129,.55), rgba(30,27,75,.25))" },
  fome: { rotulo: "🍎 Com fome", fundo: "linear-gradient(170deg, rgba(245,158,11,.22), rgba(120,53,15,.08))" },
  doente: { rotulo: "🤒 Dodói", fundo: "linear-gradient(170deg, rgba(100,116,139,.32), rgba(51,65,85,.14))" },
};

const CHAVE_DICA = "vt-mascote-girou";

export { frenteMaisPerto } from "@/lib/mascote/useGiro";

export function PalcoMascote({ snapshot, hoje }: { snapshot: any; hoje: string }) {
  const { mascote, fase, humor, moedas, dia, vida, salvar, salvando } = useMascote(snapshot, hoje);
  const [comendo, setComendo] = useState<{ emoji: string; n: number } | null>(null);
  const [pulos, setPulos] = useState(0);
  const [semente, setSemente] = useState(() => new Date().getDate());
  const [ganho, setGanho] = useState(0);
  const [dica, setDica] = useState(false);
  const feitosAntes = useRef<number | null>(null);
  const feitosHoje = dia?.habitos.feitos ?? 0;

  // Etapa 301 — o giro mora em useGiro (mesmo da página do mascote)
  const { angulo, girarCom, eventos } = useGiro(
    () => {
      // toque: pula e fala outra coisa
      setPulos((p) => p + 1);
      setSemente((x) => x + 1);
      vibrar(10);
    },
    () => {
      setDica(false);
      try {
        localStorage.setItem(CHAVE_DICA, "1");
      } catch {}
    }
  );

  useEffect(() => {
    try {
      setDica(localStorage.getItem(CHAVE_DICA) !== "1");
    } catch {}
  }, []);

  // comemora quando marca um hábito
  useEffect(() => {
    if (feitosAntes.current !== null && feitosHoje > feitosAntes.current) {
      setPulos((p) => p + 1);
      setGanho((g) => g + 1);
      setSemente((x) => x + 1);
      girarCom(14);
    }
    feitosAntes.current = feitosHoje;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feitosHoje]);

  if (!snapshot) return null;

  const cor = mascote?.cor ?? "verde";
  const nivel = mascote ? fase.nivel : 0;
  const palco = PALCO_HUMOR[humor];
  const frase = mascote ? fraseDoHumor(humor, semente) : "Me choca? Eu cresço com seus hábitos 🥚";

  return (
    <section
      className="relative mb-4 overflow-hidden rounded-3xl border border-base-600/70 animate-entrar"
      style={{ background: palco.fundo }}
    >
      <Clima humor={humor} />

      {/* topo: nome, fase, moedas */}
      <div className="relative flex items-center gap-2 px-4 pt-3">
        <p className="font-display font-bold truncate">{mascote ? mascote.nome : "Seu ovinho"}</p>
        {mascote && <span className="text-[10px] font-semibold rounded-full bg-habito/15 text-habito px-2 py-0.5 shrink-0">{fase.nome}</span>}
        <span className="text-[11px] text-ink-300 rounded-full bg-base-900/40 px-2 py-0.5 shrink-0">{palco.rotulo}</span>
        {mascote && (
          <span className="ml-auto relative text-sm font-mono font-semibold rounded-full bg-financa/15 text-financa px-2.5 py-0.5 shrink-0">
            🪙 {moedas}
            {ganho > 0 && (
              <span key={ganho} className="absolute -top-4 right-1 text-xs text-financa vtm-ganho">
                +{MOEDAS_POR_HABITO}
              </span>
            )}
          </span>
        )}
      </div>

      <div className="relative flex items-end gap-1 px-2">
        {/* o bichinho girável */}
        <div
          className="relative shrink-0 cursor-grab active:cursor-grabbing select-none"
          {...eventos}
          role="button"
          aria-label="Arraste pro lado para girar o mascote, toque para ele pular"
        >
          <div key={pulos} className={pulos ? "vtm-pulo" : ""}>
            {/* Etapa 302 — ele aparece no lugar onde mora (muda com a hora e o tempo) */}
            <Mascote cor={cor} fase={nivel} humor={humor} equipados={mascote?.equipados} tamanho={150} angulo={angulo} comFundo={!!mascote} />
          </div>
          {comendo && (
            <span key={comendo.n} className="absolute left-1/2 top-1/2 -ml-3 -mt-3 text-2xl vtm-comer" style={{ ["--de-x" as any]: "50px", ["--de-y" as any]: "50px" }}>
              {comendo.emoji}
            </span>
          )}
          {dica && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-ink-300 bg-base-900/60 rounded-full px-2 py-0.5 pointer-events-none vtm-dica">
              ↔ arraste pra girar
            </span>
          )}
        </div>

        {/* fala + progresso */}
        <div className="min-w-0 flex-1 pb-4 pr-2">
          <p key={frase} className="vtm-fala relative text-sm text-ink-100 bg-base-900/55 backdrop-blur rounded-2xl rounded-bl-md px-3 py-2">
            {frase}
          </p>
          {mascote ? (
            <>
              {vida && (
                <div className="mt-2.5">
                  <BarrasVida vida={vida} compacto />
                </div>
              )}
              {fase.proxima ? (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-base-900/50 overflow-hidden">
                    <div className="h-full rounded-full bg-habito transition-all duration-700" style={{ width: `${Math.round(fase.progresso * 100)}%` }} />
                  </div>
                  <p className="text-[11px] text-ink-400 mt-1">
                    Mais {fase.faltam} {fase.faltam === 1 ? "hábito" : "hábitos"} pra virar {fase.proxima.nome}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-ink-400 mt-2">Fase máxima — lendário! ✨</p>
              )}
            </>
          ) : (
            <Link
              href="/habitos/mascote"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold rounded-full bg-habito text-base-900 px-4 py-2"
            >
              🐣 Chocar meu ovinho
            </Link>
          )}
        </div>
      </div>

      {/* Etapa 302 — cuidar: dar comidinha/remédio direto daqui */}
      {mascote && (
        <div className="relative flex items-center gap-2 px-3 pb-3">
          <div className="min-w-0 flex-1">
            <BandejaComida
              mascote={mascote}
              vida={vida}
              hoje={hoje}
              salvar={salvar}
              salvando={salvando}
              aoComer={(emoji) => {
                setComendo({ emoji, n: Date.now() });
                setTimeout(() => setPulos((p) => p + 1), 650);
              }}
            />
          </div>
          {/* Etapa 305 — a casa dele */}
          <Link
            href="/habitos/mascote/casa"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full bg-base-900/50 hover:bg-base-900/70 px-3 py-2 transition"
          >
            🏠 Casa
          </Link>
          <Link
            href="/habitos/mascote"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full bg-base-900/50 hover:bg-base-900/70 px-3 py-2 transition"
          >
            <ShoppingBag size={13} /> Lojinha
          </Link>
        </div>
      )}
    </section>
  );
}

/** Enfeites do palco conforme o humor. */
function Clima({ humor }: { humor: Humor }) {
  if (humor === "radiante") {
    return (
      <div aria-hidden className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full vtm-sol" style={{ background: "radial-gradient(circle, rgba(253,224,71,.45), transparent 65%)" }} />
    );
  }
  if (humor === "triste") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {[8, 22, 37, 55, 68, 82, 93].map((x, i) => (
          <span key={x} className="absolute top-0 w-px h-3 bg-sky-300/50 vtm-chuva" style={{ left: `${x}%`, animationDelay: `${i * 0.27}s` }} />
        ))}
      </div>
    );
  }
  if (humor === "dormindo") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {[[10, 20], [28, 8], [62, 14], [80, 30], [92, 10], [45, 26]].map(([x, y], i) => (
          <span key={i} className="absolute w-1 h-1 rounded-full bg-white/80 animate-cintilar" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.4}s` }} />
        ))}
      </div>
    );
  }
  return null;
}
