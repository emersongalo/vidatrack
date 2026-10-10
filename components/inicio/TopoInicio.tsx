"use client";

// Etapa 287 — topo do Início: saudação grande com o céu da hora do dia,
// a data, uma frase sobre o dia e três quadrinhos (hábitos, tarefas e
// quanto saiu hoje) que levam direto pra cada área.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Settings2, Check } from "lucide-react";
import { ceuDaHora } from "@/components/HeroHoje";
import { saudacao } from "@/lib/painel/seuDia";
import { topoDoInicio, lerQuadrosTopo, QUADROS_TOPO, CHAVE_QUADROS_TOPO, type QuadroTopo } from "@/lib/painel/topoInicio";
import { useContagem } from "@/components/NumeroAnimado";
import { ValorMonetario } from "@/components/ValorMonetario";

function MiniAnel({ feitos, total, classe }: { feitos: number; total: number; classe: string }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const pct = useContagem(total ? Math.min(1, feitos / total) : 0, 800);
  return (
    <svg viewBox="0 0 38 38" className="w-9 h-9 -rotate-90 shrink-0" aria-hidden>
      <circle cx="19" cy="19" r={r} fill="none" strokeWidth="5" className="stroke-base-900/40" />
      <circle cx="19" cy="19" r={r} fill="none" strokeWidth="5" strokeLinecap="round" className={classe} strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
    </svg>
  );
}

export function TopoInicio({ snapshot, hoje, nome }: { snapshot: any; hoje: string; nome: string }) {
  const hora = new Date().getHours();
  const ceu = ceuDaHora(hora);
  const t = topoDoInicio(snapshot, hoje, hora);
  const primeiro = (nome.includes("@") ? nome.split("@")[0] : nome.split(" ")[0]) || "";
  const data = new Date(hoje + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  // Etapa 288 — quais quadrinhos mostrar (salvo neste aparelho)
  const [quadros, setQuadros] = useState<QuadroTopo[]>(() => QUADROS_TOPO.map((q) => q.id));
  const [editando, setEditando] = useState(false);
  useEffect(() => {
    try {
      setQuadros(lerQuadrosTopo(localStorage.getItem(CHAVE_QUADROS_TOPO)));
    } catch {}
  }, []);
  function alternar(id: QuadroTopo) {
    setQuadros((atual) => {
      const nova = QUADROS_TOPO.map((q) => q.id).filter((x) => (x === id ? !atual.includes(x) : atual.includes(x)));
      try {
        localStorage.setItem(CHAVE_QUADROS_TOPO, JSON.stringify(nova));
      } catch {}
      return nova;
    });
  }
  const colunas = quadros.length === 1 ? "grid-cols-1" : quadros.length === 2 ? "grid-cols-2" : "grid-cols-3";
  const largo = quadros.length === 1;
  const quadro = "relative flex flex-col gap-1.5 rounded-2xl bg-base-900/35 backdrop-blur-sm px-3 py-3 min-w-0 hover:bg-base-900/50 transition";

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border p-5 mb-4 animate-surgir ${ceu.borda}`}
      style={{ background: ceu.fundo }}
    >
      <span aria-hidden className="absolute right-5 top-4 text-3xl animate-boiar pointer-events-none">
        {ceu.astro}
      </span>
      {ceu.estrelas &&
        [
          [58, 14, 0],
          [70, 34, 0.8],
          [84, 52, 1.6],
          [48, 40, 2.2],
          [92, 24, 1.1],
          [64, 58, 0.4],
        ].map(([x, y, d], i) => (
          <span
            key={i}
            aria-hidden
            className="absolute w-1 h-1 rounded-full bg-white animate-cintilar pointer-events-none"
            style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }}
          />
        ))}

      <p className="text-sm text-ink-400 capitalize">{data}</p>
      <h1 className="text-[1.9rem] leading-tight font-display font-bold mt-0.5 pr-10 break-words">
        {saudacao(hora)}
        {primeiro ? `, ${primeiro}` : ""}
      </h1>
      <p className="text-base text-ink-100/80 mt-1">{t.frase}</p>

      {quadros.length > 0 && (
        <div className={`grid ${colunas} gap-2 mt-4`}>
          {quadros.includes("habitos") && (
            <Link href="/habitos" className={`${quadro} ${largo ? "!flex-row items-center gap-3" : ""}`}>
              <MiniAnel feitos={t.habitos.feitos} total={t.habitos.total} classe="stroke-habito" />
              <span className={largo ? "flex-1" : "contents"}>
                <span className="block text-lg font-mono font-semibold leading-none">
                  {t.habitos.feitos}
                  <span className="text-ink-400 text-sm">/{t.habitos.total}</span>
                </span>
                <span className="block text-xs text-ink-400 mt-1">Hábitos de hoje</span>
              </span>
            </Link>
          )}
          {quadros.includes("tarefas") && (
            <Link href="/tarefas" className={`${quadro} ${largo ? "!flex-row items-center gap-3" : ""}`}>
              <MiniAnel feitos={t.tarefas.feitas} total={t.tarefas.total} classe="stroke-nota" />
              <span className={largo ? "flex-1" : "contents"}>
                <span className="block text-lg font-mono font-semibold leading-none">
                  {t.tarefas.feitas}
                  <span className="text-ink-400 text-sm">/{t.tarefas.total}</span>
                </span>
                <span className="block text-xs text-ink-400 mt-1">Tarefas de hoje</span>
              </span>
            </Link>
          )}
          {quadros.includes("gasto") && (
            <Link href="/financas" className={`${quadro} ${largo ? "!flex-row items-center gap-3" : ""}`}>
              <span className="w-9 h-9 rounded-full bg-financa/20 text-financa flex items-center justify-center text-lg shrink-0" aria-hidden>
                💸
              </span>
              <span className={largo ? "flex-1 min-w-0" : "contents"}>
                <span className={`block text-base font-mono font-semibold leading-none truncate ${t.gastoHoje > 0 ? "text-red-400" : ""}`}>
                  <ValorMonetario valor={t.gastoHoje} animado />
                </span>
                <span className="block text-xs text-ink-400 mt-1">Saiu hoje</span>
              </span>
            </Link>
          )}
        </div>
      )}

      {/* escolher o que aparece aqui */}
      <div className="flex justify-end mt-3">
        <button
          type="button"
          onClick={() => setEditando((v) => !v)}
          aria-expanded={editando}
          className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-100 rounded-full bg-base-900/30 px-2.5 py-1"
        >
          <Settings2 size={13} /> {editando ? "Pronto" : "O que mostrar aqui"}
        </button>
      </div>
      {editando && (
        <div className="mt-2 rounded-2xl bg-base-900/40 p-3 animate-surgir">
          <p className="text-xs text-ink-400 mb-2">Toque pra mostrar ou esconder (fica salvo neste aparelho):</p>
          <div className="flex flex-wrap gap-2">
            {QUADROS_TOPO.map((q) => {
              const ativo = quadros.includes(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => alternar(q.id)}
                  aria-pressed={ativo}
                  className={`flex items-center gap-1.5 text-sm rounded-full px-3 py-1.5 border transition ${
                    ativo ? "bg-ink-100 text-base-900 border-ink-100 font-medium" : "border-base-600 text-ink-400"
                  }`}
                >
                  {ativo ? <Check size={14} strokeWidth={3} /> : <span>{q.emoji}</span>} {q.rotulo}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
