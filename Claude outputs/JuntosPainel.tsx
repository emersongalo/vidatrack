"use client";

// Etapa 234 — cena viva dos hábitos em dupla no Início.
// Etapa 236 — o céu segue a hora do dia (madrugada, amanhecer, dia, fim
// de tarde e noite), plantas maiores e a carinha pousada logo em cima de
// cada plantinha.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CarinhaDupla } from "@/components/CarinhaDupla";
import { PlantaDupla } from "@/components/PlantaDupla";
import { CenaJuntos } from "@/components/CenaJuntos";
import { duplasDoRetrato, type HumorDupla } from "@/lib/habitos/dupla";
import { diasJuntosTexto, periodoDoDia } from "@/lib/painel/periodo";

// espaço vazio acima da planta em cada estágio (em unidades do desenho 80×96)
const VAZIO_ACIMA = [58, 54, 44, 32, 24, 18, 8];

function useHora() {
  const [hora, setHora] = useState(() => new Date().getHours());
  useEffect(() => {
    const t = setInterval(() => setHora(new Date().getHours()), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);
  return hora;
}

function PlantaComCarinha({ estagio, saude, humor, tamanho, atraso }: { estagio: number; saude: 0 | 1 | 2; humor: HumorDupla; tamanho: number; atraso: number }) {
  const escala = (tamanho * 1.2) / 96;
  const sobe = Math.max(0, Math.round(VAZIO_ACIMA[estagio] * escala) - 6);
  return (
    <div className="flex flex-col items-center">
      <span className="animate-boiar relative z-10" style={{ marginBottom: -sobe, animationDelay: `${atraso}s` }}>
        <CarinhaDupla humor={humor} tamanho={Math.round(tamanho * 0.42)} />
      </span>
      <PlantaDupla estagio={estagio} saude={saude} tamanho={tamanho} />
    </div>
  );
}

export function JuntosPainel({ snapshot, hoje }: { snapshot: any; hoje: string }) {
  const hora = useHora();
  const periodo = periodoDoDia(hora);
  const duplas = useMemo(() => duplasDoRetrato(snapshot, hoje, hora), [snapshot, hoje, hora]);
  if (!snapshot) return null;

  // sem ninguém ainda: convite com duas carinhas e uma semente
  if (!duplas.length) {
    return (
      <section className="bg-base-800 border border-base-600 rounded-3xl p-4">
        <CenaJuntos periodo={periodo} festa={false}>
          <div className="flex items-end gap-4">
            <span className="animate-boiar mb-4">
              <CarinhaDupla humor="tranquilo" tamanho={36} />
            </span>
            <PlantaDupla estagio={0} saude={2} tamanho={80} />
            <span className="animate-boiar mb-4" style={{ animationDelay: "-1.3s" }}>
              <CarinhaDupla humor="esperandoParceiro" tamanho={36} />
            </span>
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
  const tamanho = mostrar.length >= 4 ? 64 : mostrar.length === 3 ? 76 : 88;

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
        {mostrar.map(({ habito, info }, i) => (
          <Link key={habito.id} href={`/habitos/juntos#${habito.id}`} aria-label={habito.nome}>
            <PlantaComCarinha estagio={info.estagio} saude={info.saude} humor={info.humor} tamanho={tamanho} atraso={-i * 0.6} />
          </Link>
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
