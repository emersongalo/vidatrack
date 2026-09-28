import { describe, it, expect } from "vitest";
import { preverFimDoMes, resumoFatura } from "@/lib/financas/previsao";
import { sugerirCategoria } from "@/lib/financas/sugestaoCategoria";
import { gastosForaDoNormal, assinaturasNaoCadastradas, inicioDaRecorrenciaSugerida } from "@/lib/financas/alertas";
import { planoDaMeta } from "@/lib/financas/metas";
import { relacaoHabitosHumor } from "@/lib/habitos/diario";
import { sugerirLembretes } from "@/lib/habitos/lembreteInteligente";
import { valorDaBusca } from "@/lib/geral/busca";

const HOJE = "2026-09-20";

describe("previsão do fim do mês", () => {
  const contas = [
    { id: "banco", nome: "Banco", tipo: "corrente", saldo: 1000 },
    { id: "cart", nome: "Nubank", tipo: "cartao", saldo: -300, dia_fechamento: 20, dia_vencimento: 27 },
  ];
  it("soma agendados, recorrentes não lançadas e fatura, sem contar a recorrência já lançada", () => {
    const p = preverFimDoMes({
      contas,
      hojeISO: HOJE,
      transacoes: [
        { id: "1", conta_id: "banco", tipo: "despesa", valor: 100, data: "2026-09-25", descricao: "Luz" },
        { id: "2", conta_id: "banco", tipo: "despesa", valor: 50, data: "2026-09-26", descricao: "Já pago", pago_em: "2026-09-19" },
        { id: "3", conta_id: "banco", tipo: "despesa", valor: 80, data: "2026-09-28", recorrencia_id: "rA" },
        { id: "4", conta_id: "cart", tipo: "despesa", valor: 300, data: "2026-09-10" },
      ],
      recorrencias: [
        { id: "rA", conta_id: "banco", tipo: "despesa", valor: 80, dia_mes: 28, data_fim: null, ativo: true, descricao: "Net" },
        { id: "rB", conta_id: "banco", tipo: "receita", valor: 2000, dia_mes: 30, data_fim: null, ativo: true, descricao: "Salário" },
        { id: "rC", conta_id: "banco", tipo: "despesa", valor: 999, dia_mes: 5, data_fim: null, ativo: true, descricao: "Passou" },
      ],
    });
    // saídas: luz 100 + net (agendado) 80 + fatura 300 ; entradas: salário 2000
    expect(p.saidas).toBe(480);
    expect(p.entradas).toBe(2000);
    expect(p.sobra).toBe(2520);
    expect(p.itens.find((i) => i.origem === "fatura")?.data).toBe("2026-09-27");
    expect(p.diaNegativo).toBeNull();
    expect(p.diasRestantes).toBe(11);
  });

  it("aponta o dia em que fica negativo", () => {
    const p = preverFimDoMes({
      contas: [{ id: "b", nome: "B", tipo: "corrente", saldo: 100 }],
      hojeISO: HOJE,
      transacoes: [{ conta_id: "b", tipo: "despesa", valor: 150, data: "2026-09-22" }],
      recorrencias: [],
    });
    expect(p.diaNegativo).toBe("2026-09-22");
    expect(p.porDia).toBeNull();
  });

  it("fatura paga depois do fechamento some da previsão", () => {
    const r = resumoFatura(
      { id: "c", nome: "C", tipo: "cartao", dia_fechamento: 20, dia_vencimento: 27 },
      [
        { conta_id: "c", tipo: "despesa", valor: 200, data: "2026-09-01" },
        { conta_id: "c", tipo: "receita", valor: 200, data: "2026-09-21", transferencia_grupo: "g" },
      ],
      { inicio: "2026-08-21", fim: "2026-09-20" }
    );
    expect(r.aPagar).toBe(0);
  });
});

describe("categoria automática", () => {
  const categorias = [
    { id: "ali", nome: "Alimentação", tipo: "despesa" },
    { id: "tra", nome: "Transporte", tipo: "despesa" },
    { id: "sal", nome: "Salário", tipo: "receita" },
  ];
  it("aprende com o histórico", () => {
    const hist = [
      { tipo: "despesa", descricao: "Padaria do Zé", categoria_id: "ali", data: "2026-09-01" },
      { tipo: "despesa", descricao: "Padaria do Zé", categoria_id: "ali", data: "2026-09-05" },
    ];
    expect(sugerirCategoria("padaria do ze", "despesa", hist, categorias)).toBe("ali");
  });
  it("usa palavras-chave quando não há histórico", () => {
    expect(sugerirCategoria("Uber pro trabalho", "despesa", [], categorias)).toBe("tra");
    expect(sugerirCategoria("xyz", "despesa", [], categorias)).toBeNull();
  });
});

describe("alertas", () => {
  const t = (data: string, valor: number, extra: Record<string, unknown> = {}) => ({ conta_id: "b", categoria_id: "m", tipo: "despesa", valor, data, ...extra });
  it("gasto fora do normal", () => {
    const r = gastosForaDoNormal([t("2026-06-10", 500), t("2026-07-10", 500), t("2026-08-10", 500), t("2026-09-10", 800)], HOJE);
    expect(r[0]).toMatchObject({ categoriaId: "m", percentualAcima: 60 });
    expect(gastosForaDoNormal([t("2026-08-10", 500), t("2026-09-10", 800)], HOJE)).toEqual([]);
  });
  it("assinatura repetida vira sugestão; padaria diária não", () => {
    const lista = [
      t("2026-06-15", 39.9, { descricao: "Netflix" }),
      t("2026-07-15", 39.9, { descricao: "Netflix" }),
      t("2026-08-15", 44.9, { descricao: "Netflix" }),
      t("2026-07-02", 8, { descricao: "Padaria" }),
      t("2026-07-03", 8, { descricao: "Padaria" }),
      t("2026-08-02", 8, { descricao: "Padaria" }),
      t("2026-09-02", 8, { descricao: "Padaria" }),
    ];
    const s = assinaturasNaoCadastradas(lista, [], HOJE);
    expect(s.map((x) => x.chave)).toEqual(["netflix"]);
    expect(s[0].cobradaEsteMes).toBe(false);
    expect(inicioDaRecorrenciaSugerida(s[0], HOJE)).toBe("2026-10-15");
    expect(assinaturasNaoCadastradas(lista, [{ descricao: "NETFLIX", ativo: true }], HOJE)).toEqual([]);
  });
});

describe("metas", () => {
  it("quanto guardar por mês", () => {
    expect(planoDaMeta({ valor_atual: 1000, valor_alvo: 4000, data_alvo: "2026-12-31" }, HOJE)).toMatchObject({ falta: 3000, meses: 4, porMes: 750 });
    expect(planoDaMeta({ valor_atual: 0, valor_alvo: 100, data_alvo: "2026-01-01" }, HOJE).prazoPassou).toBe(true);
  });
});

describe("hábitos", () => {
  it("relação humor x hábito", () => {
    const diario = Array.from({ length: 10 }, (_, i) => ({ data: `2026-09-${String(i + 1).padStart(2, "0")}`, humor: i < 5 ? 5 : 2 }));
    const checkins = diario.slice(0, 5).map((d) => ({ habito_id: "h", data: d.data }));
    const r = relacaoHabitosHumor(diario, [{ id: "h", nome: "Treinar", frequencia: "diaria" }], checkins);
    expect(r[0]).toMatchObject({ nome: "Treinar", mediaFeito: 5, mediaNaoFeito: 2, diferenca: 3 });
  });
  it("lembrete inteligente sugere 15 min antes do horário de costume", () => {
    // 21:00 em Brasília = 00:00 UTC do dia seguinte
    const checkins = [11, 12, 13, 14, 15].map((d) => ({ habito_id: "h", data: `2026-09-${d}`, criado_em: `2026-09-${d + 1}T00:0${d % 3}:00Z` }));
    const s = sugerirLembretes([{ id: "h", nome: "Ler", horario_lembrete: "08:00:00" }], checkins, HOJE);
    expect(s[0]).toMatchObject({ atual: "08:00", sugerido: "20:45", costuma: "21:01" });
    expect(sugerirLembretes([{ id: "h", nome: "Ler", horario_lembrete: "20:40" }], checkins, HOJE)).toEqual([]);
  });
});

describe("busca", () => {
  it("entende valores", () => {
    expect(valorDaBusca("45,90")).toBe(45.9);
    expect(valorDaBusca("1.234,5")).toBe(1234.5);
    expect(valorDaBusca("uber")).toBeNull();
  });
});
