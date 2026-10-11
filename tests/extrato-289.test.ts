import { describe, it, expect } from "vitest";
import { ordenarComoBanco, agruparPorDia } from "@/lib/financas/agruparPorDia";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

const HOJE = "2026-10-10";
const t = (id: string, data: string, criado = "") => ({ id, data, criado_em: criado, tipo: "despesa", valor: 10 });

describe("Etapa 289 — extrato na ordem do banco", () => {
  it("hoje primeiro, depois ontem e anteriores; agendados à parte, do mais próximo", () => {
    const { passados, futuros } = ordenarComoBanco(
      [
        t("a", "2026-10-25"),
        t("b", "2026-10-08"),
        t("c", "2026-10-10", "2026-10-10T08:00:00Z"),
        t("d", "2026-10-12"),
        t("e", "2026-10-10", "2026-10-10T19:00:00Z"),
        t("f", "2026-10-09"),
      ],
      HOJE
    );
    expect(passados.map((x) => x.id)).toEqual(["e", "c", "f", "b"]);
    expect(futuros.map((x) => x.id)).toEqual(["d", "a"]);
  });
  it("agrupa o mesmo dia mesmo fora de ordem", () => {
    const g = agruparPorDia([t("1", "2026-10-10"), t("2", "2026-10-09"), t("3", "2026-10-10")], HOJE);
    expect(g.map((x) => [x.rotulo, x.itens.length])).toEqual([
      ["Hoje", 2],
      ["Ontem", 1],
    ]);
  });
  it("novidades 289", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(289);
    expect(NOVIDADES.some((g) => g.versao === "289")).toBe(true);
  });
});
