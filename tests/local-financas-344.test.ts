import { describe, it, expect } from "vitest";
import { valorParaNumero, ehLancamentoSimples } from "@/lib/local/financas";

describe("Etapa 344 — finanças no aparelho", () => {
  it("lê o valor do jeito que o campo manda", () => {
    expect(valorParaNumero("1.234,56")).toBe(1234.56);
    expect(valorParaNumero("45,90")).toBe(45.9);
    expect(valorParaNumero("12.5")).toBe(12.5);
    expect(valorParaNumero(30)).toBe(30);
    expect(valorParaNumero("")).toBe(0);
  });
  it("só lançamento simples é editado no aparelho", () => {
    expect(ehLancamentoSimples({})).toBe(true);
    expect(ehLancamentoSimples({ parcela_grupo: "x" })).toBe(false);
    expect(ehLancamentoSimples({ recorrencia_id: "x" })).toBe(false);
    expect(ehLancamentoSimples({ transferencia_grupo: "x" })).toBe(false);
  });
});
