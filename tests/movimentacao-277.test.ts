import { describe, it, expect, vi } from "vitest";
vi.mock("@/lib/supabase/admin", () => ({ criarClienteAdmin: () => ({}) }));
vi.mock("@/lib/push/avisarUsuario", () => ({ avisarUsuario: async () => 1 }));
import { textoDoAviso } from "@/lib/financas/avisoMovimentacao";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

describe("Etapa 277 — aviso de movimentação", () => {
  it("gasto de hoje", () => {
    const t = textoDoAviso("Emerson", "Nubank", { acao: "lancou", tipo: "despesa", valor: 62.9, descricao: "Feira", data: "2026-10-08", hoje: "2026-10-08" }, "Mercado");
    expect(t.titulo).toBe("💸 Gasto na conta Nubank");
    expect(t.corpo).toContain("Emerson lançou Feira −R$");
    expect(t.corpo).toContain("62,90");
    expect(t.corpo).toContain("· Mercado");
  });
  it("receita agendada e parcelas", () => {
    const r = textoDoAviso("Ana", "Itaú", { acao: "lancou", tipo: "receita", valor: 3000, descricao: "Salário", data: "2026-10-15", hoje: "2026-10-08" });
    expect(r.titulo).toContain("Receita agendada");
    expect(r.corpo).toContain("pra 15/10");
    const p = textoDoAviso("Ana", "Itaú", { acao: "lancou", tipo: "despesa", valor: 1200, descricao: "TV", parcelas: 10 });
    expect(p.corpo).toContain("em 10x");
  });
  it("confirmações", () => {
    expect(textoDoAviso("Ana", "Itaú", { acao: "confirmou", tipo: "receita", valor: 3000, descricao: "Salário" }).titulo).toBe("💰 Caiu na conta Itaú");
    expect(textoDoAviso("Ana", "Itaú", { acao: "confirmou", tipo: "despesa", valor: 180, descricao: "Luz" }).corpo).toContain("marcou como pago: Luz");
  });
  it("novidades 277 no topo", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(277);
    expect(NOVIDADES.some((g) => g.versao === "277")).toBe(true);
  });
});
