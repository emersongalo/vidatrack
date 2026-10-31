// Etapa 368 — geometria da rosca de categorias (função pura, testada).
export type FatiaEntrada = { nome: string; valor: number };
export type Fatia<T extends FatiaEntrada = FatiaEntrada> = {
  item: T;
  indice: number;
  /** começo e tamanho em frações da volta (0..1) */
  inicio: number;
  fracao: number;
  /** ângulo do meio da fatia, em radianos (0 = topo, sentido horário) */
  meio: number;
};

/** Junta as menores em "Outras" quando passa de `maximo` fatias. */
export function agruparFatias<T extends FatiaEntrada>(dados: T[], maximo = 6): (T | FatiaEntrada)[] {
  const ordenados = [...dados].filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor);
  if (ordenados.length <= maximo) return ordenados;
  const principais = ordenados.slice(0, maximo - 1);
  const resto = ordenados.slice(maximo - 1).reduce((s, d) => s + d.valor, 0);
  return [...principais, { nome: "Outras", valor: resto }];
}

export function calcularFatias<T extends FatiaEntrada>(dados: T[]): Fatia<T>[] {
  const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0);
  if (total <= 0) return [];
  let acumulado = 0;
  return dados.map((item, indice) => {
    const fracao = Math.max(0, item.valor) / total;
    const inicio = acumulado;
    acumulado += fracao;
    return { item, indice, inicio, fracao, meio: (inicio + fracao / 2) * Math.PI * 2 };
  });
}

/** posição (em % do quadrado) de um ponto no anel, pra pôr o ícone */
export function pontoNoAnel(angulo: number, raioFracao: number) {
  return { x: 50 + Math.sin(angulo) * raioFracao * 50, y: 50 - Math.cos(angulo) * raioFracao * 50 };
}
