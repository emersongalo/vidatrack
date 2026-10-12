// Etapa 311 — contas do zoom (separadas pra testar): escala s e
// deslocamento x/y de um conteúdo do mesmo tamanho da caixa.
export type Vista = { s: number; x: number; y: number };

/** Mantém a escala entre 1 e max e não deixa sobrar borda vazia. */
export function limitarZoom(v: Vista, w: number, h: number, max = 3.5): Vista {
  const s = Math.min(max, Math.max(1, v.s));
  const x = Math.min(0, Math.max(w - w * s, v.x));
  const y = Math.min(0, Math.max(h - h * s, v.y));
  return { s, x: Object.is(x, -0) ? 0 : x, y: Object.is(y, -0) ? 0 : y };
}

/** Muda a escala mantendo parado o ponto (px, py) da tela. */
export function zoomNoPonto(v: Vista, novoS: number, px: number, py: number): Vista {
  const k = novoS / v.s;
  return { s: novoS, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
}
