import { describe, it, expect } from "vitest";
import { curvaDoSaldo } from "@/lib/financas/curvaSaldo";
import { ritmoAcimaDoNormal } from "@/lib/financas/alertas";
import { ofertaDeEscudo, pausasComEscudo, escudosUsadosNaSemana } from "@/lib/habitos/escudo";
import { resumoDoPeriodo, mesAnterior, ultimoDiaDoMes } from "@/lib/geral/resumoPeriodo";
import { comDesfazer, desfazerAgora, executarPendentes } from "@/lib/app/desfazer";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

describe("Etapa 276 — saldo projetado", () => {
  it("aplica entradas e saídas no dia certo e o atrasado entra hoje", () => {
    const pontos = curvaDoSaldo(
      1000,
      [
        { data: "2026-10-07", descricao: "atrasada", valor: 100, tipo: "despesa", origem: "agendado" },
        { data: "2026-10-10", descricao: "luz", valor: 200, tipo: "despesa", origem: "recorrente" },
        { data: "2026-10-15", descricao: "salário", valor: 3000, tipo: "receita", origem: "agendado" },
      ],
      "2026-10-08",
      "2026-10-31"
    );
    expect(pontos[0]).toMatchObject({ dia: "2026-10-08", saldo: 900 });
    expect(pontos.find((p) => p.dia === "2026-10-10")?.saldo).toBe(700);
    expect(pontos.at(-1)).toMatchObject({ dia: "2026-10-31", saldo: 3700 });
    expect(pontos).toHaveLength(24);
  });
});

describe("Etapa 276 — ritmo acima do normal", () => {
  const base = (data: string, valor: number) => ({ conta_id: "c", categoria_id: "rest", tipo: "despesa", valor, data });
  it("avisa quando o ritmo projeta bem acima da média", () => {
    const t = [base("2026-07-10", 300), base("2026-08-10", 300), base("2026-09-10", 300), base("2026-10-05", 200)];
    const r = ritmoAcimaDoNormal(t, "2026-10-08");
    expect(r).toHaveLength(1);
    expect(r[0].vezes).toBeGreaterThan(2);
  });
  it("não avisa nos primeiros dias nem se já passou da média", () => {
    const t = [base("2026-07-10", 300), base("2026-08-10", 300), base("2026-10-02", 200)];
    expect(ritmoAcimaDoNormal(t, "2026-10-03")).toHaveLength(0);
    const t2 = [base("2026-07-10", 100), base("2026-08-10", 100), base("2026-10-05", 400)];
    expect(ritmoAcimaDoNormal(t2, "2026-10-08")).toHaveLength(0);
  });
});

describe("Etapa 276 — escudo da sequência", () => {
  const habito = { id: "h", frequencia: "diaria", dias_semana: [], meta_diaria: 1, criado_em: "2026-09-01", pausas: [] as any[] };
  const ck = (data: string) => ({ habito_id: "h", data, quantidade: 1 });
  it("oferece quando ontem falhou e havia sequência", () => {
    const o = ofertaDeEscudo(habito, [ck("2026-10-04"), ck("2026-10-05"), ck("2026-10-06")], "2026-10-08");
    expect(o).toEqual({ dia: "2026-10-07", sequencia: 3, restantes: 1 });
  });
  it("não oferece se ontem foi feito ou sem sequência", () => {
    expect(ofertaDeEscudo(habito, [ck("2026-10-06"), ck("2026-10-07")], "2026-10-08")).toBeNull();
    expect(ofertaDeEscudo(habito, [ck("2026-10-01")], "2026-10-08")).toBeNull();
  });
  it("só 1 por semana", () => {
    const comEscudo = { ...habito, pausas: pausasComEscudo(habito, "2026-10-03") };
    expect(escudosUsadosNaSemana(comEscudo, "2026-10-08")).toBe(1);
    expect(ofertaDeEscudo(comEscudo, [ck("2026-10-04"), ck("2026-10-05"), ck("2026-10-06")], "2026-10-08")).toBeNull();
  });
});

describe("Etapa 276 — resumo do período", () => {
  const snapshot: any = {
    perfil: { id: "eu" },
    habitos: [{ id: "h", nome: "Ler", icone: "📖", cor: "habito", frequencia: "diaria", dias_semana: [], meta_diaria: 1, criado_em: "2026-01-01" }],
    habitoCheckins: [{ habito_id: "h", data: "2026-10-08", quantidade: 1 }],
    tarefas: [{ id: "t", titulo: "Pagar boleto", repetir: "nenhuma", concluida: true, data: "2026-10-08" }],
    conclusoesTarefas: [],
    financas: {
      contas: [{ id: "c", tipo: "corrente" }],
      categorias: [{ id: "cat", nome: "Mercado", icone: "🛒" }],
      transacoes: [
        { id: "x", conta_id: "c", categoria_id: "cat", tipo: "despesa", valor: 62.9, data: "2026-10-08", descricao: "Feira" },
        { id: "y", conta_id: "c", tipo: "despesa", valor: 10, data: "2026-10-08", transferencia_grupo: "g" },
      ],
    },
    diario: [],
  };
  it("monta o dia", () => {
    const r = resumoDoPeriodo(snapshot, "2026-10-08", "2026-10-08", "2026-10-08");
    expect(r.habitos).toMatchObject({ devidos: 1, feitos: 1, pct: 100 });
    expect(r.tarefas.concluidas).toBe(1);
    expect(r.financas.despesas).toBe(62.9);
    expect(r.financas.gastos[0]).toMatchObject({ descricao: "Feira", categoria: "Mercado" });
  });
  it("datas do mês", () => {
    expect(mesAnterior("2026-01")).toBe("2025-12");
    expect(ultimoDiaDoMes("2026-02")).toBe("2026-02-28");
  });
});

describe("Etapa 276 — desfazer", () => {
  it("desfazer cancela a ação atrasada", async () => {
    let rodou = 0;
    let voltou = 0;
    const id = comDesfazer({ texto: "x", executarDepois: () => void rodou++, aoDesfazer: () => void voltou++, duracao: 50 });
    await desfazerAgora(id);
    await new Promise((r) => setTimeout(r, 80));
    expect(rodou).toBe(0);
    expect(voltou).toBe(1);
  });
  it("executa quando o app vai pro fundo", async () => {
    let rodou = 0;
    comDesfazer({ texto: "y", executarDepois: () => void rodou++, duracao: 10000 });
    executarPendentes();
    await new Promise((r) => setTimeout(r, 10));
    expect(rodou).toBe(1);
  });
});

it("novidades 276 no topo", () => {
  expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(276);
  expect(NOVIDADES.some((g) => g.versao === "276")).toBe(true);
});
