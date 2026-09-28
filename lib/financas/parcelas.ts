/**
 * Etapa 210/214 — regras puras de parcelamento (sem banco), separadas
 * pra poderem ser testadas automaticamente (tests/regras-financas.test.ts).
 */

/** Mesmo dia N meses depois (dia 31 vira o último dia do mês, se precisar). */
export function somarMesesISO(iso: string, meses: number) {
  const [a, m, d] = iso.split("-").map(Number);
  const ultimo = new Date(a, m - 1 + meses + 1, 0).getDate();
  const data = new Date(a, m - 1 + meses, Math.min(d, ultimo));
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

/**
 * Divide um valor em N parcelas iguais, em centavos. A última parcela
 * absorve a sobra da divisão (R$ 100 em 3× = 33,33 + 33,33 + 33,34).
 * `modo`: "total" = o valor é o total da compra; "parcela" = o valor é
 * de cada parcela.
 */
export function dividirParcelas(valor: number, n: number, modo: "total" | "parcela"): number[] {
  const parcelas = Math.max(2, Math.min(48, Math.round(n) || 2));
  const centavos = Math.round(valor * 100);
  const total = modo === "parcela" ? centavos * parcelas : centavos;
  const base = Math.floor(total / parcelas);
  return Array.from({ length: parcelas }, (_, i) => (i === parcelas - 1 ? total - base * (parcelas - 1) : base) / 100);
}
