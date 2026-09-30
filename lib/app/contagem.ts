// Etapa 230 — números que "contam" até o valor novo (saldo, %, sequência)
/** curva que começa rápido e freia no fim */
export function suavizar(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 3);
}

/** valor no instante `decorrido` (ms) indo de `de` até `para` em `duracao` ms */
export function valorNaContagem(de: number, para: number, decorrido: number, duracao = 600): number {
  if (duracao <= 0 || decorrido >= duracao) return para;
  return de + (para - de) * suavizar(decorrido / duracao);
}
