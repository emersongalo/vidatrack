// Etapa 282 — hábito com timer: se a unidade é minuto ("min", "minutos"),
// dá pra cronometrar direto e os minutos entram sozinhos no contador.
// A contagem usa a hora de início, então continua certa se sair da tela.
export const CHAVE_TIMER_HABITO = "vt-timer-habito";

export function ehUnidadeDeMinuto(unidade: string | null | undefined): boolean {
  if (!unidade) return false;
  return /^(min|mins|min\.|minuto|minutos)$/i.test(unidade.trim());
}

export type TimerSalvo = {
  habitoId: string;
  data: string;
  /** quando começou a contar (ms) — null quando pausado */
  desde: number | null;
  /** segundos já contados antes da última retomada */
  acumulado: number;
};

export function segundosContados(t: TimerSalvo, agora: number): number {
  return t.acumulado + (t.desde ? Math.max(0, Math.floor((agora - t.desde) / 1000)) : 0);
}

/** Minutos inteiros que entram no hábito (arredonda pra baixo, mín. 0). */
export function minutosParaLancar(segundos: number): number {
  return Math.max(0, Math.floor(segundos / 60));
}

export function lerTimer(habitoId?: string): TimerSalvo | null {
  try {
    const t = JSON.parse(localStorage.getItem(CHAVE_TIMER_HABITO) ?? "null") as TimerSalvo | null;
    if (!t) return null;
    return habitoId && t.habitoId !== habitoId ? null : t;
  } catch {
    return null;
  }
}

export function gravarTimer(t: TimerSalvo | null) {
  try {
    if (t) localStorage.setItem(CHAVE_TIMER_HABITO, JSON.stringify(t));
    else localStorage.removeItem(CHAVE_TIMER_HABITO);
  } catch {
    /* sem armazenamento */
  }
}
