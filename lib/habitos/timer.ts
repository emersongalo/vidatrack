// Etapa 237 — timer de foco: a contagem é calculada pela HORA DE TÉRMINO
// (não por "tique" a cada segundo), então continua certa se a pessoa
// sair da tela, trocar de app ou bloquear o celular.

export type Fase = "foco" | "pausa" | "pausaLonga";

export type TimerSalvo = {
  modo: "pomodoro" | "livre";
  fase: Fase;
  /** duração total da fase atual, em segundos */
  total: number;
  /** quando termina (ms desde 1970) — null se pausado/parado */
  fimEm: number | null;
  /** segundos que faltavam quando pausou (null se rodando ou parado no início) */
  restantePausado: number | null;
  /** quantos focos já foram completados neste ciclo (pomodoro) */
  ciclo: number;
  habitoId: string | null;
};

export const POMODORO = { foco: 25, pausa: 5, pausaLonga: 15, focosAteLonga: 4 };

export function timerInicial(modo: "pomodoro" | "livre", minutos = 25): TimerSalvo {
  return {
    modo,
    fase: "foco",
    total: (modo === "pomodoro" ? POMODORO.foco : minutos) * 60,
    fimEm: null,
    restantePausado: null,
    ciclo: 0,
    habitoId: null,
  };
}

/** Segundos que faltam agora */
export function restante(t: TimerSalvo, agora: number): number {
  if (t.fimEm !== null) return Math.max(0, Math.ceil((t.fimEm - agora) / 1000));
  if (t.restantePausado !== null) return t.restantePausado;
  return t.total;
}

export function rodando(t: TimerSalvo): boolean {
  return t.fimEm !== null;
}

export function iniciar(t: TimerSalvo, agora: number): TimerSalvo {
  const r = restante(t, agora);
  return { ...t, fimEm: agora + r * 1000, restantePausado: null };
}

export function pausar(t: TimerSalvo, agora: number): TimerSalvo {
  return { ...t, restantePausado: restante(t, agora), fimEm: null };
}

/** Depois que uma fase termina: qual vem em seguida (pomodoro alterna foco/pausa) */
export function proximaFase(t: TimerSalvo, minutosLivre = 25): TimerSalvo {
  if (t.modo === "livre") return { ...t, fase: "foco", total: minutosLivre * 60, fimEm: null, restantePausado: null };
  if (t.fase === "foco") {
    const ciclo = t.ciclo + 1;
    const longa = ciclo % POMODORO.focosAteLonga === 0;
    return {
      ...t,
      ciclo,
      fase: longa ? "pausaLonga" : "pausa",
      total: (longa ? POMODORO.pausaLonga : POMODORO.pausa) * 60,
      fimEm: null,
      restantePausado: null,
    };
  }
  return { ...t, fase: "foco", total: POMODORO.foco * 60, fimEm: null, restantePausado: null };
}

/** "25:00" / "1:05:00" */
export function formatarTempo(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export type Sessao = { dia: string; minutos: number; habito: string | null };

/** Soma os minutos de foco por dia (últimos 7, do mais antigo pra hoje) */
export function focoDaSemana(sessoes: Sessao[], hoje: string): { dia: string; minutos: number }[] {
  const soma = new Map<string, number>();
  for (const s of sessoes) soma.set(s.dia, (soma.get(s.dia) ?? 0) + s.minutos);
  return Array.from({ length: 7 }, (_, i) => {
    const [a, m, d] = hoje.split("-").map(Number);
    const dia = new Date(Date.UTC(a, m - 1, d - 6 + i)).toISOString().slice(0, 10);
    return { dia, minutos: soma.get(dia) ?? 0 };
  });
}

/** Lê o que ficou salvo no aparelho; lixo vira null */
export function lerTimer(bruto: string | null): TimerSalvo | null {
  if (!bruto) return null;
  try {
    const t = JSON.parse(bruto);
    if (!t || (t.modo !== "pomodoro" && t.modo !== "livre") || typeof t.total !== "number") return null;
    return {
      modo: t.modo,
      fase: t.fase === "pausa" || t.fase === "pausaLonga" ? t.fase : "foco",
      total: t.total,
      fimEm: typeof t.fimEm === "number" ? t.fimEm : null,
      restantePausado: typeof t.restantePausado === "number" ? t.restantePausado : null,
      ciclo: Number(t.ciclo) || 0,
      habitoId: typeof t.habitoId === "string" ? t.habitoId : null,
    };
  } catch {
    return null;
  }
}
