// Etapa 326 — baú da ilha: 1 vez por dia, depois de fazer pelo menos um
// hábito. Dá 5 moedas + 2 por hábito feito hoje (até 15).
import type { DadosMascote } from "@/lib/mascote/mascote";

export const BAU_MAX = 15;

export function moedasDoBau(feitosHoje: number) {
  return Math.min(BAU_MAX, 5 + Math.max(0, Math.min(5, feitosHoje)) * 2);
}

export function bauAberto(m: DadosMascote | null, hoje: string) {
  return m?.bauIlha === hoje;
}

export function abrirBauIlha(m: DadosMascote, feitosHoje: number, hoje: string): { ok: true; mascote: DadosMascote; moedas: number } | { ok: false; motivo: "ja" | "sem-habito" } {
  if (bauAberto(m, hoje)) return { ok: false, motivo: "ja" };
  if (feitosHoje < 1) return { ok: false, motivo: "sem-habito" };
  const moedas = moedasDoBau(feitosHoje);
  return { ok: true, moedas, mascote: { ...m, bauIlha: hoje, bonus: (m.bonus ?? 0) + moedas } };
}
