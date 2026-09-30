import { describe, it, expect, vi, afterEach } from "vitest";
import { acharCategoria, contemParecido, gastosPorCategoria } from "@/lib/assistente/categorias";
import { interpretarPergunta } from "@/lib/assistente/interpretar";

const categorias = [
  { id: "m1", nome: "Moradia", tipo: "despesa", meta_mensal: 2000 },
  { id: "m2", nome: "Moradia", tipo: "despesa" }, // da esposa, mesmo nome
  { id: "a1", nome: "Alimentação", tipo: "despesa", meta_mensal: 800 },
  { id: "s1", nome: "Salário", tipo: "receita" },
];

describe("categorias no assistente", () => {
  it("acha categoria com nome repetido e sem acento", () => {
    expect(acharCategoria("quanto gastei de moradia?", categorias as any)).toMatchObject({ nome: "Moradia", ids: ["m1", "m2"], meta: 2000 });
    expect(acharCategoria("gastos com alimentacao", categorias as any)?.ids).toEqual(["a1"]);
    expect(acharCategoria("quanto gastei com uber", categorias as any)).toBeNull();
  });
  it("aceita erro de digitação", () => {
    expect(contemParecido("Supermecado", "mercado")).toBe(true);
    expect(contemParecido("Padaria", "mercado")).toBe(false);
    expect(contemParecido("uber trip", "uber")).toBe(true);
  });
  it("ranking junta nomes iguais", () => {
    const r = gastosPorCategoria(
      [
        { tipo: "despesa", valor: 100, data: "2026-09-10", categoria_id: "m1" },
        { tipo: "despesa", valor: 50, data: "2026-09-11", categoria_id: "m2" },
        { tipo: "despesa", valor: 70, data: "2026-09-12", categoria_id: "a1" },
      ],
      categorias as any,
      "2026-09-01",
      "2026-09-30",
      "2026-09-29"
    );
    expect(r[0]).toMatchObject({ nome: "Moradia", valor: 150, qtd: 2 });
  });
});

describe("respostas sobre categorias", () => {
  afterEach(() => vi.useRealTimers());
  const snap: any = {
    habitos: [],
    habitoCheckins: [],
    tarefas: [],
    conclusoesTarefas: [],
    financas: {
      contas: [{ id: "b", nome: "Inter", tipo: "corrente", saldo: 100 }],
      categorias,
      transacoes: [
        { id: "1", conta_id: "b", tipo: "despesa", valor: 1600, data: "2026-09-30", descricao: "Aluguel Apto", categoria_id: "m2" }, // agendado
        { id: "2", conta_id: "b", tipo: "despesa", valor: 20, data: "2026-08-28", descricao: "Supermecado", categoria_id: "a1" },
        { id: "3", conta_id: "b", tipo: "despesa", valor: 300, data: "2026-09-05", descricao: "Feira", categoria_id: "a1" },
      ],
      metas: [],
      desafios: [],
      desafioQuadrados: [],
      patrimonio: [],
      recorrencias: [],
      ordemBlocosFinancas: null,
    },
    perfil: { nome: "E", email: null, id: "u" },
  };
  const perguntar = (t: string) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-29T12:00:00"));
    return interpretarPergunta(t, snap).texto;
  };
  it("gasto de categoria com agendado", () => {
    const r = perguntar("Quanto gastei de moradia?");
    expect(r).toContain("Não achei gastos já lançados com Moradia");
    expect(r).toContain("1.600,00");
    expect(r).toContain("agendado");
  });
  it("mercado com erro de digitação no mês passado", () => {
    expect(perguntar("Quanto gastei com mercado mês passado?")).toContain("20,00");
  });
  it("lista categorias e ranking", () => {
    expect(perguntar("quais minhas categorias?")).toContain("Alimentação: R$");
    expect(perguntar("onde mais gastei esse mês?")).toContain("1. Alimentação");
  });
  it("quanto ainda posso gastar", () => {
    expect(perguntar("quanto ainda posso gastar com alimentação?")).toContain("500,00");
  });
});
