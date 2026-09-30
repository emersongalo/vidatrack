// Etapa 236 — período do dia pra cena do "Juntos" (céu muda com a hora)
export type PeriodoDoDia = "madrugada" | "amanhecer" | "dia" | "entardecer" | "noite";

export function periodoDoDia(hora: number): PeriodoDoDia {
  if (hora < 5) return "madrugada";
  if (hora < 7) return "amanhecer";
  if (hora < 17) return "dia";
  if (hora < 19) return "entardecer";
  return "noite";
}

export const ROTULO_PERIODO: Record<PeriodoDoDia, string> = {
  madrugada: "🌌 Madrugada",
  amanhecer: "🌅 Amanhecendo",
  dia: "☀️ Dia",
  entardecer: "🌇 Fim de tarde",
  noite: "🌙 Noite",
};

/** "1 dia junto" / "3 dias juntos" */
export function diasJuntosTexto(n: number): string {
  return n === 1 ? "1 dia junto" : `${n} dias juntos`;
}
