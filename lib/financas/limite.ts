// Etapa 230 — limite do cartão de crédito ("5.000,00" → 5000). Vazio = sem limite.
export function lerLimite(bruto: FormDataEntryValue | null | undefined): number | null {
  const s = String(bruto ?? "").replace(/[R$\s]/g, "");
  if (!s) return null;
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

/** Uso do limite: quanto está usado, quanto sobra e a %. */
export function usoDoLimite(devendo: number, limite: number | null | undefined) {
  if (!limite || limite <= 0) return null;
  const usado = Math.max(0, devendo);
  return {
    usado,
    disponivel: Math.max(0, Math.round((limite - usado) * 100) / 100),
    pct: Math.min(100, Math.round((usado / limite) * 100)),
  };
}
