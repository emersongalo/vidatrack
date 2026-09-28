// Etapa 216 — vários lembretes por hábito

const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Limpa, ordena e tira repetidos ("8:00" → "08:00"); no máximo 24. */
export function normalizarHorarios(lista: (string | null | undefined)[]): string[] {
  const saida = new Set<string>();
  for (const bruto of lista) {
    if (!bruto) continue;
    const m = String(bruto).trim().match(/^(\d{1,2}):(\d{2})/);
    if (!m) continue;
    const h = `${m[1].padStart(2, "0")}:${m[2]}`;
    if (RE_HORA.test(h)) saida.add(h);
  }
  return [...saida].sort().slice(0, 24);
}

/** "A cada X horas, das HH:MM às HH:MM" → lista de horários. */
export function gerarHorariosIntervalo(inicio: string, fim: string, intervaloHoras: number): string[] {
  const paraMin = (h: string) => {
    const [a, b] = h.split(":").map(Number);
    return a * 60 + b;
  };
  if (!RE_HORA.test(inicio) || !RE_HORA.test(fim)) return [];
  const passo = Math.round(Math.max(0.5, Math.min(12, intervaloHoras)) * 60);
  const lista: string[] = [];
  for (let m = paraMin(inicio); m <= paraMin(fim) && lista.length < 24; m += passo) {
    lista.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return lista;
}

/** Horários de um hábito vindos do banco (lista nova ou o horário único antigo). */
export function horariosDoHabito(h: { horario_lembrete?: string | null; horarios_lembrete?: string[] | null }): string[] {
  if (h.horarios_lembrete && h.horarios_lembrete.length) return normalizarHorarios(h.horarios_lembrete);
  return normalizarHorarios([h.horario_lembrete]);
}
