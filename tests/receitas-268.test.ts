import { describe, it, expect } from "vitest";
import { receitaAguardando } from "@/lib/financas/confirmacao";
import { calcularSaldoPorConta } from "@/lib/financas/consulta";
import { preverFimDoMes } from "@/lib/financas/previsao";

const HOJE = "2026-10-10";
const salario = { conta_id: "c", tipo: "receita", valor: 5000, data: "2026-10-10", recorrencia_id: "r", pago_em: null };

describe("receita programada espera confirmação", () => {
  it("fixa ou agendada aguarda; avulsa lançada no dia não", () => {
    expect(receitaAguardando(salario, HOJE)).toBe(true);
    expect(receitaAguardando({ ...salario, pago_em: HOJE }, HOJE)).toBe(false);
    expect(receitaAguardando({ ...salario, recorrencia_id: null, criado_em: "2026-10-01T12:00:00Z" }, HOJE)).toBe(true);
    expect(receitaAguardando({ ...salario, recorrencia_id: null, criado_em: "2026-10-10T12:00:00Z" }, HOJE)).toBe(false);
    expect(receitaAguardando({ ...salario, data: "2026-10-01" }, HOJE)).toBe(false); // antes da mudança: já valia
    expect(receitaAguardando({ ...salario, tipo: "despesa" }, HOJE)).toBe(false);
  });
  it("não entra no saldo até confirmar, mas entra na previsão", () => {
    const contas = [{ id: "c", nome: "Banco", banco: null, tipo: "corrente", saldo_inicial: 100 }];
    expect(calcularSaldoPorConta(contas, [salario], HOJE)[0].saldo).toBe(100);
    expect(calcularSaldoPorConta(contas, [{ ...salario, pago_em: HOJE }], HOJE)[0].saldo).toBe(5100);
    const p = preverFimDoMes({ contas: [{ id: "c", nome: "Banco", tipo: "corrente", saldo: 100 }], transacoes: [salario as any], recorrencias: [], hojeISO: HOJE });
    expect(p.entradas).toBe(5000);
    expect(p.sobra).toBe(5100);
  });
});

import { despesaAguardando, aguardandoConfirmacao } from "@/lib/financas/confirmacao";
describe("Etapa 270 — despesa programada espera o Paguei", () => {
  const luz = { conta_id: "c", tipo: "despesa", valor: 398, data: "2026-10-10", recorrencia_id: "r", pago_em: null, conta_tipo: "corrente" };
  it("conta fixa/agendada aguarda; cartão e avulsa não", () => {
    expect(despesaAguardando(luz, HOJE)).toBe(true);
    expect(despesaAguardando({ ...luz, conta_tipo: "cartao" }, HOJE)).toBe(false);
    expect(despesaAguardando({ ...luz, conta_tipo: null }, HOJE)).toBe(false);
    expect(despesaAguardando({ ...luz, recorrencia_id: null, criado_em: "2026-10-10T10:00:00Z" }, HOJE)).toBe(false);
    expect(aguardandoConfirmacao({ ...luz, pago_em: HOJE }, HOJE)).toBe(false);
  });
  it("não sai do saldo até marcar Paguei", () => {
    const contas = [{ id: "c", nome: "Banco", banco: null, tipo: "corrente", saldo_inicial: 1000 }];
    expect(calcularSaldoPorConta(contas, [luz], HOJE)[0].saldo).toBe(1000);
    expect(calcularSaldoPorConta(contas, [{ ...luz, pago_em: HOJE }], HOJE)[0].saldo).toBe(602);
    const p = preverFimDoMes({ contas: [{ id: "c", nome: "Banco", tipo: "corrente", saldo: 1000 }], transacoes: [luz as any], recorrencias: [], hojeISO: HOJE });
    expect(p.saidas).toBe(398);
  });
});
