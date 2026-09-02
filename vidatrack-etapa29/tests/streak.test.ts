import { describe, it, expect } from "vitest";
import { calcularStreak, ultimosDias } from "@/lib/habitos/streak";

describe("calcularStreak", () => {
  it("retorna 0 quando não há check-ins", () => {
    expect(calcularStreak([])).toBe(0);
  });

  it("conta dias consecutivos terminando hoje", () => {
    const hoje = new Date().toLocaleDateString("sv-SE");
    const ontem = new Date(Date.now() - 86400000).toLocaleDateString("sv-SE");
    const anteontem = new Date(Date.now() - 2 * 86400000).toLocaleDateString("sv-SE");

    expect(calcularStreak([hoje, ontem, anteontem])).toBe(3);
  });

  it("não quebra o streak se hoje ainda não foi marcado, mas ontem sim", () => {
    const ontem = new Date(Date.now() - 86400000).toLocaleDateString("sv-SE");
    const anteontem = new Date(Date.now() - 2 * 86400000).toLocaleDateString("sv-SE");

    expect(calcularStreak([ontem, anteontem])).toBe(2);
  });

  it("quebra o streak se faltar um dia no meio", () => {
    const hoje = new Date().toLocaleDateString("sv-SE");
    const tresAtras = new Date(Date.now() - 3 * 86400000).toLocaleDateString("sv-SE");

    expect(calcularStreak([hoje, tresAtras])).toBe(1);
  });
});

describe("ultimosDias", () => {
  it("retorna a quantidade de dias pedida", () => {
    expect(ultimosDias([], 7)).toHaveLength(7);
  });

  it("marca corretamente os dias com check-in", () => {
    const hoje = new Date().toLocaleDateString("sv-SE");
    const dias = ultimosDias([hoje], 7);
    const diaDeHoje = dias[dias.length - 1];

    expect(diaDeHoje.data).toBe(hoje);
    expect(diaDeHoje.feito).toBe(true);
  });
});
