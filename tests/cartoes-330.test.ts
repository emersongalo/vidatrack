import { describe, it, expect } from "vitest";
import { parcelamentosAtivos } from "@/lib/financas/cartoesAba";

describe("Etapa 330 — parcelamentos na aba Cartões", () => {
  const hoje = "2026-10-18";
  const parcela = (n: number, data: string) => ({ data, valor: 100, descricao: `Geladeira (${n}/18)`, parcela_grupo: "g1", parcela_numero: n, parcela_total: 18 });
  const meses = Array.from({ length: 18 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 7 + i, 10));
    return d.toISOString().slice(0, 10);
  });

  it("conta quantas já passaram, quanto falta e quando termina", () => {
    const l = parcelamentosAtivos(meses.map((d, i) => parcela(i + 1, d)), hoje);
    expect(l).toHaveLength(1);
    expect(l[0].descricao).toBe("Geladeira");
    expect(l[0].total).toBe(18);
    expect(l[0].pagas).toBe(3); // ago, set, out
    expect(l[0].falta).toBe(1500);
    expect(l[0].ultima).toBe(meses[17]);
  });

  it("parcelamento que já acabou não aparece", () => {
    expect(parcelamentosAtivos([parcela(1, "2025-01-10"), parcela(2, "2025-02-10")], hoje)).toEqual([]);
  });
});
