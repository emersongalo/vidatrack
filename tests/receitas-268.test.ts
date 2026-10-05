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
