import { describe, it, expect } from "vitest";
import { gastoDoDia, fraseDoDia, topoDoInicio } from "@/lib/painel/topoInicio";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

const r = (hf: number, ht: number, tf: number, tt: number) => ({
  habitos: { feitos: hf, total: ht, pendentes: [] },
  tarefas: { feitas: tf, total: tt, pendentes: [] },
});

describe("Etapa 287 — topo do Início", () => {
  it("gasto e entrada do dia (sem transferência)", () => {
    const g = gastoDoDia(
      [
        { tipo: "despesa", valor: 30.1, data: "2026-10-10" },
        { tipo: "despesa", valor: "12.5", data: "2026-10-10" },
        { tipo: "despesa", valor: 99, data: "2026-10-10", transferencia_grupo: "x" },
        { tipo: "receita", valor: 200, data: "2026-10-10" },
        { tipo: "despesa", valor: 7, data: "2026-10-09" },
      ],
      "2026-10-10"
    );
    expect(g).toEqual({ gasto: 42.6, entrou: 200 });
  });
  it("frase conforme o andamento", () => {
    expect(fraseDoDia(r(0, 0, 0, 0), 9)).toContain("Dia livre");
    expect(fraseDoDia(r(3, 3, 1, 1), 20)).toContain("Dia fechado");
    expect(fraseDoDia(r(0, 2, 0, 1), 8)).toBe("Bora começar: 2 hábitos e 1 tarefa hoje.");
    expect(fraseDoDia(r(3, 4, 0, 0), 15)).toBe("Mais da metade feita! Faltam 1 hábito.");
    expect(fraseDoDia(r(1, 4, 0, 1), 15)).toBe("Faltam 3 hábitos e 1 tarefa pra fechar o dia.");
  });
  it("junta tudo", () => {
    const t = topoDoInicio({ habitos: [], tarefas: [], financas: { transacoes: [] } }, "2026-10-10", 10);
    expect(t.gastoHoje).toBe(0);
    expect(t.frase).toContain("Dia livre");
  });
  it("novidades 287", () => {
    expect(VERSAO_NOVIDADES).toBe("287");
    expect(NOVIDADES[0].versao).toBe("287");
  });
});
