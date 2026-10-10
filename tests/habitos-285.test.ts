import { describe, it, expect } from "vitest";
import { lerLayoutHoje, BLOCOS_HOJE_PADRAO, NOMES_BLOCOS_HOJE } from "@/lib/habitos/blocosHoje";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

describe("Etapa 285 — aba Hábitos só com hábitos", () => {
  it("bloco de contas saiu (mesmo de quem tinha salvo)", () => {
    expect(BLOCOS_HOJE_PADRAO).not.toContain("contas" as any);
    const l = lerLayoutHoje(["contas", "!diario", "lista"]);
    expect(l.map((b) => b.id)).not.toContain("contas");
    expect(l[0]).toEqual({ id: "diario", visivel: false });
    expect(NOMES_BLOCOS_HOJE.lista).toBe("✅ Hábitos");
  });
  it("novidades 285", () => {
    expect(VERSAO_NOVIDADES).toBe("285");
    expect(NOVIDADES[0].versao).toBe("285");
  });
});
