// Etapa 230 — "carregando" padrão: blocos no formato do conteúdo
// Etapa 248 — em vez de piscar, um brilho passa por cima (parece mais
// rápido) e tem variações: lista, cartões e topo grande.
import type { CSSProperties } from "react";

const BRILHO: CSSProperties = {
  backgroundImage: "linear-gradient(90deg, transparent 0%, rgb(var(--c-ink-100) / 0.07) 50%, transparent 100%)",
  backgroundSize: "200% 100%",
};

export function Pedaco({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`bg-base-700/70 animate-reluzir ${className}`} style={{ ...BRILHO, ...style }} />;
}

export function Esqueleto({
  linhas = 3,
  comTopo = true,
  cartoes = 0,
}: {
  linhas?: number;
  comTopo?: boolean;
  /** quantos cartõezinhos em grade (2 colunas) depois do topo */
  cartoes?: number;
}) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando">
      {comTopo && (
        <div className="rounded-3xl bg-base-800 border border-base-600 p-5 space-y-3">
          <Pedaco className="h-3.5 w-1/3 rounded" />
          <Pedaco className="h-9 w-2/3 rounded-lg" />
          <Pedaco className="h-2.5 w-full rounded-full" />
        </div>
      )}
      {cartoes > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: cartoes }, (_, i) => (
            <div key={i} className="rounded-2xl bg-base-800 border border-base-600 p-4 space-y-2">
              <Pedaco className="h-3 w-1/2 rounded" />
              <Pedaco className="h-6 w-3/4 rounded" />
            </div>
          ))}
        </div>
      )}
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl bg-base-800 border border-base-600 p-4">
          <Pedaco className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Pedaco className="h-3.5 rounded" style={{ width: `${70 - i * 12}%` }} />
            <Pedaco className="h-3 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Tela inteira carregando (no lugar de tela em branco) */
export function CarregandoTela({ linhas = 4, cartoes = 0, comTopo = true }: { linhas?: number; cartoes?: number; comTopo?: boolean }) {
  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <Pedaco className="h-8 w-40 rounded-lg mt-2 mb-6" />
      <Esqueleto linhas={linhas} cartoes={cartoes} comTopo={comTopo} />
    </main>
  );
}

/** Etapa 286 — Finanças carregando: o cartão do saldo e os blocos no formato certo */
export function EsqueletoFinancas() {
  return (
    <main className="min-h-screen p-6 md:p-12 pagina" aria-busy="true" aria-label="Carregando">
      <Pedaco className="h-8 w-36 rounded-lg mt-2 mb-6" />
      <div className="rounded-3xl border border-financa/20 bg-financa/5 p-5 mb-3">
        <Pedaco className="h-3.5 w-24 rounded mb-2" />
        <Pedaco className="h-10 w-3/5 rounded-lg mb-4" />
        <div className="flex items-center gap-4 pt-4 border-t border-base-600/60">
          <Pedaco className="w-[76px] h-[76px] rounded-full shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Pedaco className="h-3.5 w-full rounded" />
            <Pedaco className="h-3.5 w-5/6 rounded" />
            <Pedaco className="h-3.5 w-2/3 rounded" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-6">
        <Pedaco className="w-10 h-10 rounded-full" />
        <Pedaco className="h-5 w-28 rounded" />
        <Pedaco className="w-10 h-10 rounded-full" />
      </div>
      <Esqueleto linhas={3} comTopo={false} cartoes={2} />
    </main>
  );
}

/** Etapa 286 — lista de hábitos carregando: título de grupo + linhas num cartão */
export function EsqueletoHabitos({ linhas = 4 }: { linhas?: number }) {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <Pedaco className="h-4 w-24 rounded mb-2.5 ml-1" />
      <div className="rounded-2xl bg-base-800 border border-base-600 divide-y divide-base-600">
        {Array.from({ length: linhas }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <Pedaco className="w-11 h-11 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Pedaco className="h-3.5 rounded" style={{ width: `${72 - i * 10}%` }} />
              <div className="flex gap-1">
                {Array.from({ length: 7 }, (_, k) => (
                  <Pedaco key={k} className="w-2.5 h-2.5 rounded-full" />
                ))}
              </div>
            </div>
            <Pedaco className="w-11 h-11 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
