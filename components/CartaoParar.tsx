"use client";

// Etapa 249 — hábito de "parar": contador grande de dias limpos,
// quanto já economizou e a trilha de marcos (1 dia, 3, 7, 2 semanas…).
import { PiggyBank, ShieldCheck } from "lucide-react";
import { ValorMonetario } from "@/components/ValorMonetario";
import { MARCOS_PARAR, nomeDoMarco, resumoParar } from "@/lib/habitos/parar";

function ddmm(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

export function CartaoParar({ habito, checkins, hoje, hex }: { habito: any; checkins: any[]; hoje: string; hex: string }) {
  const r = resumoParar(habito, checkins, hoje);
  const raio = 52;
  const volta = 2 * Math.PI * raio;

  return (
    <div className="bg-base-800 border border-base-600 rounded-3xl p-5 mb-6 overflow-hidden relative">
      <span aria-hidden className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: hex }} />

      <div className="relative flex items-center gap-5">
        <div className="relative w-32 h-32 shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r={raio} fill="none" stroke="rgb(var(--c-ink-400) / 0.15)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r={raio}
              fill="none"
              stroke={hex}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={volta}
              strokeDashoffset={volta * (1 - r.pctMarco / 100)}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-display font-bold leading-none">{r.diasLimpo}</span>
            <span className="text-xs text-ink-400 mt-1">{r.diasLimpo === 1 ? "dia limpo" : "dias limpos"}</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-base font-semibold">
            <ShieldCheck size={18} style={{ color: hex }} /> Firme desde {ddmm(r.desde)}
          </p>
          {r.proximoMarco ? (
            <p className="text-sm text-ink-400 mt-1">
              Faltam <span className="text-ink-100 font-medium">{r.faltaProMarco} {r.faltaProMarco === 1 ? "dia" : "dias"}</span> pra{" "}
              {nomeDoMarco(r.proximoMarco)} 🎯
            </p>
          ) : (
            <p className="text-sm text-ink-400 mt-1">Você passou de todos os marcos. Lenda! 🏆</p>
          )}
          <p className="text-sm text-ink-400 mt-1">🏆 Recorde: {r.recorde} {r.recorde === 1 ? "dia" : "dias"}</p>
          {r.escorregoes30 > 0 && (
            <p className="text-xs text-ink-400 mt-1">
              {r.escorregoes30} {r.escorregoes30 === 1 ? "escorregão" : "escorregões"} nos últimos 30 dias — faz parte, segue o jogo.
            </p>
          )}
        </div>
      </div>

      {r.economizado !== null ? (
        <div className="relative mt-5 flex items-center gap-3 bg-habito/10 border border-habito/30 rounded-2xl p-3">
          <span className="w-10 h-10 rounded-xl bg-habito/20 text-habito flex items-center justify-center shrink-0">
            <PiggyBank size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-ink-400">Dinheiro que ficou no bolso</p>
            <p className="text-xl font-display font-bold text-habito font-mono">
              <ValorMonetario valor={r.economizado} />
            </p>
            {r.economizadoTotal !== null && r.economizadoTotal > r.economizado && (
              <p className="text-xs text-ink-400">
                <ValorMonetario valor={r.economizadoTotal} /> desde que você começou
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="relative text-xs text-ink-400 mt-4">💡 Em Editar, diga quanto você gastava por dia com isso e veja quanto já economizou.</p>
      )}

      {/* trilha de marcos */}
      <div className="relative flex gap-1.5 mt-5 overflow-x-auto pb-1">
        {MARCOS_PARAR.slice(0, 9).map((m) => {
          const ok = r.diasLimpo >= m;
          return (
            <span
              key={m}
              className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${ok ? "font-semibold text-base-900" : "border-base-600 text-ink-400"}`}
              style={ok ? { background: hex, borderColor: hex } : undefined}
            >
              {ok ? "✓ " : ""}
              {nomeDoMarco(m)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
