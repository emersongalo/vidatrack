"use client";

// Etapa 249 — "em que horário você mais faz esse hábito": barrinhas por
// faixa do dia, a partir da hora em que você marcou.
import { horarioDoHabito } from "@/lib/habitos/horario";

export function MelhorHorario({ habitoId, checkins, hex, lembrete }: { habitoId: string; checkins: any[]; hex: string; lembrete?: string | null }) {
  const h = horarioDoHabito(habitoId, checkins);
  if (h.total < 3 || !h.melhor) return null;
  const max = Math.max(...h.faixas.map((f) => f.vezes), 1);

  return (
    <div className="bg-base-800 border border-base-600 rounded-3xl p-5 mb-6">
      <h2 className="text-xl font-semibold">Seu melhor horário</h2>
      <p className="text-sm text-ink-400 mt-1">
        {h.melhor.emoji} Você costuma fazer de <span className="text-ink-100 font-medium">{h.melhor.nome.toLowerCase()}</span> ({h.melhor.pct}% das vezes)
        {h.horaTipica ? `, por volta das ${h.horaTipica}` : ""}.
      </p>
      <div className="flex items-end gap-2 h-28 mt-4">
        {h.faixas.map((f) => (
          <div key={f.id} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
            <span className="text-xs text-ink-400 mb-1">{f.vezes || ""}</span>
            <div
              className="w-full rounded-t-lg transition-all duration-700"
              style={{ height: `${Math.max(4, (f.vezes / max) * 100)}%`, background: f.vezes ? hex : "rgb(var(--c-ink-400) / 0.15)", opacity: f.vezes === max ? 1 : 0.55 }}
            />
            <span className="text-base mt-1" title={f.nome}>
              {f.emoji}
            </span>
          </div>
        ))}
      </div>
      {lembrete && h.horaTipica && Math.abs(minutos(lembrete) - minutos(h.horaTipica)) >= 60 && (
        <p className="text-xs text-ink-400 mt-3">
          ⏰ Seu lembrete está às {lembrete.slice(0, 5)}. Que tal mudar pra um pouco antes das {h.horaTipica}? Dá pra ajustar em Editar.
        </p>
      )}
    </div>
  );
}

function minutos(h: string) {
  const [a, b] = h.slice(0, 5).split(":").map(Number);
  return a * 60 + b;
}
