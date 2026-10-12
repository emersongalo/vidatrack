"use client";

// Etapa 302 — o jardim da dupla com os mascotes: a planta do hábito
// compartilhado fica no meio, o seu bichinho de um lado e o do seu par do
// outro. Quem fez o hábito hoje aparece regando. A planta cresce com os
// dias em que vocês dois fazem (+ adubo) e, a partir da flor, dá frutos —
// cada um colhe os seus e eles viram comida pro mascote.
// Etapa 306 — a cena virou o jardim isométrico (JardimIso).
import { useState } from "react";
import Link from "next/link";
import { periodoDaHora } from "@/components/mascote/Mascote";
import { JardimIso } from "@/components/mascote/JardimIso";
import {
  adubosNaPlanta,
  colherFrutos,
  DIAS_ADUBO,
  faseDoMascote,
  frutaDaPlanta,
  frutosParaColher,
  FRUTO_A_PARTIR,
  lerMascote,
  usarConsumivel,
  type DadosMascote,
} from "@/lib/mascote/mascote";
import { ESTAGIOS_PLANTA, estagioDaPlanta, type InfoDupla } from "@/lib/habitos/dupla";
import { vibrar } from "@/lib/app/vibrar";

const SAUDE = ["Murchinha — reguem hoje pra ela se recuperar", "Precisando de água…", "Viçosa e feliz"];

export type ParceiroMascote = { usuario_id: string; mascote: unknown; feitos: number | null };

const CEU: Record<string, string> = {
  manha: "linear-gradient(180deg, #9FD4F5, #FCE7C8 70%)",
  tarde: "linear-gradient(180deg, #6EC1F2, #CBEBFF 70%)",
  entardecer: "linear-gradient(180deg, #7C6BB5, #F7A97C 70%)",
  noite: "linear-gradient(180deg, #0E1738, #273469 70%)",
};

/** Crescimento da planta = dias juntos + adubo de todo mundo. */
export function crescimentoDaPlanta(diasJuntos: number, habitoId: string, meu: DadosMascote | null, deles: (DadosMascote | null)[]) {
  const adubos = adubosNaPlanta(meu, habitoId) + deles.reduce((s, m) => s + adubosNaPlanta(m, habitoId), 0);
  return { crescimento: diasJuntos + adubos * DIAS_ADUBO, adubos };
}

export function JardimDupla({
  habitoId,
  info,
  meu,
  minhaFase,
  parceirosMascote,
  hoje,
  salvar,
  salvando,
}: {
  habitoId: string;
  info: InfoDupla;
  meu: DadosMascote | null;
  minhaFase: number;
  parceirosMascote: ParceiroMascote[];
  hoje: string;
  salvar: (m: DadosMascote) => Promise<boolean>;
  salvando: boolean;
}) {
  const [colhendo, setColhendo] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const periodo = periodoDaHora(new Date().getHours());

  const deles = info.parceiros.map((p) => {
    const pm = parceirosMascote.find((x) => x.usuario_id === p.id);
    const m = lerMascote(pm?.mascote);
    return { ...p, mascote: m, fase: m ? Math.max(1, faseDoMascote(pm?.feitos ?? 0).nivel) : 0 };
  });
  const { crescimento, adubos } = crescimentoDaPlanta(info.diasJuntos, habitoId, meu, deles.map((d) => d.mascote));
  const { estagio, proximoEm } = estagioDaPlanta(crescimento);
  const proximo = ESTAGIOS_PLANTA[estagio + 1];
  const fruta = frutaDaPlanta(habitoId);
  const prontos = frutosParaColher(meu, habitoId, crescimento);
  const aduboHoje = (meu?.consumos ?? []).some((c) => c.t === "adubo" && c.h === habitoId && c.d === hoje);
  const temAdubo = (meu?.estoque?.adubo ?? 0) > 0;
  const primeiroParceiro = deles[0];

  async function colher() {
    if (!meu || prontos <= 0) return;
    const r = colherFrutos(meu, habitoId, crescimento);
    setColhendo(r.colhidos);
    vibrar([10, 30, 10, 30, 20]);
    if (await salvar(r.mascote)) setAviso(`+${r.colhidos} ${fruta} na despensa do seu mascote!`);
    setTimeout(() => setColhendo(0), 800);
  }

  async function adubar() {
    if (!meu) return;
    const r = usarConsumivel(meu, "adubo", hoje, habitoId);
    if (!r.ok) {
      setAviso(r.motivo);
      return;
    }
    vibrar(15);
    if (await salvar(r.mascote)) setAviso(`🌿 Adubada! A planta ganhou +${DIAS_ADUBO} dias de crescimento.`);
  }

  return (
    <div>
      {/* a cena — Etapa 306: jardim isométrico, igual ao da casa */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: CEU[periodo] }}>
        <JardimIso
          periodo={periodo}
          plantas={[{ id: habitoId, nome: "", estagio, saude: info.saude, frutos: meu ? prontos : 0, fruta, regada: info.euFiz || info.parceiros.some((p) => p.feito) }]}
          mascotes={[
            meu
              ? { chave: "eu", nome: "Você", cor: meu.cor, fase: Math.max(1, minhaFase), equipados: meu.equipados, regou: info.euFiz }
              : { chave: "eu", nome: "Você", cor: "verde", fase: 0, equipados: {}, regou: info.euFiz, ovo: true },
            ...(primeiroParceiro
              ? [
                  primeiroParceiro.mascote
                    ? { chave: primeiroParceiro.id, nome: primeiroParceiro.nome, cor: primeiroParceiro.mascote.cor, fase: primeiroParceiro.fase, equipados: primeiroParceiro.mascote.equipados, regou: primeiroParceiro.feito }
                    : { chave: primeiroParceiro.id, nome: primeiroParceiro.nome, cor: "lilas" as const, fase: 0, equipados: {}, regou: primeiroParceiro.feito, ovo: true },
                ]
              : []),
          ]}
          aoTocarPlanta={prontos > 0 && meu ? () => void colher() : undefined}
        />
        {colhendo > 0 && <span className="absolute inset-x-0 top-1/3 text-center text-2xl vtm-colher">{fruta}</span>}

        {/* quem já regou hoje */}
        <div className="absolute top-2 inset-x-2 flex justify-between text-[10px] font-semibold">
          <span className={`rounded-full px-2 py-0.5 ${info.euFiz ? "bg-sky-500/80 text-white" : "bg-black/30 text-white/80"}`}>{info.euFiz ? "💧 você regou" : "você ainda não regou"}</span>
          {primeiroParceiro && (
            <span className={`rounded-full px-2 py-0.5 ${primeiroParceiro.feito ? "bg-sky-500/80 text-white" : "bg-black/30 text-white/80"}`}>
              {primeiroParceiro.feito ? `💧 ${primeiroParceiro.nome} regou` : `${primeiroParceiro.nome} ainda não`}
            </span>
          )}
        </div>
      </div>

      {/* estágio + ações */}
      <div className="flex items-start gap-3 mt-3">
        <div className="flex-1 min-w-0">
          <p className="text-xl font-display font-bold">
            {ESTAGIOS_PLANTA[estagio].nome}
            {estagio >= 5 && <span className="text-base"> · dá {fruta}</span>}
          </p>
          <p className="text-xs text-ink-400">{SAUDE[info.saude]}</p>
          {proximo && proximoEm !== null ? (
            <>
              <div className="h-2 bg-base-700 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-habito rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, ((crescimento - ESTAGIOS_PLANTA[estagio].minimo) / (proximo.minimo - ESTAGIOS_PLANTA[estagio].minimo)) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-ink-400 mt-1">
                Mais {proximoEm} {proximoEm === 1 ? "dia" : "dias"} regando juntos pra virar {proximo.nome.toLowerCase()}
                {crescimento < FRUTO_A_PARTIR && " · frutos a partir da flor"}
              </p>
            </>
          ) : (
            <p className="text-xs text-ink-400 mt-1">Árvore adulta — um fruto novo a cada 3 dias juntos.</p>
          )}
          {adubos > 0 && <p className="text-[11px] text-ink-400 mt-0.5">🌿 {adubos} {adubos === 1 ? "adubo" : "adubos"} (+{adubos * DIAS_ADUBO} dias)</p>}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {prontos > 0 && meu && (
            <button type="button" onClick={() => void colher()} disabled={salvando} className="text-xs font-semibold rounded-full bg-financa text-base-900 px-3 py-1.5">
              Colher {prontos} {fruta}
            </button>
          )}
          {meu && (
            <button
              type="button"
              onClick={() => void adubar()}
              disabled={salvando || aduboHoje || !temAdubo}
              title={!temAdubo ? "Compre adubo na lojinha do mascote" : aduboHoje ? "Já adubou hoje" : "Usar 1 adubo"}
              className="text-xs font-semibold rounded-full border border-habito/50 text-habito px-3 py-1.5 disabled:opacity-40"
            >
              🌿 {aduboHoje ? "Adubada hoje" : `Adubar${temAdubo ? ` (${meu.estoque?.adubo})` : ""}`}
            </button>
          )}
        </div>
      </div>
      {aviso && <p className="text-xs text-habito mt-2 animate-surgir">{aviso}</p>}
      {!meu && <p className="text-xs text-ink-400 mt-2">Choque seu mascote em Hábitos → 🐣 pra ele aparecer aqui regando.</p>}
      {/* Etapa 305 — visitar a casa do par */}
      {primeiroParceiro?.mascote?.casa && (
        <Link href={`/habitos/mascote/casa?de=${primeiroParceiro.id}`} className="inline-block mt-2 text-xs font-semibold text-habito">
          🏠 Visitar a casa de {primeiroParceiro.nome} →
        </Link>
      )}
    </div>
  );
}
