import { describe, it, expect } from "vitest";
import { ultimosDias } from "@/lib/habitos/detalhe";
import { lerLimite, usoDoLimite } from "@/lib/financas/limite";
import { suavizar, valorNaContagem } from "@/lib/app/contagem";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

describe("ultimosDias", () => {
  it("7 dias do mais antigo pro mais novo, com folga antes de criar", () => {
    const h = { id: "h", frequencia: "diaria", meta_diaria: 2, criado_em: "2026-09-25T10:00:00Z" } as any;
    const c = [
      { habito_id: "h", data: "2026-09-26", quantidade: 2 },
      { habito_id: "h", data: "2026-09-27", quantidade: 1 },
      { habito_id: "x", data: "2026-09-28", quantidade: 5 },
    ];
    const r = ultimosDias(h, c as any, "2026-09-28");
    expect(r).toHaveLength(7);
    expect(r[0].dia).toBe("2026-09-22");
    expect(r[6].dia).toBe("2026-09-28");
    expect(r.map((d) => d.estado)).toEqual(["folga", "folga", "folga", "falhou", "feito", "falhou", "falhou"]);
  });
});

describe("limite do cartão", () => {
  it("lê o valor digitado", () => {
    expect(lerLimite("5.000,00")).toBe(5000);
    expect(lerLimite("R$ 1.234,5")).toBe(1234.5);
    expect(lerLimite("2500")).toBe(2500);
    expect(lerLimite("")).toBeNull();
    expect(lerLimite(null)).toBeNull();
    expect(lerLimite("0")).toBeNull();
    expect(lerLimite("abc")).toBeNull();
  });
  it("calcula uso e disponível", () => {
    expect(usoDoLimite(1500, 5000)).toEqual({ usado: 1500, disponivel: 3500, pct: 30 });
    expect(usoDoLimite(6000, 5000)).toEqual({ usado: 6000, disponivel: 0, pct: 100 });
    expect(usoDoLimite(-10, 1000)).toEqual({ usado: 0, disponivel: 1000, pct: 0 });
    expect(usoDoLimite(100, null)).toBeNull();
  });
});

describe("contagem animada", () => {
  it("começa no valor antigo, termina no novo", () => {
    expect(suavizar(0)).toBe(0);
    expect(suavizar(1)).toBe(1);
    expect(suavizar(0.5)).toBeGreaterThan(0.5);
    expect(valorNaContagem(0, 100, 0)).toBe(0);
    expect(valorNaContagem(0, 100, 600)).toBe(100);
    expect(valorNaContagem(100, 0, 9999)).toBe(0);
    const meio = valorNaContagem(0, 100, 300);
    expect(meio).toBeGreaterThan(50);
    expect(meio).toBeLessThan(100);
  });
});

describe("novidades 230", () => {
  it("grupo da 230 continua na lista e o topo é a versão atual", () => {
    expect(NOVIDADES.some((g) => g.versao === "230")).toBe(true);
    expect(NOVIDADES[0].versao).toBe(VERSAO_NOVIDADES);
  });
});
