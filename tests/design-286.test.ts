import { describe, it, expect } from "vitest";
import { ceuDaHora } from "@/components/HeroHoje";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

describe("Etapa 286 — design e animação", () => {
  it("céu do topo conforme a hora", () => {
    expect(ceuDaHora(8).astro).toBe("☀️");
    expect(ceuDaHora(15).astro).toBe("🌤️");
    expect(ceuDaHora(21)).toMatchObject({ astro: "🌙", estrelas: true });
    expect(ceuDaHora(3).estrelas).toBe(true);
    expect(ceuDaHora(null).astro).toBe("🌿");
  });
  it("novidades 286", () => {
    expect(VERSAO_NOVIDADES).toBe("286");
    expect(NOVIDADES[0].versao).toBe("286");
  });
});
