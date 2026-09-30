"use client";

// Etapa 236 — o céu do "Juntos" muda com a hora: madrugada estrelada,
// amanhecer rosado, dia azul com sol e passarinhos, fim de tarde
// alaranjado e noite com lua, estrelas piscando, estrela cadente e
// vagalumes em cima da grama.
import type { PeriodoDoDia } from "@/lib/painel/periodo";
import { ROTULO_PERIODO } from "@/lib/painel/periodo";

const CEU: Record<PeriodoDoDia, { fundo: string; grama: string; gramaTopo: string; nuvem: string; rotulo: string }> = {
  madrugada: {
    fundo: "linear-gradient(180deg, #070B1F 0%, #131A3D 60%, #1C2552 100%)",
    grama: "linear-gradient(180deg, #1D3A2B 0%, #142A1F 100%)",
    gramaTopo: "#1D3A2B",
    nuvem: "rgba(120,130,170,0.18)",
    rotulo: "text-indigo-100 bg-white/10",
  },
  amanhecer: {
    fundo: "linear-gradient(180deg, #3B4B8C 0%, #C77DA0 45%, #F6A77E 75%, #FFD9A6 100%)",
    grama: "linear-gradient(180deg, #6DA66A 0%, #4F8752 100%)",
    gramaTopo: "#6DA66A",
    nuvem: "rgba(255,225,230,0.7)",
    rotulo: "text-white bg-white/20",
  },
  dia: {
    fundo: "linear-gradient(180deg, #6EC1F2 0%, #A9DDF8 55%, #DDF3FF 100%)",
    grama: "linear-gradient(180deg, #7FCB7D 0%, #5DAE62 100%)",
    gramaTopo: "#7FCB7D",
    nuvem: "rgba(255,255,255,0.9)",
    rotulo: "text-sky-900 bg-white/50",
  },
  entardecer: {
    fundo: "linear-gradient(180deg, #4A3A87 0%, #B45B8C 40%, #F2785E 72%, #FFC27A 100%)",
    grama: "linear-gradient(180deg, #5E8F57 0%, #44713F 100%)",
    gramaTopo: "#5E8F57",
    nuvem: "rgba(255,190,190,0.6)",
    rotulo: "text-white bg-white/20",
  },
  noite: {
    fundo: "linear-gradient(180deg, #0B1330 0%, #17244F 60%, #253668 100%)",
    grama: "linear-gradient(180deg, #22402F 0%, #172E21 100%)",
    gramaTopo: "#22402F",
    nuvem: "rgba(140,155,200,0.2)",
    rotulo: "text-indigo-100 bg-white/10",
  },
};

// posições fixas (sem Math.random, pra não piscar diferente a cada render)
const ESTRELAS = [
  [6, 10, 2], [14, 28, 1.5], [22, 8, 1.5], [31, 20, 2.5], [40, 6, 1.5], [47, 30, 1.5], [55, 14, 2], [63, 5, 1.5],
  [70, 24, 2], [78, 11, 1.5], [86, 30, 1.5], [93, 8, 2], [10, 42, 1.5], [36, 44, 1.5], [60, 40, 1.5], [82, 46, 1.5],
];
const VAGALUMES = [
  [12, 16], [30, 24], [48, 12], [66, 26], [84, 18], [22, 34],
];

function Sol({ baixo = false }: { baixo?: boolean }) {
  return (
    <div className={`absolute ${baixo ? "bottom-5 left-1/2 -ml-10 w-20 h-20 opacity-90" : "top-3 right-5 w-14 h-14"}`}>
      <div className="absolute inset-0 animate-girar">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 w-1 h-3 -ml-0.5 rounded-full"
            style={{ transform: `rotate(${i * 36}deg) translateY(${baixo ? -38 : -27}px)`, background: baixo ? "rgba(255,160,90,0.8)" : "rgba(255,210,60,0.85)" }}
          />
        ))}
      </div>
      <span
        className="absolute inset-2.5 rounded-full"
        style={{
          background: baixo ? "radial-gradient(circle at 40% 40%, #FFE08A, #FF9F4A)" : "radial-gradient(circle at 40% 40%, #FFF6B0, #FFD23F)",
          boxShadow: baixo ? "0 0 28px 8px rgba(255,150,80,0.55)" : "0 0 22px 6px rgba(255,214,60,0.55)",
        }}
      />
    </div>
  );
}

function Lua({ ceu }: { ceu: string }) {
  return (
    <div className="absolute top-3 right-6 w-12 h-12 rounded-full overflow-hidden animate-brilhar" style={{ background: "#FFF3C9" }}>
      {/* sombra que faz a lua crescente (da cor do céu) */}
      <span className="absolute -top-1 left-3.5 w-12 h-12 rounded-full" style={{ background: ceu }} />
      <span className="absolute top-6 left-2 w-2 h-2 rounded-full bg-amber-200/60" />
    </div>
  );
}

function Nuvem({ topo, atraso, duracao, cor, escala = 1 }: { topo: number; atraso: number; duracao: number; cor: string; escala?: number }) {
  return (
    <span className="absolute left-0 animate-nuvem" style={{ top: topo, animationDelay: `${atraso}s`, animationDuration: `${duracao}s` }}>
      <span className="relative block w-16 h-5 rounded-full" style={{ background: cor, transform: `scale(${escala})` }}>
        <span className="absolute -top-3 left-3 w-8 h-7 rounded-full" style={{ background: cor }} />
        <span className="absolute -top-2 left-8 w-6 h-5 rounded-full" style={{ background: cor }} />
      </span>
    </span>
  );
}

function Passaro({ topo, atraso }: { topo: number; atraso: number }) {
  return (
    <span className="absolute left-0 animate-passaro" style={{ top: topo, animationDelay: `${atraso}s` }}>
      <svg width="18" height="10" viewBox="0 0 18 10" className="animate-asas" style={{ transformOrigin: "center" }}>
        <path d="M1 6 Q5 1 9 6 Q13 1 17 6" stroke="#2B3A4A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function CenaJuntos({ periodo, festa, children }: { periodo: PeriodoDoDia; festa: boolean; children: React.ReactNode }) {
  const c = CEU[periodo];
  const escuro = periodo === "noite" || periodo === "madrugada";

  return (
    <div className="relative h-56 rounded-2xl overflow-hidden" style={{ background: c.fundo }}>
      <span className={`absolute top-2.5 left-3 text-xs font-medium rounded-full px-2 py-0.5 backdrop-blur-sm ${c.rotulo}`}>{ROTULO_PERIODO[periodo]}</span>

      {/* estrelas (noite, madrugada e o finzinho delas no amanhecer) */}
      {(escuro || periodo === "amanhecer") &&
        ESTRELAS.slice(0, periodo === "amanhecer" ? 5 : ESTRELAS.length).map(([x, y, r], i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white animate-cintilar"
            style={{ left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, animationDelay: `${(i % 6) * 0.4}s`, opacity: periodo === "amanhecer" ? 0.5 : undefined }}
          />
        ))}
      {escuro && (
        <span className="absolute top-4 right-[30%]" style={{ transform: "rotate(-24deg)" }}>
          <span className="block w-16 h-0.5 rounded-full animate-cadente" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.95), transparent)", animationDelay: "2s" }} />
        </span>
      )}

      {escuro && <Lua ceu={periodo === "noite" ? "#0D1633" : "#080D23"} />}
      {periodo === "dia" && <Sol />}
      {(periodo === "entardecer" || periodo === "amanhecer") && <Sol baixo />}

      <Nuvem topo={18} atraso={-8} duracao={40} cor={c.nuvem} />
      <Nuvem topo={50} atraso={-26} duracao={56} cor={c.nuvem} escala={0.7} />

      {periodo === "dia" && (
        <>
          <Passaro topo={36} atraso={-3} />
          <Passaro topo={46} atraso={-5} />
          <Passaro topo={28} atraso={-11} />
        </>
      )}

      {/* coraçõezinhos quando a dupla está em dia */}
      {festa &&
        [14, 40, 62, 84].map((x, i) => (
          <span
            key={x}
            className="absolute bottom-10 text-base animate-subir"
            style={{ left: `${x}%`, animationDelay: `${i * 0.8}s`, animationIterationCount: "infinite", animationDuration: "3.4s" }}
          >
            {escuro ? "💛" : "💚"}
          </span>
        ))}

      {/* grama com ondinhas */}
      <div className="absolute bottom-0 left-0 right-0 h-10" style={{ background: c.grama }} />
      <svg className="absolute bottom-9 left-0 w-full h-4" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden>
        <path d="M0 10 Q4 0 8 10 Q12 3 16 10 Q20 0 24 10 Q28 4 32 10 Q36 0 40 10 Q44 3 48 10 Q52 0 56 10 Q60 4 64 10 Q68 0 72 10 Q76 3 80 10 Q84 0 88 10 Q92 4 96 10 Q98 2 100 10 Z" fill={c.gramaTopo} />
      </svg>

      {/* vagalumes à noite */}
      {escuro &&
        VAGALUMES.map(([x, y], i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full animate-vagalume"
            style={{ left: `${x + 4}%`, bottom: y, background: "#F7FF8A", boxShadow: "0 0 8px 3px rgba(240,255,120,0.7)", animationDelay: `${i * 0.7}s` }}
          />
        ))}

      <div className="absolute inset-x-0 bottom-3 flex items-end justify-around px-2">{children}</div>
    </div>
  );
}
