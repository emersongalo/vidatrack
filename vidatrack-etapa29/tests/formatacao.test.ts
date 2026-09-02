import { describe, it, expect } from "vitest";
import { formatarMoeda } from "@/lib/financas/formatacao";

describe("formatarMoeda", () => {
  it("formata valores positivos em Real", () => {
    expect(formatarMoeda(1500)).toBe("R$\u00A01.500,00");
  });

  it("formata zero corretamente", () => {
    expect(formatarMoeda(0)).toBe("R$\u00A00,00");
  });

  it("formata valores negativos", () => {
    expect(formatarMoeda(-42.5)).toBe("-R$\u00A042,50");
  });
});
