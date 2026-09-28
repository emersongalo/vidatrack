import { describe, it, expect } from "vitest";
import { extrairDadosCupom, acharData } from "@/lib/financas/cupom";

const CUPOM = `SUPERMERCADO BOM PRECO LTDA
CNPJ 12.345.678/0001-90
RUA DAS FLORES, 100 - CENTRO
CUPOM FISCAL ELETRONICO - SAT
ARROZ 5KG            1 UN   24,90
FEIJAO 1KG           2 UN   15,98
SUBTOTAL                    40,88
DESCONTO                     0,88
TOTAL R$                    40,00
DINHEIRO                    50,00
TROCO                       10,00
Tributos aprox. Lei 12.741  5,12
15/09/2026 18:32:10`;

describe("leitura de cupom", () => {
  it("acha total, data e loja", () => {
    const r = extrairDadosCupom(CUPOM, "2026-09-27");
    expect(r.valor).toBe("40,00");
    expect(r.data).toBe("2026-09-15");
    expect(r.descricao).toBe("Supermercado Bom Preco");
  });

  it("valor com milhar e 'VALOR A PAGAR' na linha de baixo", () => {
    const r = extrairDadosCupom("LOJA X\nITEM 1.000,00\nVALOR A PAGAR\n1.234,56", "2026-09-27");
    expect(r.valor).toBe("1.234,56");
  });

  it("sem TOTAL, pega o maior valor", () => {
    const r = extrairDadosCupom("PADARIA\nPAO 3,50\nCAFE 6,00", "2026-09-27");
    expect(r.valor).toBe("6,00");
  });

  it("ignora data futura e data inválida", () => {
    expect(acharData("31/02/2026 01/12/2030 10/09/26", "2026-09-27")).toBe("2026-09-10");
  });

  it("texto vazio não quebra", () => {
    expect(extrairDadosCupom("", "2026-09-27")).toEqual({ valor: null, data: null, descricao: null });
  });
});
