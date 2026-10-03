// Etapa 249 — em que horário você costuma fazer cada hábito (pela hora
// em que marcou, no próprio dia), em faixas do dia.
const FUSO = "America/Sao_Paulo";

export const FAIXAS = [
  { id: "madrugada", nome: "Madrugada", emoji: "🌙", de: 0, ate: 5 },
  { id: "cedo", nome: "Cedinho", emoji: "🌅", de: 5, ate: 8 },
  { id: "manha", nome: "Manhã", emoji: "☀️", de: 8, ate: 12 },
  { id: "tarde", nome: "Tarde", emoji: "🌤️", de: 12, ate: 18 },
  { id: "noite", nome: "Noite", emoji: "🌆", de: 18, ate: 22 },
  { id: "tardeNoite", nome: "Tarde da noite", emoji: "🌌", de: 22, ate: 24 },
] as const;

function horaLocal(iso: string): { data: string; hora: number; minuto: number } | null {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const v = (t: string) => p.find((x) => x.type === t)?.value ?? "00";
  return { data: `${v("year")}-${v("month")}-${v("day")}`, hora: Number(v("hour")), minuto: Number(v("minute")) };
}

function paraHora(min: number) {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export type HorarioHabito = {
  total: number;
  faixas: { id: string; nome: string; emoji: string; vezes: number; pct: number }[];
  melhor: { nome: string; emoji: string; pct: number } | null;
  /** hora típica "07:40" (mediana) */
  horaTipica: string | null;
};

export function horarioDoHabito(habitoId: string, checkins: { habito_id: string; data: string; criado_em?: string | null }[]): HorarioHabito {
  const minutos: number[] = [];
  const vezes = new Map<string, number>();
  for (const c of checkins) {
    if (c.habito_id !== habitoId || !c.criado_em) continue;
    const h = horaLocal(c.criado_em);
    if (!h || h.data !== c.data) continue; // marcou outro dia: não diz nada do horário
    minutos.push(h.hora * 60 + h.minuto);
    const f = FAIXAS.find((x) => h.hora >= x.de && h.hora < x.ate)!;
    vezes.set(f.id, (vezes.get(f.id) ?? 0) + 1);
  }
  const total = minutos.length;
  const faixas = FAIXAS.map((f) => {
    const n = vezes.get(f.id) ?? 0;
    return { id: f.id, nome: f.nome, emoji: f.emoji, vezes: n, pct: total ? Math.round((n / total) * 100) : 0 };
  });
  const top = [...faixas].sort((a, b) => b.vezes - a.vezes)[0];
  minutos.sort((a, b) => a - b);
  const med = total ? minutos[Math.floor(total / 2)] : null;
  return {
    total,
    faixas,
    melhor: total >= 3 && top.vezes > 0 ? { nome: top.nome, emoji: top.emoji, pct: top.pct } : null,
    horaTipica: med === null ? null : paraHora(Math.round(med / 5) * 5),
  };
}
