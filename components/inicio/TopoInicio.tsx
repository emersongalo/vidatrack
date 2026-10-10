"use client";

// Etapa 287 — topo do Início: saudação grande com o céu da hora do dia,
// a data, uma frase sobre o dia e três quadrinhos (hábitos, tarefas e
// quanto saiu hoje) que levam direto pra cada área.
import Link from "next/link";
import { ceuDaHora } from "@/components/HeroHoje";
import { saudacao } from "@/lib/painel/seuDia";
import { topoDoInicio } from "@/lib/painel/topoInicio";
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

      <div className="grid grid-cols-3 gap-2 mt-4">
        <Link href="/habitos" className={quadro}>
          <MiniAnel feitos={t.habitos.feitos} total={t.habitos.total} classe="stroke-habito" />
          <span className="text-lg font-mono font-semibold leading-none">
            {t.habitos.feitos}
            <span className="text-ink-400 text-sm">/{t.habitos.total}</span>
          </span>
          <span className="text-xs text-ink-400">Hábitos</span>
        </Link>
        <Link href="/tarefas" className={quadro}>
          <MiniAnel feitos={t.tarefas.feitas} total={t.tarefas.total} classe="stroke-nota" />
          <span className="text-lg font-mono font-semibold leading-none">
            {t.tarefas.feitas}
            <span className="text-ink-400 text-sm">/{t.tarefas.total}</span>
          </span>
          <span className="text-xs text-ink-400">Tarefas</span>
        </Link>
        <Link href="/financas" className={quadro}>
          <span className="w-9 h-9 rounded-full bg-financa/20 text-financa flex items-center justify-center text-lg shrink-0" aria-hidden>
            💸
          </span>
          <span className={`text-base font-mono font-semibold leading-none truncate ${t.gastoHoje > 0 ? "text-red-400" : ""}`}>
            <ValorMonetario valor={t.gastoHoje} animado />
          </span>
          <span className="text-xs text-ink-400">Saiu hoje</span>
        </Link>
      </div>
    </section>
  );
}
