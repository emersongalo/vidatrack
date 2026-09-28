import { describe, expect, it } from "vitest";
import { dividirParcelas, somarMesesISO } from "@/lib/financas/parcelas";
import { calcularSaldoPorConta } from "@/lib/financas/consulta";
import { feitosNaSemana, inicioDaSemana } from "@/lib/agenda/dias";

// Etapa 214 — regras que mexem em dinheiro/sequência, testadas a cada push.

describe("parcelamento", () => {
  it("divide o total e a última parcela leva a sobra", () => {
    expect(dividirParcelas(100, 3, "total")).toEqual([33.33, 33.33, 33.34]);
  });
  it("modo 'parcela' multiplica", () => {
    expect(dividirParcelas(150, 10, "parcela")).toEqual(Array(10).fill(150));
  });
  it("a soma das parcelas é sempre o total", () => {
    const p = dividirParcelas(1234.57, 7, "total");
    expect(Math.round(p.reduce((a, b) => a + b, 0) * 100)).toBe(123457);
  });
  it("dia 31 cai no último dia dos meses menores", () => {
    expect([0, 1, 2, 3].map((i) => somarMesesISO("2026-01-31", i))).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
    ]);
  });
  it("vira o ano", () => {
    expect(somarMesesISO("2026-11-15", 3)).toBe("2027-02-15");
  });
});

describe("saldo de hoje", () => {
  const contas = [{ id: "c1", nome: "Itaú", banco: "itau", tipo: "banco", saldo_inicial: 169 }];
  it("lançamento com data futura não sai do saldo (Etapa 203)", () => {
    const [c] = calcularSaldoPorConta(contas, [{ conta_id: "c1", tipo: "despesa", valor: 74, data: "2026-10-05" }], "2026-09-27");
    expect(c.saldo).toBe(169);
  });
  it("agendado marcado como pago sai do saldo na hora (Etapa 209)", () => {
    const [c] = calcularSaldoPorConta(
      contas,
      [{ conta_id: "c1", tipo: "despesa", valor: 74, data: "2026-10-05", pago_em: "2026-09-27" }],
      "2026-09-27"
    );
    expect(c.saldo).toBe(95);
  });
  it("lançamento de hoje ou passado sempre conta", () => {
    const [c] = calcularSaldoPorConta(
      contas,
      [
        { conta_id: "c1", tipo: "despesa", valor: 20, data: "2026-09-27" },
        { conta_id: "c1", tipo: "receita", valor: 50, data: "2026-09-01" },
      ],
      "2026-09-27"
    );
    expect(c.saldo).toBe(199);
  });
});

describe("hábito X vezes por semana (Etapa 213)", () => {
  it("semana começa na segunda", () => {
    expect(inicioDaSemana("2026-09-27")).toBe("2026-09-21"); // domingo
    expect(inicioDaSemana("2026-09-28")).toBe("2026-09-28"); // segunda
  });
  it("conta só os dias da semana até o dia visto", () => {
    const dias = ["2026-09-20", "2026-09-22", "2026-09-24", "2026-09-26"];
    expect(feitosNaSemana(dias, "2026-09-24")).toBe(2);
    expect(feitosNaSemana(dias, "2026-09-27")).toBe(3);
  });
});
