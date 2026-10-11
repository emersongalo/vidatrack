import { describe, it, expect } from "vitest";
import { lerLayoutHoje, BLOCOS_HOJE_PADRAO, NOMES_BLOCOS_HOJE } from "@/lib/habitos/blocosHoje";
import { frenteMaisPerto, PALCO_HUMOR } from "@/components/mascote/PalcoMascote";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

describe("Etapa 300 — mascote girável na aba Hábitos", () => {
  it("mascote é o primeiro bloco, inclusive pra quem já tinha organizado", () => {
    expect(BLOCOS_HOJE_PADRAO[0]).toBe("mascote");
    expect(NOMES_BLOCOS_HOJE.mascote).toContain("Mascote");
    expect(lerLayoutHoje(["lista", "resumo"])[0].id).toBe("mascote");
    // quem escondeu ou mudou de lugar continua como deixou
    const l = lerLayoutHoje(["lista", "!mascote"]);
    expect(l[1]).toEqual({ id: "mascote", visivel: false });
  });
  it("depois do giro volta de frente pelo caminho mais curto", () => {
    expect(frenteMaisPerto(170)).toBe(0);
    expect(frenteMaisPerto(200)).toBe(360);
    expect(frenteMaisPerto(-500)).toBe(-360);
  });
  it("palco pra cada humor e novidades 300", () => {
    for (const h of ["radiante", "feliz", "neutro", "triste", "dormindo"] as const) expect(PALCO_HUMOR[h].rotulo).toBeTruthy();
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(300);
    expect(NOVIDADES.some((g) => g.versao === "300")).toBe(true);
  });
});
