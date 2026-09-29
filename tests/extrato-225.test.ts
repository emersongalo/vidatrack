import { describe, it, expect } from "vitest";
import { agruparPorDia, rotuloDoDia } from "@/lib/financas/agruparPorDia";

const HOJE = "2026-09-29";

describe("extrato por dia", () => {
  it("rótulos", () => {
    expect(rotuloDoDia(HOJE, HOJE)).toBe("Hoje");
    expect(rotuloDoDia("2026-09-28", HOJE)).toBe("Ontem");
    expect(rotuloDoDia("2026-09-30", HOJE)).toBe("Amanhã");
    expect(rotuloDoDia("2026-09-27", HOJE)).toMatch(/27/);
    expect(rotuloDoDia("2025-09-27", HOJE)).toMatch(/2025/);
  });
  it("agrupa em ordem e soma o dia sem transferência", () => {
    const g = agruparPorDia(
      [
        { data: "2026-09-28", tipo: "despesa", valor: 20 },
        { data: "2026-09-28", tipo: "despesa", valor: 60 },
        { data: "2026-09-27", tipo: "receita", valor: 12000 },
        { data: "2026-09-27", tipo: "despesa", valor: 250, transferencia_grupo: "g" },
      ],
      HOJE
    );
    expect(g.map((x) => [x.rotulo, x.itens.length, x.saldoDia])).toEqual([
      ["Ontem", 2, -80],
      [g[1].rotulo, 2, 12000],
    ]);
  });
});
