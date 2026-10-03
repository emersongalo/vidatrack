// Etapa 247 — vibração curtinha (Android/Chrome; no iPhone o navegador ignora)
export function vibrar(padrao: number | number[] = 15) {
  try {
    if (typeof navigator !== "undefined") (navigator as any).vibrate?.(padrao);
  } catch {
    /* sem vibração */
  }
}
