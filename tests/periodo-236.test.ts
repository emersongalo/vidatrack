import { describe, it, expect } from "vitest";
import { periodoDoDia, diasJuntosTexto } from "@/lib/painel/periodo";

describe("período do dia", () => {
  it("troca o céu conforme a hora", () => {
    expect(periodoDoDia(2)).toBe("madrugada");
    expect(periodoDoDia(5)).toBe("amanhecer");
    expect(periodoDoDia(12)).toBe("dia");
    expect(periodoDoDia(17)).toBe("entardecer");
    expect(periodoDoDia(18)).toBe("entardecer");
    expect(periodoDoDia(19)).toBe("noite");
    expect(periodoDoDia(23)).toBe("noite");
  });
  it("singular e plural", () => {
    expect(diasJuntosTexto(1)).toBe("1 dia junto");
    expect(diasJuntosTexto(0)).toBe("0 dias juntos");
  });
});
