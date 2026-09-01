import { describe, it, expect } from "vitest";
import { diaBateComFrequencia } from "@/lib/agenda/dias";

describe("diaBateComFrequencia", () => {
  it("hábito diário aparece em qualquer dia", () => {
    expect(diaBateComFrequencia("diaria", [], "2026-08-26")).toBe(true);
  });

  it("hábito de dias específicos só aparece nos dias marcados", () => {
    // 2026-08-26 é uma quarta-feira (dia 3 da semana)
    expect(diaBateComFrequencia("dias_semana", [3], "2026-08-26")).toBe(true);
    expect(diaBateComFrequencia("dias_semana", [1, 2], "2026-08-26")).toBe(false);
  });

  it("retorna falso para uma frequência desconhecida", () => {
    expect(diaBateComFrequencia("mensal", [], "2026-08-26")).toBe(false);
  });
});
