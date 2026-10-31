import { describe, expect, it } from "vitest";
import { nivelDoDia, resumoDoMes } from "@/lib/financas/calendarioMes";

describe("Etapa 368 — calendário do mês", () => {
  const l = [
    { id: "1", tipo: "receita", valor: 1000, data: "2026-10-05", pago_em: "2026-10-05" },
    { id: "2", tipo: "despesa", valor: 200, data: "2026-10-05", pago_em: "2026-10-05" },
    { id: "3", tipo: "despesa", valor: 500, data: "2026-10-31" },
    { id: "4", tipo: "despesa", valor: 50, data: "2026-10-10", transferencia_grupo: "x" },
    { id: "5", tipo: "despesa", valor: 80, data: "2026-11-01" },
  ];
  const r = resumoDoMes(l, "2026-10", "2026-10-30");
  it("soma entrada e saída do mês (sem transferência e sem outro mês)", () => {
    expect(r.entrada).toBe(1000);
    expect(r.saida).toBe(700);
    expect(r.dias.get(10)).toBeUndefined();
  });
  it("marca o dia com conta ainda a pagar", () => {
    expect(r.dias.get(31)?.pendente).toBe(true);
    expect(r.dias.get(5)?.pendente).toBe(false);
  });
  it("intensidade pelo saldo do dia", () => {
    expect(r.maior).toBe(800);
    expect(nivelDoDia(r.dias.get(5), r.maior)).toBe(3);
    expect(nivelDoDia(r.dias.get(31), r.maior)).toBe(3);
    expect(nivelDoDia({ entrada: 0, saida: 100, pendente: false, itens: [] }, r.maior)).toBe(1);
    expect(nivelDoDia(undefined, r.maior)).toBe(0);
  });
});
