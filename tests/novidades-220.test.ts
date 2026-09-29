import { describe, it, expect, vi, afterEach } from "vitest";
import { periodoDaFrase, dataDaFrase, contaDaFrase, assuntoDaFrase, limparDescricao } from "@/lib/assistente/entender";
import { interpretarPergunta } from "@/lib/assistente/interpretar";
import { eventosFinanceiros, saldoPrevistoPorDia } from "@/lib/financas/calendario";
import { gastoDoMes, situacaoTeto } from "@/lib/financas/teto";
import { resumoDozeMeses } from "@/lib/financas/dozeMeses";
import { padroesPorDiaSemana } from "@/lib/habitos/padroes";
import { placarDoHabito } from "@/lib/habitos/desafio";
import { opcoesAdiar } from "@/lib/agenda/adiar";
import { alternarCartao, lerPreferenciaPainel, moverCartao, PADRAO_PAINEL, valorDoCartao } from "@/lib/painel/cartoes";
import { deveMostrarNovidades, NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

const HOJE = "2026-09-28"; // segunda-feira

function somar(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

describe("assistente — entender a frase", () => {
  it("períodos", () => {
    expect(periodoDaFrase("quanto gastei ontem", HOJE)).toMatchObject({ inicio: "2026-09-27", fim: "2026-09-27" });
    expect(periodoDaFrase("quanto gastei mês passado", HOJE)).toMatchObject({ inicio: "2026-08-01", fim: "2026-08-31" });
    expect(periodoDaFrase("gastos nos últimos 7 dias", HOJE)).toMatchObject({ inicio: "2026-09-22", fim: HOJE });
    expect(periodoDaFrase("quanto gastei em março", HOJE)).toMatchObject({ inicio: "2026-03-01", fim: "2026-03-31" });
    expect(periodoDaFrase("quanto gastei", HOJE)).toBeNull();
  });
  it("datas de lançamento", () => {
    expect(dataDaFrase("gastei 30 ontem", HOJE)).toBe("2026-09-27");
    expect(dataDaFrase("gastei 30 anteontem", HOJE)).toBe("2026-09-26");
    expect(dataDaFrase("gastei 30 dia 15/09", HOJE)).toBe("2026-09-15");
    expect(dataDaFrase("gastei 30", HOJE)).toBeNull();
  });
  it("conta, assunto e limpeza", () => {
    const contas = [
      { id: "c1", nome: "Nubank", banco: null },
      { id: "c2", nome: "Carteira", banco: null },
    ];
    expect(contaDaFrase("gastei 30 no nubank", contas)?.id).toBe("c1");
    expect(contaDaFrase("gastei 30 no mercado", contas)).toBeNull();
    expect(assuntoDaFrase("quanto gastei com mercado mês passado")).toBe("mercado");
    const limpa = limparDescricao("mercado no nubank", "Nubank");
    expect(limpa?.toLowerCase()).not.toContain("nubank");
  });
});

describe("assistente — respostas", () => {
  afterEach(() => vi.useRealTimers());
  const snapshot: any = {
    habitos: [],
    habitoCheckins: [],
    tarefas: [],
    conclusoesTarefas: [],
    financas: {
      contas: [
        { id: "c1", nome: "Nubank", tipo: "corrente", saldo: 1000 },
        { id: "c2", nome: "Carteira", tipo: "carteira", saldo: 50 },
      ],
      categorias: [{ id: "cat1", nome: "Mercado", tipo: "despesa" }],
      transacoes: [
        { id: "t1", conta_id: "c1", tipo: "despesa", valor: 120, data: "2026-08-10", descricao: "Mercado Extra", categoria_id: "cat1" },
        { id: "t2", conta_id: "c1", tipo: "despesa", valor: 80, data: "2026-08-20", descricao: "Mercado Dia", categoria_id: "cat1" },
        { id: "t3", conta_id: "c1", tipo: "despesa", valor: 999, data: "2026-09-05", descricao: "Mercado", categoria_id: "cat1" },
      ],
      metas: [],
      desafios: [],
      desafioQuadrados: [],
      patrimonio: [],
      recorrencias: [],
      ordemBlocosFinancas: null,
    },
    perfil: { nome: "Teste", email: null, id: "u1" },
  };

  it("soma gasto por assunto no período", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-28T12:00:00"));
    const r = interpretarPergunta("Quanto gastei com mercado mês passado?", snapshot);
    expect(r.tipo).toBe("texto");
    expect(r.texto).toContain("200");
  });

  it("lançamento já com conta e data", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-28T12:00:00"));
    const r = interpretarPergunta("gastei 30 no mercado na carteira ontem", snapshot);
    expect(r.tipo).toBe("proposta_lancamento");
    if (r.tipo === "proposta_lancamento") {
      expect(r.dados.valor).toBe("30,00");
      expect(r.dados.descricao?.toLowerCase()).toContain("mercado");
      expect(r.dados.descricao?.toLowerCase()).not.toContain("carteira");
      expect(r.dados.descricao?.toLowerCase()).not.toContain("ontem");
      expect(r.dados.contaId).toBe("c2");
      expect(r.dados.data).toBe("2026-09-27");
    }
  });
});

describe("calendário financeiro", () => {
  const contas = [{ id: "b", nome: "Banco", tipo: "corrente", saldo: 500 }];
  it("inclui contas fixas futuras e calcula saldo previsto", () => {
    const ev = eventosFinanceiros(
      {
        contas,
        transacoes: [{ conta_id: "b", tipo: "despesa", valor: 50, data: "2026-09-10", descricao: "Padaria" }],
        recorrencias: [{ id: "r", conta_id: "b", tipo: "despesa", valor: 700, dia_mes: 30, data_fim: null, ativo: true, descricao: "Aluguel" }],
        hojeISO: HOJE,
      },
      "2026-09-01",
      "2026-09-30"
    );
    expect(ev.map((e) => e.descricao)).toEqual(["Padaria", "Aluguel"]);
    const saldo = saldoPrevistoPorDia(500, ev, HOJE, "2026-09-30");
    expect(saldo.get("2026-09-29")).toBe(500);
    expect(saldo.get("2026-09-30")).toBe(-200);
  });
});

describe("teto do mês", () => {
  it("soma despesas do mês e avisa ritmo", () => {
    const contas = [{ id: "b", tipo: "corrente" }, { id: "i", tipo: "investimento" }];
    const gasto = gastoDoMes(
      contas as any,
      [
        { conta_id: "b", tipo: "despesa", valor: 300, data: "2026-09-05" },
        { conta_id: "b", tipo: "despesa", valor: 100, data: "2026-08-30" },
        { conta_id: "i", tipo: "despesa", valor: 999, data: "2026-09-05" },
        { conta_id: "b", tipo: "despesa", valor: 50, data: "2026-09-06", transferencia_grupo: "g" },
      ],
      HOJE
    );
    expect(gasto).toBe(300);
    const s = situacaoTeto(900, 1000, HOJE);
    expect(s).toMatchObject({ pct: 90, restante: 100, estourou: false });
    expect(situacaoTeto(1100, 1000, HOJE).estourou).toBe(true);
  });
});

describe("12 meses", () => {
  it("devolve 12 meses em ordem com sobra", () => {
    const r = resumoDozeMeses(
      [{ id: "b", tipo: "corrente" }],
      [
        { conta_id: "b", tipo: "receita", valor: 1000, data: "2026-09-01" },
        { conta_id: "b", tipo: "despesa", valor: 400, data: "2026-09-02" },
        { conta_id: "b", tipo: "despesa", valor: 100, data: "2025-10-02" },
      ],
      HOJE
    );
    expect(r).toHaveLength(12);
    expect(r[0].mes).toBe("2025-10");
    expect(r[11]).toMatchObject({ mes: "2026-09", receitas: 1000, despesas: 400, sobra: 600 });
  });
});

describe("padrões da semana", () => {
  it("acha o dia que mais falha", () => {
    const h = { id: "h", nome: "Correr", frequencia: "diaria", dias_semana: [], criado_em: "2026-01-01", meta_diaria: 1 };
    const checkins = [];
    for (let i = 1; i <= 56; i++) {
      const d = somar(HOJE, -i);
      const ds = new Date(d + "T12:00:00Z").getUTCDay();
      if (ds !== 5) checkins.push({ habito_id: "h", data: d, quantidade: 1 }); // nunca na sexta
    }
    const p = padroesPorDiaSemana([h], checkins, HOJE);
    expect(p).toHaveLength(1);
    expect(p[0].piorDia).toBe(5);
    expect(p[0].taxaPiorDia).toBe(0);
  });
});

describe("desafio com amigo", () => {
  it("ordena pela sequência", () => {
    const h = { id: "h", meta_diaria: 1 };
    const checkins = [
      { habito_id: "h", data: HOJE, usuario_id: "a" },
      { habito_id: "h", data: somar(HOJE, -1), usuario_id: "a" },
      { habito_id: "h", data: somar(HOJE, -1), usuario_id: "b" },
    ];
    const p = placarDoHabito(h, checkins, ["b", "a"], HOJE);
    expect(p[0]).toMatchObject({ usuarioId: "a", sequencia: 2, hoje: true });
    expect(p[1]).toMatchObject({ usuarioId: "b", sequencia: 1, hoje: false });
  });
});

describe("adiar tarefa", () => {
  it("opções sem datas repetidas", () => {
    expect(opcoesAdiar(HOJE).map((o) => o.data)).toEqual(["2026-09-29", "2026-10-03", "2026-10-05"]);
    // sexta: amanhã já é sábado
    const sexta = opcoesAdiar("2026-10-02");
    expect(sexta.map((o) => o.rotulo)).toEqual(["Amanhã", "Segunda", "+1 semana"]);
  });
});

describe("painel personalizável", () => {
  it("lê, alterna e move", () => {
    expect(lerPreferenciaPainel(null)).toEqual(PADRAO_PAINEL);
    expect(lerPreferenciaPainel("lixo")).toEqual(PADRAO_PAINEL);
    expect(lerPreferenciaPainel('["teto","xyz","teto","saldo"]')).toEqual(["teto", "saldo"]);
    expect(lerPreferenciaPainel("[]")).toEqual([]);
    expect(alternarCartao(["saldo"], "teto")).toEqual(["saldo", "teto"]);
    expect(alternarCartao(["saldo", "teto"], "saldo")).toEqual(["teto"]);
    expect(moverCartao(["a", "b"] as any, "b" as any, -1)).toEqual(["b", "a"]);
    expect(moverCartao(["a", "b"] as any, "a" as any, -1)).toEqual(["a", "b"]);
  });
  it("calcula cartões sem quebrar com retrato vazio", () => {
    const vazio: any = { habitos: [], habitoCheckins: [], financas: { contas: [], transacoes: [], recorrencias: [], metas: [] }, perfil: {} };
    for (const id of ["habitos", "saldo", "previsao", "proxima_conta", "teto", "sequencia", "humor", "metas"] as const) {
      expect(valorDoCartao(id, vazio, HOJE).valor).toBeTruthy();
    }
    const s: any = {
      habitos: [
        { id: "h1", nome: "Água", frequencia: "diaria", dias_semana: [], meta_diaria: 2 },
        { id: "h2", nome: "Ler", frequencia: "diaria", dias_semana: [] },
      ],
      habitoCheckins: [
        { habito_id: "h1", data: HOJE, quantidade: 1 },
        { habito_id: "h2", data: HOJE, quantidade: 1 },
        { habito_id: "h2", data: somar(HOJE, -1), quantidade: 1 },
      ],
      financas: { contas: [], transacoes: [], recorrencias: [], metas: [] },
      perfil: {},
    };
    expect(valorDoCartao("habitos", s, HOJE).valor).toBe("1/2");
    expect(valorDoCartao("sequencia", s, HOJE)).toMatchObject({ valor: "2 dias", detalhe: "Ler" });
  });
});

describe("novidades", () => {
  it("só pra quem já usa e ainda não viu", () => {
    expect(NOVIDADES[0].versao).toBe(VERSAO_NOVIDADES);
    expect(deveMostrarNovidades(null, false)).toBe(false);
    expect(deveMostrarNovidades(null, true)).toBe(true);
    expect(deveMostrarNovidades(VERSAO_NOVIDADES, true)).toBe(false);
    expect(deveMostrarNovidades("218", true)).toBe(true);
  });
});
