import { describe, it, expect } from "vitest";
import { lerBlocosInicio, modoDaLista, moverBloco, alternarBloco, MODELOS } from "@/lib/painel/blocos";
import { resumoSaldo, gastosDaSemana, categoriasDoMes, maioresSequencias, semanaDosHabitos, somarDias } from "@/lib/painel/widgets";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

const HOJE = "2026-09-30";

describe("blocos do Início", () => {
  it("lê o que foi salvo e ignora lixo", () => {
    expect(lerBlocosInicio(["saldo", "xyz", "saldo", "teto"])).toEqual(["saldo", "teto"]);
    expect(lerBlocosInicio('["seuDia"]')).toEqual(["seuDia"]);
    expect(lerBlocosInicio(null)).toEqual(MODELOS.ambos.blocos);
    expect(lerBlocosInicio("{quebrado")).toEqual(MODELOS.ambos.blocos);
  });
  it("reconhece o modelo e move/alterna", () => {
    expect(modoDaLista(MODELOS.habitos.blocos)).toBe("habitos");
    expect(modoDaLista(MODELOS.financas.blocos)).toBe("financas");
    expect(modoDaLista(MODELOS.ambos.blocos)).toBe("ambos");
    expect(modoDaLista(["proximos"])).toBeNull();
    expect(moverBloco(["saldo", "teto"], "teto", -1)).toEqual(["teto", "saldo"]);
    expect(alternarBloco(["saldo"], "teto")).toEqual(["saldo", "teto"]);
    expect(alternarBloco(["saldo", "teto"], "saldo")).toEqual(["teto"]);
  });
});

describe("widgets de finanças", () => {
  const contas = [
    { id: "b", tipo: "corrente", saldo: 1000 },
    { id: "c", tipo: "cartao", saldo: -300 },
    { id: "i", tipo: "investimento", saldo: 5000 },
  ];
  const t = [
    { conta_id: "b", tipo: "receita", valor: 2000, data: "2026-09-05" },
    { conta_id: "b", tipo: "despesa", valor: 100, data: HOJE, categoria_id: "m" },
    { conta_id: "c", tipo: "despesa", valor: 50, data: somarDias(HOJE, -2), categoria_id: "m" },
    { conta_id: "b", tipo: "despesa", valor: 30, data: somarDias(HOJE, -9), categoria_id: "l" },
    { conta_id: "b", tipo: "despesa", valor: 999, data: "2026-10-05" }, // futuro
    { conta_id: "i", tipo: "despesa", valor: 777, data: HOJE }, // investimento
    { conta_id: "b", tipo: "despesa", valor: 500, data: HOJE, transferencia_grupo: "g" },
  ];
  it("saldo só das contas comuns e o mês sem transferência/futuro", () => {
    expect(resumoSaldo(contas, t, HOJE)).toEqual({ saldo: 1000, receitas: 2000, despesas: 180 });
  });
  it("gastos da semana com comparação", () => {
    const g = gastosDaSemana(contas, t, HOJE);
    expect(g.dias).toHaveLength(7);
    expect(g.dias[6]).toEqual({ dia: HOJE, total: 100 });
    expect(g.total).toBe(150);
    expect(g.anterior).toBe(30);
    expect(g.variacaoPct).toBe(400);
  });
  it("categorias do mês", () => {
    const c = categoriasDoMes(contas, t, [{ id: "m", nome: "Mercado" }, { id: "l", nome: "Lanche" }], HOJE);
    expect(c.total).toBe(180);
    expect(c.itens[0]).toMatchObject({ nome: "Mercado", valor: 150, pct: 83 });
  });
});

describe("widgets de hábitos", () => {
  const habitos = [
    { id: "a", nome: "Ler", frequencia: "diaria" },
    { id: "b", nome: "Correr", frequencia: "diaria" },
  ];
  const ck = [0, 1, 2].map((i) => ({ habito_id: "a", data: somarDias(HOJE, -i), quantidade: 1 }));
  it("maiores sequências", () => {
    expect(maioresSequencias(habitos, ck, HOJE)).toEqual([{ id: "a", nome: "Ler", icone: "", cor: "habito", sequencia: 3 }]);
  });
  it("semana dos hábitos", () => {
    const s = semanaDosHabitos(habitos, ck, HOJE);
    expect(s).toHaveLength(7);
    expect(s[6]).toMatchObject({ dia: HOJE, feitos: 1, devidos: 2, pct: 50 });
    expect(s[0].pct).toBe(0);
  });
  it("novidades 235 continua na lista (a mais nova é a 250)", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(250);
    expect(NOVIDADES.some((g) => g.versao === "235")).toBe(true);
  });
});
