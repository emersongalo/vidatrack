import { describe, it, expect } from "vitest";
import { formatarValorDigitado } from "@/components/CampoValorMonetario";

// Etapa 336 — a frase "5× de R$ X" lia o campo no meio da digitação
const lerNumero = (formatado: string) => Number(formatado.replace(/\./g, "").replace(",", ".")) || 0;

describe("Etapa 336 — valor das parcelas", () => {
  it("o que está no campo ao digitar o último 0 vira 130,00 (não 13)", () => {
    expect(formatarValorDigitado("13,000")).toBe("130,00");
    expect(lerNumero(formatarValorDigitado("13,000")) * 5).toBe(650);
  });
  it("valor inicial da edição (130.5) vira 130,50", () => {
    expect(lerNumero(formatarValorDigitado((130.5).toFixed(2).replace(".", "")))).toBe(130.5);
  });
  it("milhar continua certo", () => {
    expect(lerNumero(formatarValorDigitado("1.300,000"))).toBe(13000);
  });
});
