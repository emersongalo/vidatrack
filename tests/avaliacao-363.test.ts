import { describe, it, expect } from "vitest";
import { estadoInicial, registrarDia, podePedir, marcarPedido } from "@/lib/app/avaliacao";

const DIA = 86400000;
describe("Etapa 363 — pedir avaliação na hora certa", () => {
  it("só depois de 5 dias de uso e 7 dias do 1º uso; no máximo a cada 120 dias e 3 vezes", () => {
    const t0 = Date.parse("2026-10-01T12:00:00Z");
    let e = estadoInicial(t0);
    for (const d of ["2026-10-01", "2026-10-02", "2026-10-02", "2026-10-04"]) e = registrarDia(e, d);
    expect(e.dias).toHaveLength(3);
    expect(podePedir(e, t0 + 8 * DIA)).toBe(false); // poucos dias de uso
    e = registrarDia(registrarDia(e, "2026-10-05"), "2026-10-06");
    expect(podePedir(e, t0 + 5 * DIA)).toBe(false); // menos de 7 dias
    expect(podePedir(e, t0 + 8 * DIA)).toBe(true);
    e = marcarPedido(e, t0 + 8 * DIA);
    expect(podePedir(e, t0 + 60 * DIA)).toBe(false);
    expect(podePedir(e, t0 + 130 * DIA)).toBe(true);
    e = marcarPedido(marcarPedido(e, t0 + 130 * DIA), t0 + 260 * DIA);
    expect(podePedir(e, t0 + 999 * DIA)).toBe(false); // já foram 3
  });
});
