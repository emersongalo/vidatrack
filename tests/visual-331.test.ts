import { describe, it, expect } from "vitest";
import { ITENS } from "@/lib/mascote/mascote";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

describe("Etapa 331 — novidades do mascote", () => {
  it("itens novos na lojinha, sem id repetido", () => {
    const ids = ITENS.map((i) => i.id);
    for (const id of ["cowboy", "tiara", "coelho", "cracha", "camera", "pincel", "cofrinho", "gatinho", "coelhinho"]) expect(ids).toContain(id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("aviso de novidades atualizado", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(334);
    expect(NOVIDADES.some((g) => g.versao === "331")).toBe(true);
  });
});
