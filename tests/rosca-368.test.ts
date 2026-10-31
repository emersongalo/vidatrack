import { describe, expect, it } from "vitest";
import { agruparFatias, calcularFatias, pontoNoAnel } from "@/lib/financas/rosca";

describe("Etapa 368 — rosca de categorias", () => {
  it("fatias somam a volta inteira, na ordem", () => {
    const f = calcularFatias([{ nome: "a", valor: 300 }, { nome: "b", valor: 100 }]);
    expect(f[0].fracao).toBeCloseTo(0.75);
    expect(f[1].inicio).toBeCloseTo(0.75);
    expect(f[1].fracao).toBeCloseTo(0.25);
  });
  it("junta as menores em Outras", () => {
    const dados = Array.from({ length: 9 }, (_, i) => ({ nome: `c${i}`, valor: 100 - i }));
    const g = agruparFatias(dados, 6);
    expect(g).toHaveLength(6);
    expect(g[5].nome).toBe("Outras");
    expect(g[5].valor).toBe(95 + 94 + 93 + 92);
  });
  it("ignora valores zerados e total zero", () => {
    expect(calcularFatias([{ nome: "a", valor: 0 }])).toEqual([]);
    expect(agruparFatias([{ nome: "a", valor: 0 }, { nome: "b", valor: 5 }])).toHaveLength(1);
  });
  it("ponto no topo e à direita", () => {
    expect(pontoNoAnel(0, 1)).toEqual({ x: 50, y: 0 });
    const d = pontoNoAnel(Math.PI / 2, 1);
    expect(d.x).toBeCloseTo(100);
    expect(d.y).toBeCloseTo(50);
  });
});
