// Etapa 311 — onde cada monumento das conquistas fica na ilha do Mundo
// (x, y, largura, fundo na grade 12×12; o navio fica na água).
import type { Conquista } from "@/lib/mascote/conquistas";

export type EstadoMonumento = "travado" | "pronto" | "feito";

export const MONUMENTOS_NA_ILHA: Record<string, [number, number, number, number]> = {
  h1: [0, 3, 1, 1],
  h50: [8, 0, 1, 1],
  h200: [0, 7, 1, 1],
  h500: [10, 1, 1, 1],
  h1000: [10, 10, 2, 2],
  s7: [5, 8, 1, 1],
  s30: [7, 8, 1, 1],
  s100: [11, 6, 1, 1],
  f1: [1, 8, 1, 1],
  f3: [4, 7, 1, 1],
  f5: [6, 7, 1, 1],
  c3: [1, 10, 1, 1],
  c10: [5, 10, 1, 1],
  cv: [5, 0, 1, 1],
  m10: [0, 11, 1, 1],
  m50: [7, 11, 1, 1],
  b1: [11, 0, 1, 1],
  b5: [5, 13, 2, 1],
  d1: [8, 7, 1, 1],
  d2: [10, 7, 1, 1],
};

/** feito = resgatada (aparece na ilha); pronto = alcançada, falta resgatar. */
export function estadosDosMonumentos(lista: Conquista[]): Record<string, EstadoMonumento> {
  const r: Record<string, EstadoMonumento> = {};
  for (const c of lista) r[c.id] = c.resgatada ? "feito" : c.alcancada ? "pronto" : "travado";
  return r;
}
