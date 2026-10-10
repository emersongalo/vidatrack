import { describe, it, expect } from "vitest";
import { direcao } from "@/components/TransicaoPagina";
import { ritmoDaMeta, quandoChega, sugestaoSemanal } from "@/lib/financas/metas";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

describe("Etapa 278 — transições", () => {
  it("entrar desliza da direita, voltar da esquerda, trocar de área é fade", () => {
    expect(direcao("/tarefas", "/tarefas/abc")).toBe("avancar");
    expect(direcao("/tarefas/abc", "/tarefas")).toBe("voltar");
    expect(direcao("/habitos", "/financas")).toBe("fade");
    expect(direcao(null, "/financas")).toBe("fade");
  });
});

describe("Etapa 278 — metas", () => {
  it("ritmo por dia e semana", () => {
    const r = ritmoDaMeta({ valor_atual: 0, valor_alvo: 700, data_alvo: "2026-10-15" }, "2026-10-09");
    expect(r.dias).toBe(7);
    expect(r.porDia).toBe(100);
    expect(r.porSemana).toBe(700);
  });
  it("sem prazo: quando chega e sugestão", () => {
    expect(quandoChega({ valor_atual: 0, valor_alvo: 100 }, 50, "2026-10-09")).toBe("2026-10-23");
    expect(sugestaoSemanal(1300)).toBe(50);
    expect(sugestaoSemanal(10)).toBe(5);
  });
  it("novidades 278", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(278);
    expect(NOVIDADES.some((g) => g.versao === "278")).toBe(true);
  });
});
