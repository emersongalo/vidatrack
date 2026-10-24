import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { aplicarPatches } from "@/lib/offline/patches";
import { ACOES_OFFLINE } from "@/lib/offline/acoesOffline";
import { linhasTransacao } from "@/lib/financas/linhasTransacao";
import { camposHabito } from "@/lib/habitos/camposHabito";
import { camposEdicaoTarefa } from "@/lib/tarefas/camposTarefa";
import { camposDesafio } from "@/lib/financas/desafiosQuadrados";
import { camposConta } from "@/lib/financas/camposCadastros";

const U = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function fd(pares: [string, string][]) {
  const f = new FormData();
  for (const [k, v] of pares) f.append(k, v);
  return f;
}

describe("Etapa 350 — mudanças no retrato (patches)", () => {
  const base: any = { habitos: [{ id: "a", nome: "Água" }], financas: { transacoes: [{ id: "t1", conta_id: "c1" }], contas: [] } };

  it("upsert, mesclar, remover e removerOnde — aplicar 2x dá o mesmo resultado", () => {
    const patches: any[] = [
      { colecao: "habitos", op: "mesclar", id: "a", valores: { nome: "Água 2L" } },
      { colecao: "habitos", op: "upsert", id: "b", valores: { nome: "Ler" } },
      { colecao: "financas.transacoes", op: "upsert", id: "t2", valores: { conta_id: "c1" } },
      { colecao: "financas.contas", op: "upsert", id: "c9", valores: { nome: "Nova" } },
    ];
    const uma = aplicarPatches(base, patches);
    const duas = aplicarPatches(uma, patches);
    expect(duas).toEqual(uma);
    expect(uma.habitos.map((h: any) => h.nome)).toEqual(["Água 2L", "Ler"]);
    expect(uma.financas.transacoes[0].id).toBe("t2"); // lançamento novo entra no topo
    expect(uma.financas.contas[0].pendente_sync).toBe(true);
    const tirar = aplicarPatches(uma, [
      { colecao: "habitos", op: "remover", id: "a" },
      { colecao: "financas.transacoes", op: "removerOnde", campo: "conta_id", valor: "c1" },
    ] as any);
    expect(tirar.habitos.map((h: any) => h.id)).toEqual(["b"]);
    expect(tirar.financas.transacoes).toEqual([]);
    expect(base.habitos[0].nome).toBe("Água"); // não mexe no original
  });

  it("todas as ações offline estão no executor do servidor", () => {
    const txt = readFileSync("lib/offline/executarAcaoOffline.ts", "utf8");
    for (const a of ACOES_OFFLINE) expect(txt, a).toContain(`  ${a}: [`);
  });
});

describe("Etapa 351 — lançamentos especiais com id do aparelho", () => {
  it("parcelado usa os ids e o grupo vindos do aparelho", () => {
    const f = fd([["tipo", "despesa"], ["valor", "650,00"], ["contaId", U(1)], ["data", "2026-10-10"], ["parcelado", "on"], ["numParcelas", "5"], ["grupoCliente", U(9)], ...[1, 2, 3, 4, 5].map((i) => ["idParcela", U(10 + i)] as [string, string])]);
    const r = linhasTransacao(f, "eu", () => "x") as any;
    expect(r.parcelado).toBe(true);
    expect(r.linhas.map((l: any) => l.id)).toEqual([U(11), U(12), U(13), U(14), U(15)]);
    expect(new Set(r.linhas.map((l: any) => l.parcela_grupo))).toEqual(new Set([U(9)]));
    expect(r.linhas.map((l: any) => l.valor)).toEqual([130, 130, 130, 130, 130]);
    expect(r.linhas[1].data).toBe("2026-11-10");
  });
  it("repetir todo mês liga o lançamento à recorrência", () => {
    const f = fd([["tipo", "despesa"], ["valor", "99,90"], ["contaId", U(1)], ["data", "2026-10-05"], ["recorrente", "on"], ["diaMes", "5"], ["idCliente", U(2)], ["idRecorrenciaCliente", U(3)]]);
    const r = linhasTransacao(f, "eu", () => "x") as any;
    expect(r.linhas[0]).toMatchObject({ id: U(2), recorrencia_id: U(3), valor: 99.9 });
    expect(r.recorrencia).toMatchObject({ id: U(3), dia_mes: 5, data_inicio: "2026-10-05" });
  });
  it("formulário inválido devolve o erro", () => {
    expect(linhasTransacao(fd([["tipo", "despesa"], ["valor", ""], ["contaId", U(1)]]), "eu", () => "x")).toHaveProperty("erro");
  });
});

describe("Etapas 350/352 — mesma leitura de formulário no app e no servidor", () => {
  it("hábito", () => {
    const c = camposHabito(fd([["nome", " Ler "], ["frequencia", "dias_semana"], ["diasSemana", "1"], ["diasSemana", "3"], ["horariosLembrete", "8:00"], ["depoisDe", U(5)]]), U(5));
    expect(c).toMatchObject({ nome: "Ler", dias_semana: [1, 3], horario_lembrete: "08:00", depois_de: null });
  });
  it("tarefa (edição)", () => {
    expect(camposEdicaoTarefa(fd([["titulo", ""]]))).toEqual({ erro: "Dê um título para a tarefa" });
    expect(camposEdicaoTarefa(fd([["titulo", "Pagar luz"], ["repetir", "mensal"], ["diaMes", "10"]])).campos).toMatchObject({ titulo: "Pagar luz", dia_mes: 10, data: null });
  });
  it("desafio soma exatamente o total", () => {
    const c = camposDesafio(fd([["nome", "Viagem"], ["valorTotal", "1.000,00"], ["prazoQuantidade", "7"], ["tipoProgressao", "crescente"], ["contaOrigemId", U(1)]])) as any;
    expect(Math.round(c.valorAlvo * 100) / 100).toBe(1000);
    expect(c.quadrados).toHaveLength(7);
  });
  it("conta (cartão com limite)", () => {
    const r = camposConta(fd([["nome", "Nubank"], ["tipo", "cartao"], ["limite", "5.000,00"], ["diaFechamento", "3"], ["diaVencimento", "10"]])) as any;
    expect(r.campos).toMatchObject({ nome: "Nubank", tipo: "cartao", limite: 5000 });
  });
});

describe("Etapa 350 — executor da fila no servidor", () => {
  it("redirecionar = deu certo; ?erro= = recusado de vez; { erro } = recusado", async () => {
    const { redirect } = await import("next/navigation");
    vi.doMock("@/app/habitos/actions", () => ({
      arquivarHabito: async () => redirect("/habitos"),
      atualizarHabito: async (_id: string, f: FormData) => redirect(`/habitos/x/editar?erro=${encodeURIComponent("Nome " + f.get("nome"))}`),
      criarHabito: async () => ({ erro: "Sem nome" }),
      restaurarHabito: async () => {
        throw new Error("fetch failed");
      },
    }));
    const { executarAcaoOffline } = await import("@/lib/offline/executarAcaoOffline");
    expect(await executarAcaoOffline("arquivarHabito", ["a"])).toEqual({ sucesso: true });
    expect(await executarAcaoOffline("atualizarHabito", ["a", { __fd: [["nome", "curto"]] }])).toEqual({ sucesso: false, erro: "Nome curto", definitivo: true });
    expect(await executarAcaoOffline("criarHabito", [{ __fd: [] }])).toMatchObject({ sucesso: false, definitivo: true });
    expect(await executarAcaoOffline("restaurarHabito", ["a"])).toMatchObject({ sucesso: false, erro: "fetch failed" });
    expect(await executarAcaoOffline("apagarTudo", [])).toMatchObject({ sucesso: false, definitivo: true });
  });
});
