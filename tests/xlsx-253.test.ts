import { describe, it, expect } from "vitest";
import { gerarXlsx } from "@/lib/financas/planilhaXlsx";

describe("planilha .xlsx", () => {
  it("gera um zip válido com acentos em UTF-8", () => {
    const b = gerarXlsx({ aba: "Lançamentos", cabecalho: ["Data", "Descrição", "Valor"], linhas: [[{ data: "2026-10-05" }, "Alimentação & <café>", -12.5]], colunasDinheiro: [2] });
    expect([b[0], b[1], b[2], b[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]); // "PK.."
    const texto = new TextDecoder().decode(b);
    expect(texto).toContain("Alimentação &amp; &lt;café&gt;");
    expect(texto).toContain("<v>46300</v>"); // 05/10/2026 como data do Excel
    expect(texto).toContain("<v>-12.5</v>");
  });
});
