import { describe, it, expect } from "vitest";
import { fluxoFinanceiro, ateDoPeriodo } from "@/lib/painel/fluxo";
import { BLOCOS, MODELOS, modoDaLista, lerBlocosInicio } from "@/lib/painel/blocos";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

const HOJE = "2026-10-13";
const s = {
  financas: {
    contas: [
      { id: "c1", nome: "Nubank", tipo: "corrente", saldo: 1000 },
      { id: "cc", nome: "Cartão", tipo: "cartao", saldo: 0 },
    ],
    transacoes: [
      // salário que caiu ontem e ninguém confirmou
      { id: "t1", conta_id: "c1", tipo: "receita", valor: 3000, data: "2026-10-12", criado_em: "2026-10-01", recorrencia_id: "r0", conta_tipo: "corrente" },
      // luz agendada pra daqui 3 dias
      { id: "t2", conta_id: "c1", tipo: "despesa", valor: 200, data: "2026-10-16", criado_em: "2026-10-01" },
      // já paga: não aparece
      { id: "t3", conta_id: "c1", tipo: "despesa", valor: 50, data: "2026-10-15", criado_em: "2026-10-01", pago_em: "2026-10-10" },
      // compra no cartão: não aparece (vai pra fatura)
      { id: "t4", conta_id: "cc", tipo: "despesa", valor: 80, data: "2026-10-20", criado_em: "2026-10-01" },
      // fora do período de 7 dias
      { id: "t5", conta_id: "c1", tipo: "despesa", valor: 999, data: "2026-10-28", criado_em: "2026-10-01" },
    ],
    recorrencias: [{ id: "r1", conta_id: "c1", tipo: "despesa", valor: 120, dia_mes: 18, ativo: true, descricao: "Internet", data_fim: null }],
  },
};

describe("Etapa 317 — Início: entradas e saídas, tarefas e áreas", () => {
  it("fluxo de 7 dias: vencido sem confirmar, agendado e conta fixa", () => {
    const f = fluxoFinanceiro(s, HOJE, ateDoPeriodo("7d", HOJE));
    expect(f.itens.map((i) => [i.transacaoId, i.origem, i.data])).toEqual([
      ["t1", "pendente", "2026-10-12"],
      ["t2", "agendado", "2026-10-16"],
      [null, "fixa", "2026-10-18"],
    ]);
    const t1 = f.itens.find((i) => i.transacaoId === "t1")!;
    expect(t1).toMatchObject({ origem: "pendente", atrasado: true, tipo: "receita" });
    expect(f.itens.find((i) => i.origem === "fixa")?.transacaoId).toBeNull();
    expect(f.aEntrar).toBe(3000);
    expect(f.aSair).toBe(320);
    expect(f.saldoHoje).toBe(1000);
    expect(f.saldoDepois).toBe(3680);
  });

  it("período do mês pega o resto do mês", () => {
    expect(ateDoPeriodo("mes", HOJE)).toBe("2026-10-31");
    expect(ateDoPeriodo("mes", "2026-10-30")).toBe("2026-11-06");
    const f = fluxoFinanceiro(s, HOJE, ateDoPeriodo("mes", HOJE));
    expect(f.itens.some((i) => i.transacaoId === "t5")).toBe(true);
  });

  it("blocos novos com área própria e modelo Só tarefas", () => {
    expect(BLOCOS.find((b) => b.id === "fluxo")?.area).toBe("financas");
    expect(BLOCOS.find((b) => b.id === "tarefasHoje")?.area).toBe("tarefas");
    expect(modoDaLista(MODELOS.tarefas.blocos)).toBe("tarefas");
    expect(modoDaLista(MODELOS.financas.blocos)).toBe("financas");
    expect(modoDaLista(MODELOS.habitos.blocos)).toBe("habitos");
    expect(modoDaLista(MODELOS.ambos.blocos)).toBe("ambos");
    expect(modoDaLista(["tarefasHoje", "saldo"])).toBe("ambos");
    expect(lerBlocosInicio(["fluxo", "tarefasHoje", "xx"])).toEqual(["fluxo", "tarefasHoje"]);
    // padrão de quem nunca mexeu continua igual (nada novo aparece sozinho)
    expect(MODELOS.ambos.blocos).not.toContain("fluxo");
  });

  it("novidades 317", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(317);
    expect(NOVIDADES.some((g) => g.versao === "317")).toBe(true);
  });
});
