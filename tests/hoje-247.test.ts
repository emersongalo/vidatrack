import { describe, it, expect } from "vitest";
import { podeGastarHoje, gastosRapidos, valorParaFormulario } from "@/lib/financas/hoje";
import { preverFimDoMes } from "@/lib/financas/previsao";
import { alertasDeLimite } from "@/lib/financas/limites80";

const HOJE = "2026-10-21"; // faltam 11 dias (21..31)
const contas = [
  { id: "c1", nome: "Banco", tipo: "corrente", saldo: 1100 },
  { id: "inv", nome: "Invest", tipo: "investimento", saldo: 5000 },
];

describe("quanto posso gastar hoje", () => {
  it("divide a folga pelos dias que faltam, contando o que já saiu hoje", () => {
    const transacoes = [{ conta_id: "c1", tipo: "despesa", valor: 30, data: HOJE }];
    // saldo 1100 já sem os 30 de hoje → folga de manhã 1130 → 1130/11 ≈ 102,73
    const previsao = preverFimDoMes({ contas, transacoes, recorrencias: [], hojeISO: HOJE });
    const r = podeGastarHoje({ previsao, contas, transacoes, hojeISO: HOJE });
    expect(r.limite).toBeCloseTo(102.73, 2);
    expect(r.gastouHoje).toBe(30);
    expect(r.restante).toBeCloseTo(72.73, 2);
    expect(r.motivo).toBe("saldo");
  });
  it("conta fixa que ainda vai vencer diminui o valor", () => {
    const recorrencias = [{ id: "r", conta_id: "c1", tipo: "despesa", valor: 550, dia_mes: 25, data_fim: null, ativo: true, descricao: "Aluguel" }];
    const previsao = preverFimDoMes({ contas, transacoes: [], recorrencias, hojeISO: HOJE });
    const r = podeGastarHoje({ previsao, contas, transacoes: [], hojeISO: HOJE });
    expect(r.limite).toBe(50);
  });
  it("o teto manda quando é mais apertado", () => {
    const transacoes = [{ conta_id: "c1", tipo: "despesa", valor: 900, data: "2026-10-05" }];
    const previsao = preverFimDoMes({ contas, transacoes, recorrencias: [], hojeISO: HOJE });
    const r = podeGastarHoje({ previsao, contas, transacoes, hojeISO: HOJE, teto: 1010 });
    expect(r.motivo).toBe("teto");
    expect(r.limite).toBe(10);
  });
  it("sem folga quando as contas já comem o saldo", () => {
    const recorrencias = [{ id: "r", conta_id: "c1", tipo: "despesa", valor: 2000, dia_mes: 25, data_fim: null, ativo: true, descricao: "X" }];
    const previsao = preverFimDoMes({ contas, transacoes: [], recorrencias, hojeISO: HOJE });
    const r = podeGastarHoje({ previsao, contas, transacoes: [], hojeISO: HOJE });
    expect(r.semFolga).toBe(true);
    expect(r.limite).toBe(0);
  });
});

describe("lançar rápido", () => {
  it("só gastos que se repetem, sem conta fixa e com conta válida", () => {
    const t = [
      { conta_id: "c1", tipo: "despesa", valor: 12, data: "2026-10-20", descricao: "Padaria", categoria_id: null },
      { conta_id: "c1", tipo: "despesa", valor: 10, data: "2026-10-10", descricao: "padaria", categoria_id: null },
      { conta_id: "c1", tipo: "despesa", valor: 99, data: "2026-10-01", descricao: "Netflix", recorrencia_id: "r" },
      { conta_id: "c1", tipo: "despesa", valor: 99, data: "2026-09-01", descricao: "Netflix", recorrencia_id: "r" },
      { conta_id: "x", tipo: "despesa", valor: 5, data: "2026-10-01", descricao: "Café" },
      { conta_id: "x", tipo: "despesa", valor: 5, data: "2026-10-02", descricao: "Café" },
    ];
    const r = gastosRapidos(contas, t, HOJE);
    expect(r.map((g) => g.descricao)).toEqual(["Padaria"]);
    expect(r[0].ultimoValor).toBe(12);
    expect(valorParaFormulario(12)).toBe("12,00");
  });
});

describe("aviso aos 80%", () => {
  it("teto e categoria", () => {
    const snapshot = {
      perfil: { teto_mensal: 1000 },
      financas: {
        contas,
        categorias: [{ id: "cat", nome: "Mercado", tipo: "despesa", meta_mensal: 500 }],
        transacoes: [{ conta_id: "c1", tipo: "despesa", valor: 850, data: "2026-10-03", categoria_id: "cat" }],
      },
    };
    const a = alertasDeLimite(snapshot, HOJE);
    expect(a.map((x) => x.id)).toEqual(["teto-80-2026-10", "orc-100-cat-2026-10"]);
  });
});
