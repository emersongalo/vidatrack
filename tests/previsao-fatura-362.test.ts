import { describe, it, expect } from "vitest";
import { previsaoFaturas } from "@/lib/financas/previsaoFatura";

describe("Etapa 362 — previsão da fatura", () => {
  const cartao = { id: "c", dia_fechamento: 3, dia_vencimento: 10, limite: 5000 };
  const t = (data: string, valor: number, extra: any = {}) => ({ conta_id: "c", tipo: "despesa", valor, data, ...extra });
  it("parcelas futuras, contas fixas e ritmo", () => {
    const transacoes = [
      t("2026-10-05", 100), // aberta (04/10–03/11)
      t("2026-10-10", 130, { parcela_grupo: "g", parcela_numero: 1, parcela_total: 3 }),
      t("2026-11-10", 130, { parcela_grupo: "g", parcela_numero: 2, parcela_total: 3 }),
      t("2026-12-10", 130, { parcela_grupo: "g", parcela_numero: 3, parcela_total: 3 }),
      t("2026-10-15", 20, { tipo: "receita" }), // estorno
      t("2026-10-20", 50, { recorrencia_id: "netflix" }), // fixa de outubro já lançada
      { conta_id: "c", tipo: "receita", valor: 300, data: "2026-10-12", transferencia_grupo: "pg" }, // pagamento: ignora
    ];
    const recorrencias = [{ id: "netflix", conta_id: "c", tipo: "despesa", valor: 50, descricao: "Netflix", dia_mes: 20, ativo: true }];
    const r = previsaoFaturas(cartao, transacoes as any, recorrencias as any, "2026-10-24", 3);
    expect(r.map((f) => [f.inicio, f.fim, f.vencimento])).toEqual([
      ["2026-10-04", "2026-11-03", "2026-11-10"],
      ["2026-11-04", "2026-12-03", "2026-12-10"],
      ["2026-12-04", "2027-01-03", "2027-01-10"],
    ]);
    expect(r[0]).toMatchObject({ lancado: 260, parcelas: 130, qtdParcelas: 1, totalFixas: 0, previsto: 260 });
    expect(r[1]).toMatchObject({ lancado: 130, totalFixas: 50, previsto: 180 });
    expect(r[2]).toMatchObject({ lancado: 130, totalFixas: 50, previsto: 180 });
    expect(r[0].ritmo).toBeGreaterThan(260);
    expect(r[1].ritmo).toBeNull();
  });
  it("cartão sem fechamento: sem previsão", () => {
    expect(previsaoFaturas({ id: "x" }, [], [], "2026-10-24")).toEqual([]);
  });
});
