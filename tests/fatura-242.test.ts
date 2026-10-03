import { describe, it, expect } from "vitest";
import { resumoFatura } from "@/lib/financas/previsao";
import { resumoCartao } from "@/lib/financas/cartaoResumo";

const cartao = { id: "c", nome: "Cartão", tipo: "cartao", dia_fechamento: 28, dia_vencimento: 10 };
const aberta = { inicio: "2026-09-29", fim: "2026-10-28" };

describe("fatura com pagamento adiantado", () => {
  it("pagamento antes do fechamento abate a fatura aberta", () => {
    const t = [
      { conta_id: "c", tipo: "despesa", valor: 2500, data: "2026-10-03" },
      { conta_id: "c", tipo: "despesa", valor: 50, data: "2026-10-03" },
      { conta_id: "c", tipo: "receita", valor: 2550, data: "2026-10-03", transferencia_grupo: "g" },
    ];
    expect(resumoFatura(cartao, t, aberta)).toMatchObject({ total: 2550, pago: 2550, aPagar: 0, vencimento: "2026-11-10" });
  });
  it("pagamento parcial e paga primeiro a fatura mais antiga", () => {
    const t = [
      { conta_id: "c", tipo: "despesa", valor: 300, data: "2026-09-20" }, // fechou 28/09
      { conta_id: "c", tipo: "despesa", valor: 200, data: "2026-10-05" }, // aberta
      { conta_id: "c", tipo: "receita", valor: 400, data: "2026-10-06", transferencia_grupo: "g" },
    ];
    expect(resumoFatura(cartao, t, { inicio: "2026-08-29", fim: "2026-09-28" }).aPagar).toBe(0);
    expect(resumoFatura(cartao, t, aberta)).toMatchObject({ total: 200, pago: 100, aPagar: 100 });
  });
  it("o caso de 'de/para trocado' fecha a conta certa", () => {
    // compras 2550; transferiu 2550 SAINDO do cartão sem querer; depois pagou 5100
    const t = [
      { conta_id: "c", tipo: "despesa", valor: 2550, data: "2026-10-03" },
      { conta_id: "c", tipo: "despesa", valor: 2550, data: "2026-10-08", transferencia_grupo: "a" },
      { conta_id: "c", tipo: "receita", valor: 5100, data: "2026-10-03", transferencia_grupo: "b" },
    ];
    expect(resumoFatura(cartao, t, aberta).aPagar).toBe(0);
    const r = resumoCartao({ ...cartao, saldo: 0 }, t, "2026-10-03");
    expect(r.proxima?.valor).toBe(0);
  });
  it("pagamento muito antigo não abate a fatura de agora", () => {
    const t = [
      { conta_id: "c", tipo: "despesa", valor: 100, data: "2026-10-05" },
      { conta_id: "c", tipo: "receita", valor: 500, data: "2026-05-10", transferencia_grupo: "x" },
    ];
    expect(resumoFatura(cartao, t, aberta).aPagar).toBe(100);
  });
});
