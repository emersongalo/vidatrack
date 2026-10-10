import { describe, it, expect } from "vitest";
import { normalizarErro, origemDoErro, telaDoErro, agruparErros } from "@/lib/app/erros";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

describe("Etapa 280 — monitor de erros", () => {
  it("junta erros que só mudam ids e números", () => {
    const a = "erro-js /financas/3f2a1b4c-1111-2222-3333-444455556666/editar: Falha 12345 [app]";
    const b = "erro-js /financas/aaaaaaaa-bbbb-cccc-dddd-eeeeffff0000/editar: Falha 999 [web]";
    expect(normalizarErro(a.replace(" [app]", ""))).toBe(normalizarErro(b.replace(" [web]", "")));
    const g = agruparErros([
      { pagina: a, criado_em: "2026-10-09T10:00:00Z" },
      { pagina: b, criado_em: "2026-10-09T12:00:00Z" },
    ]);
    expect(g).toHaveLength(1);
    expect(g[0]).toMatchObject({ total: 2, app: 1, web: 1, ultimo: "2026-10-09T12:00:00Z", primeiro: "2026-10-09T10:00:00Z" });
    expect(g[0].tela).toBe("/financas/:id/editar");
  });
  it("origem", () => {
    expect(origemDoErro("erro-http /x: 500 POST /x [app]")).toBe("http");
    expect(origemDoErro("erro-js /x: (promise) falhou")).toBe("promise");
    expect(origemDoErro("erro-js /x: TypeError")).toBe("js");
    expect(telaDoErro("erro-http /tarefas: 500")).toBe("/tarefas");
  });
  it("novidades 280", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(280);
    expect(NOVIDADES.some((g) => g.versao === "280")).toBe(true);
  });
});
