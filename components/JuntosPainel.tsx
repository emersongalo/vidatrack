"use client";

// Etapa 234 — cena viva dos hábitos em dupla no Início.
// Etapa 303 — no lugar das carinhas, os mascotes de vocês cuidando das plantas.
// Etapa 236 — o céu segue a hora do dia (madrugada, amanhecer, dia, fim
// de tarde e noite), plantas maiores e a carinha pousada logo em cima de
// cada plantinha.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PlantaDupla } from "@/components/PlantaDupla";
import { CenaJuntos } from "@/components/CenaJuntos";
import { duplasDoRetrato } from "@/lib/habitos/dupla";
import { diasJuntosTexto, periodoDoDia } from "@/lib/painel/periodo";
// Etapa 303 — os mascotes de vocês na cena (o seu na esquerda, o do par na direita)
import { Mascote } from "@/components/mascote/Mascote";
import { useMascote } from "@/lib/mascote/useMascote";
import { faseDoMascote, lerMascote, type DadosMascote } from "@/lib/mascote/mascote";
import { crescimentoDaPlanta, type ParceiroMascote } from "@/components/mascote/JardimDupla";
import { estagioDaPlanta } from "@/lib/habitos/dupla";

function useHora() {
  const [hora, setHora] = useState(() => new Date().getHours());
  useEffect(() => {
    const t = setInterval(() => setHora(new Date().getHours()), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);
  return hora;
}

/** Bichinho pequeno na cena (ou ovinho, se a pessoa ainda não chocou). */
function MiniMascote({ m, fase, regando, espelhar, nome, tamanho }: { m: DadosMascote | null; fase: number; regando: boolean; espelhar?: boolean; nome: string; tamanho: number }) {
  return (
    <div className="flex flex-col items-center shrink-0">
      <div style={espelhar ? { transform: "scaleX(-1)" } : undefined}>
        {m ? (
          <Mascote
            cor={m.cor}
            fase={Math.max(1, fase)}
            humor={regando ? "feliz" : "neutro"}
            equipados={{ ...m.equipados, mao: regando ? "regador" : m.equipados.mao, fundo: undefined, amigo: undefined }}
            tamanho={tamanho}
          />
        ) : (
          <Mascote cor={espelhar ? "lilas" : "verde"} fase={0} humor="feliz" tamanho={Math.round(tamanho * 0.8)} />
        )}
      </div>
      <span className="text-[10px] font-semibold text-white drop-shadow -mt-1 max-w-[80px] truncate">{nome}</span>
    </div>
  );
}

export function JuntosPainel({ snapshot, hoje }: { snapshot: any; hoje: string }) {
  const hora = useHora();
  const { mascote: meu, fase: minhaFase } = useMascote(snapshot, hoje);
  const periodo = periodoDoDia(hora);
  const duplas = useMemo(() => duplasDoRetrato(snapshot, hoje, hora), [snapshot, hoje, hora]);
  if (!snapshot) return null;

  // sem ninguém ainda: convite com duas carinhas e uma semente
  if (!duplas.length) {
    return (
      <section className="bg-base-800 border border-base-600 rounded-3xl p-4">
        <CenaJuntos periodo={periodo} festa={false}>
          <div className="flex items-end gap-4">
            <MiniMascote m={meu} fase={minhaFase.nivel} regando={false} nome="Você" tamanho={84} />
            <PlantaDupla estagio={0} saude={2} tamanho={80} />
            <MiniMascote m={null} fase={0} regando={false} espelhar nome="Seu par?" tamanho={84} />
          </div>
        </CenaJuntos>
        <p className="text-lg font-semibold mt-3">Façam hábitos juntos 🌱</p>
        <p className="text-sm text-ink-400">Compartilhe um hábito com alguém: cada dia que os dois fizerem, a plantinha de vocês cresce.</p>
        <Link href="/habitos/lista" className="inline-block mt-3 bg-habito text-base-900 rounded-xl px-4 py-2.5 text-base font-semibold">
          Compartilhar um hábito
        </Link>
      </section>
    );
  }

  const mostrar = duplas.slice(0, 4);
  const feitosJuntos = duplas.filter((d) => d.info.humor === "festa").length;
  const nomes = [...new Set(duplas.flatMap((d) => d.info.parceiros.map((p) => p.nome)))];
  const tamanho = mostrar.length >= 4 ? 52 : mostrar.length === 3 ? 62 : 76;
  const tamanhoMascote = mostrar.length >= 3 ? 70 : 84;
  // mascotes dos pares (até 2 diferentes) e quem já regou hoje
  const pm = (snapshot.parceirosMascote ?? []) as ParceiroMascote[];
  const pares = [...new Map(duplas.flatMap((d) => d.info.parceiros).map((p) => [p.id, p])).values()].slice(0, 2).map((p) => {
    const dado = pm.find((x) => x.usuario_id === p.id);
    const m = lerMascote(dado?.mascote);
    return { ...p, m, fase: m ? faseDoMascote(dado?.feitos ?? 0).nivel : 0, regou: duplas.some((d) => d.info.parceiros.some((q) => q.id === p.id && q.feito)) };
  });
  const euReguei = duplas.some((d) => d.info.euFiz);
  const estagioCom = (habitoId: string, diasJuntos: number) =>
    estagioDaPlanta(crescimentoDaPlanta(diasJuntos, habitoId, meu, pares.map((p) => p.m)).crescimento).estagio;

  return (
    <section className="bg-base-800 border border-base-600 rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">Juntos 🌱</h2>
          <p className="text-sm text-ink-400 truncate">
            {feitosJuntos === duplas.length
              ? `Você e ${nomes.join(" e ")} estão em dia!`
              : `${feitosJuntos} de ${duplas.length} feitos juntos hoje · com ${nomes.join(" e ")}`}
          </p>
        </div>
        <Link href="/habitos/juntos" className="text-base text-ink-400 hover:text-ink-100 transition shrink-0">
          Jardim ›
        </Link>
      </div>

      <CenaJuntos periodo={periodo} festa={feitosJuntos > 0}>
        <MiniMascote m={meu} fase={minhaFase.nivel} regando={euReguei} nome="Você" tamanho={tamanhoMascote} />
        {mostrar.map(({ habito, info }) => (
          <Link key={habito.id} href={`/habitos/juntos#${habito.id}`} aria-label={habito.nome}>
            <PlantaDupla estagio={estagioCom(habito.id, info.diasJuntos)} saude={info.saude} tamanho={tamanho} />
          </Link>
        ))}
        {pares.map((p) => (
          <MiniMascote key={p.id} m={p.m} fase={p.fase} regando={p.regou} espelhar nome={p.nome} tamanho={pares.length > 1 ? tamanhoMascote - 14 : tamanhoMascote} />
        ))}
      </CenaJuntos>

      <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: `repeat(${mostrar.length}, minmax(0, 1fr))` }}>
        {mostrar.map(({ habito, info }) => (
          <div key={habito.id} className="text-center min-w-0">
            <p className="text-sm font-medium truncate">{habito.nome}</p>
            <p className="text-xs text-ink-400">{info.sequencia > 0 ? `🔥 ${info.sequencia} seguidos` : diasJuntosTexto(info.diasJuntos)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
