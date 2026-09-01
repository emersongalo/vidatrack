export const HORA_INICIO_GRADE = 5; // 05:00
export const HORA_FIM_GRADE = 24; // 24:00 (meia-noite)
export const PX_POR_MINUTO = 1.3;
export const ALTURA_TOTAL_GRADE = (HORA_FIM_GRADE - HORA_INICIO_GRADE) * 60 * PX_POR_MINUTO;

export function horaParaMinutosDoDia(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function minutosParaHora(minutos: number): string {
  const m = Math.max(0, Math.min(24 * 60, minutos));
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function minutosDoDiaParaY(minutosDoDia: number): number {
  return (minutosDoDia - HORA_INICIO_GRADE * 60) * PX_POR_MINUTO;
}

export function yParaMinutosDoDia(y: number): number {
  return y / PX_POR_MINUTO + HORA_INICIO_GRADE * 60;
}

/** Arredonda para o múltiplo de 15 minutos mais próximo */
export function arredondarPara15Min(minutos: number): number {
  return Math.round(minutos / 15) * 15;
}

export function horarioAtualEmMinutos(): number {
  const agora = new Date();
  return agora.getHours() * 60 + agora.getMinutes();
}

export function formatarFaixaHorario(inicio: string, fim: string): string {
  return `${inicio.slice(0, 5)} – ${fim.slice(0, 5)}`;
}
