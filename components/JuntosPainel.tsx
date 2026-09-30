"use client";

// Etapa 234 — no Painel, no lugar da caixa do assistente: uma cena viva
// dos hábitos em dupla. Céu com sol e nuvens passando, a grama e as
// plantinhas de cada hábito compartilhado com a carinha do dia boiando
// em cima. Quando os dois já fizeram, sobem coraçõezinhos.
import Link from "next/link";
import { useMemo } from "react";
import { CarinhaDupla } from "@/components/CarinhaDupla";
import { PlantaDupla } from "@/components/PlantaDupla";
import { duplasDoRetrato } from "@/lib/habitos/dupla";

function Cena({ children, festa }: { children: React.ReactNode; festa: boolean }) {
  return (
    <div className="relative h-44 rounded-2xl overflow-hidden bg-gradient-to-b from-sky-300/35 via-sky-200/15 to-transparent">
      {/* sol */}
      <div className="absolute top-3 right-4 w-11 h-11">
        <div className="absolute inset-0 animate-girar">
          {Array.from({ length: 8 }, (_, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 w-0.5 h-2.5 -ml-px bg-yellow-400/70 rounded-full"
              style={{ transform: `rotate(${i * 45}deg) translateY(-21px)` }}
            />
          ))}
        </div>
        <span className="absolute inset-2 rounded-full bg-yellow-300 shadow-[0_0_18px_rgba(250,204,21,0.6)]" />
      </div>
      {/* nuvens */}
      <span className="absolute top-4 left-0 animate-nuvem opacity-80" style={{ animationDelay: "-8s" }}>
        <span className="block w-14 h-4 rounded-full bg-white/80" />
        <span className="block w-8 h-4 rounded-full bg-white/80 -mt-6 ml-3" />
      </span>
      <span className="absolute top-12 left-0 animate-nuvem opacity-60" style={{ animationDelay: "-24s", animationDuration: "52s" }}>
        <span className="block w-10 h-3 rounded-full bg-white/80" />
        <span className="block w-6 h-3 rounded-full bg-white/80 -mt-5 ml-2" />
      </span>
      {/* coraçõezinhos quando a dupla está em dia */}
      {festa &&
        [12, 38, 64, 86].map((x, i) => (
          <span key={x} className="absolute bottom-6 text-base animate-subir" style={{ left: `${x}%`, animationDelay: `${i * 0.7}s`, animationIterationCount: "infinite", animationDuration: "3.2s" }}>
            💚
          </span>
        ))}
      {/* grama */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-habito/50 to-habito/30 rounded-b-2xl" />
      <svg className="absolute bottom-7 left-0 w-full h-3 text-habito/50" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden>
        <path d="M0 10 Q5 0 10 10 Q15 2 20 10 Q25 0 30 10 Q35 3 40 10 Q45 0 50 10 Q55 2 60 10 Q65 0 70 10 Q75 3 80 10 Q85 0 90 10 Q95 2 100 10 Z" fill="currentColor" />
      </svg>
      <div className="absolute inset-x-0 bottom-2 flex items-end justify-around px-2">{children}</div>
    </div>
  );
}

export function JuntosPainel({ snapshot, hoje }: { snapshot: any; hoje: string }) {
  const duplas = useMemo(() => duplasDoRetrato(snapshot, hoje, new Date().getHours()), [snapshot, hoje]);
  if (!snapshot) return null;

  // sem ninguém ainda: convite com duas carinhas e uma semente
  if (!duplas.length) {
    return (
      <section className="bg-base-800 border border-base-600 rounded-3xl p-4">
        <Cena festa={false}>
          <div className="flex items-end gap-3">
            <span className="animate-boiar mb-6">
              <CarinhaDupla humor="tranquilo" tamanho={34} />
            </span>
            <PlantaDupla estagio={0} saude={2} tamanho={62} />
            <span className="animate-boiar mb-6" style={{ animationDelay: "-1.3s" }}>
              <CarinhaDupla humor="esperandoParceiro" tamanho={34} />
            </span>
          </div>
        </Cena>
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

  return (
    <section className="bg-base-800 border border-base-600 rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3">
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

      <Cena festa={feitosJuntos > 0}>
        {mostrar.map(({ habito, info }, i) => (
          <Link key={habito.id} href={`/habitos/juntos#${habito.id}`} className="flex flex-col items-center min-w-0" aria-label={habito.nome}>
            <span className="animate-boiar -mb-1" style={{ animationDelay: `${-i * 0.6}s` }}>
              <CarinhaDupla humor={info.humor} tamanho={30} />
            </span>
            <PlantaDupla estagio={info.estagio} saude={info.saude} tamanho={mostrar.length > 2 ? 52 : 64} />
          </Link>
        ))}
      </Cena>

      <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: `repeat(${mostrar.length}, minmax(0, 1fr))` }}>
        {mostrar.map(({ habito, info }) => (
          <div key={habito.id} className="text-center min-w-0">
            <p className="text-sm font-medium truncate">{habito.nome}</p>
            <p className="text-xs text-ink-400">{info.sequencia > 0 ? `🔥 ${info.sequencia} juntos` : `${info.diasJuntos} dias juntos`}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
