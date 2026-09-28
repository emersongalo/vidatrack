import { describe, it, expect } from "vitest";
import { sugerirDescricoes, descricoesFrequentes } from "@/lib/financas/sugestaoDescricao";
import { calcularInsightsFinanceiros } from "@/lib/financas/insights-calculo";

const hist = [
  { tipo: "despesa", descricao: "Lavagem do carro", categoria_id: "car", conta_id: "b", valor: 40, data: "2026-09-06" },
  { tipo: "despesa", descricao: "Lavagem do carro", categoria_id: "car", conta_id: "b", valor: 45, data: "2026-09-13" },
  { tipo: "despesa", descricao: "Lanche", categoria_id: "ali", conta_id: "b", valor: 20, data: "2026-09-10" },
  { tipo: "receita", descricao: "Lavagem extra", categoria_id: null, conta_id: "b", valor: 100, data: "2026-09-10" },
];

describe("completar descrição", () => {
  it("lave → Lavagem do carro com categoria e último valor", () => {
    const r = sugerirDescricoes("lave", "despesa", hist);
    expect(r[0]).toMatchObject({ descricao: "Lavagem do carro", categoriaId: "car", ultimoValor: 45, vezes: 2 });
    expect(r).toHaveLength(1); // a receita não entra
  });
  it("acha pelo começo de qualquer palavra", () => {
    expect(sugerirDescricoes("carr", "despesa", hist)[0].descricao).toBe("Lavagem do carro");
  });
  it("frequentes: só o que se repete", () => {
    expect(descricoesFrequentes("despesa", hist, "2026-09-28").map((s) => s.descricao)).toEqual(["Lavagem do carro"]);
  });
});

describe("análise do mês", () => {
  it("não mistura lançamentos do mês seguinte", () => {
    const r = calcularInsightsFinanceiros(
      [
        { valor: 100, descricao: "set", data: "2026-09-10", nomeCategoria: "A" },
        { valor: 900, descricao: "out", data: "2026-10-20", nomeCategoria: "B" },
      ],
      [],
      "2026-09-28",
      "2026-09-28"
    );
    expect(r.totalDespesasMes).toBe(100);
  });
});
