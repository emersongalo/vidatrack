import { describe, it, expect, vi, beforeEach } from "vitest";
import { escritaValida, patchesDaEscrita } from "@/lib/offline/escrita";
import { aplicarPatches } from "@/lib/offline/patches";
import { lancamentosRecorrentesQueFaltam } from "@/lib/local/recorrentesMes";
import { ACOES_OFFLINE } from "@/lib/offline/acoesOffline";
import { readFileSync } from "node:fs";

describe("Etapa 353 — escrita simples (com/sem internet)", () => {
  it("só tabelas e operações permitidas", () => {
    expect(escritaValida({ tabela: "habitos", op: "update", id: "a", valores: { pausas: [] } })).toBeNull();
    expect(escritaValida({ tabela: "perfis", op: "delete", id: "a" })).not.toBeNull();
    expect(escritaValida({ tabela: "compartilhamentos", op: "update", id: "a", valores: {} })).not.toBeNull();
    expect(escritaValida({ tabela: "tarefas", op: "update", valores: { data: "2026-10-10" } })).not.toBeNull(); // sem id
  });

  it("vira mudança no retrato: mesclar, arquivar some, diário por data, perfil", () => {
    const snap: any = {
      habitos: [{ id: "h", nome: "Ler" }],
      tarefas: [{ id: "t", titulo: "X" }],
      diario: [{ data: "2026-10-01", humor: 3, texto: null }],
      perfil: { id: "eu", teto_mensal: null },
      financas: { transacoes: [], ordemBlocosFinancas: null },
    };
    const p = [
      ...patchesDaEscrita({ tabela: "habitos", op: "update", id: "h", valores: { pausas: [{ inicio: "a", fim: "b" }] } }),
      ...patchesDaEscrita({ tabela: "tarefas", op: "update", id: "t", valores: { arquivada: true } }),
      ...patchesDaEscrita({ tabela: "diario_dias", op: "upsert", valores: { data: "2026-10-01", humor: 5, texto: "ótimo" } }),
      ...patchesDaEscrita({ tabela: "diario_dias", op: "upsert", valores: { data: "2026-10-02", humor: 4, texto: null } }),
      ...patchesDaEscrita({ tabela: "perfis", op: "update", id: "eu", valores: { teto_mensal: 3000, ordem_blocos_financas: ["a"] } }),
    ];
    const r = aplicarPatches(snap, p);
    expect(r.habitos[0].pausas).toHaveLength(1);
    expect(r.tarefas).toEqual([]);
    expect(r.diario.find((d: any) => d.data === "2026-10-01").humor).toBe(5);
    expect(r.diario).toHaveLength(2);
    expect(r.perfil.teto_mensal).toBe(3000);
    expect(r.financas.ordemBlocosFinancas).toEqual(["a"]);
    expect(aplicarPatches(r, p)).toEqual(r); // idempotente
  });

  it("reordenar", () => {
    const r = aplicarPatches({ habitos: [{ id: "a" }, { id: "b" }, { id: "c" }] } as any, [{ colecao: "habitos", op: "ordenar", ids: ["c", "a", "b"] }]);
    expect(r.habitos.map((h: any) => [h.id, h.ordem])).toEqual([["c", 0], ["a", 1], ["b", 2]]);
  });

  it("todas as ações novas estão no executor", () => {
    const txt = readFileSync("lib/offline/executarAcaoOffline.ts", "utf8");
    for (const a of ACOES_OFFLINE) expect(txt, a).toContain(`  ${a}: [`);
  });
});

describe("Etapa 355 — contas fixas do mês sem internet", () => {
  it("gera só o que falta, respeitando início, fim e pausa", () => {
    const snap = {
      financas: {
        recorrencias: [
          { id: "luz", dia_mes: 10, ativo: true },
          { id: "net", dia_mes: 31, ativo: true },
          { id: "pausada", dia_mes: 5, ativo: false },
          { id: "acabou", dia_mes: 5, ativo: true, data_fim: "2026-09-30" },
          { id: "futura", dia_mes: 5, ativo: true, data_inicio: "2026-11-01" },
          { id: "ja", dia_mes: 5, ativo: true },
        ],
        transacoes: [{ id: "t", recorrencia_id: "ja", data: "2026-10-05" }],
      },
    };
    const r = lancamentosRecorrentesQueFaltam(snap, "2026-10-20");
    expect(r.map((x) => [x.recorrencia.id, x.data])).toEqual([
      ["luz", "2026-10-10"],
      ["net", "2026-10-28"],
    ]);
  });
});

describe("Etapa 353 — gravarNoBanco no servidor", () => {
  const chamadas: any[] = [];
  beforeEach(() => {
    chamadas.length = 0;
    vi.resetModules();
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: () => ({
        auth: { getUser: async () => ({ data: { user: { id: "eu" } } }) },
        from: (t: string) => ({
          update: (v: any) => ({ eq: (_c: string, id: string) => ({ select: async () => (chamadas.push(["update", t, id, v]), { data: id === "sumiu" ? [] : [{ id }], error: null }) }) }),
          insert: async (v: any) => (chamadas.push(["insert", t, v]), { error: v.id === "dup" ? { code: "23505", message: "dup" } : null }),
          upsert: async (v: any, o: any) => (chamadas.push(["upsert", t, v, o]), { error: null }),
          delete: () => ({ eq: async (_c: string, id: string) => (chamadas.push(["delete", t, id]), { error: null }) }),
        }),
      }),
    }));
  });

  it("perfil sempre o da própria pessoa; 0 linhas = recusado; insert repetido = ok", async () => {
    const { gravarNoBanco } = await import("@/lib/offline/gravarNoBanco");
    expect(await gravarNoBanco({ tabela: "perfis", op: "update", id: "outra-pessoa", valores: { teto_mensal: 1 } })).toEqual({ sucesso: true });
    expect(chamadas[0]).toEqual(["update", "perfis", "eu", { teto_mensal: 1 }]);
    expect((await gravarNoBanco({ tabela: "tarefas", op: "update", id: "sumiu", valores: { data: "x" } })).erro).toBeTruthy();
    expect(await gravarNoBanco({ tabela: "metas_longas", op: "insert", valores: { id: "dup" } })).toEqual({ sucesso: true });
    expect((await gravarNoBanco({ tabela: "compartilhamentos", op: "insert", valores: {} } as any)).erro).toBeTruthy();
  });
});
