// O servidor (Vercel) roda em UTC, mas os horários que a pessoa digita
// no app (lembrete de hábito, resumo diário, etc.) são no horário dela.
// Como o VidaTrack hoje não pergunta o fuso do usuário, assumimos
// horário de Brasília (UTC-3, sem horário de verão desde 2019) como
// padrão — dá pra trocar via variável de ambiente se precisar.
//
// Cuidado real que já pegou a gente: `?? "-3"` só cai no padrão se a
// variável for null/undefined — se ela existir no Vercel mas estiver
// EM BRANCO (texto vazio), `Number("")` vira 0, não -3, e o servidor
// passa a achar que está em UTC puro (3h adiantado do Brasil de
// verdade). Por isso a checagem agora é mais cuidadosa: só usa o
// valor da variável se ele for um número válido de verdade.
const bruto = process.env.TIMEZONE_OFFSET_HORAS;
const OFFSET_HORAS = bruto && !Number.isNaN(Number(bruto)) ? Number(bruto) : -3;

function agoraNoFuso(): Date {
  return new Date(Date.now() + OFFSET_HORAS * 60 * 60 * 1000);
}

export function horaAtualNoFuso(): string {
  const d = agoraNoFuso();
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export function dataAtualNoFuso(): string {
  return agoraNoFuso().toISOString().slice(0, 10);
}

export function horaMinutosAtrasNoFuso(minutos: number): string {
  const d = new Date(agoraNoFuso().getTime() - minutos * 60 * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
