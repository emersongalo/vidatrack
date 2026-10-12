import { describe, it, expect } from "vitest";
import { lugaresDasPlantas } from "@/components/mascote/JardimIso";
import { jardimPessoal, plantaDoNivel, saudePeloUltimoDia } from "@/lib/mascote/jardimDados";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

describe("Etapa 307 — jardim pessoal isométrico", () => {
  it("cabe muitos hábitos (grade com caminho)", () => {
    for (const n of [9, 12, 16, 25, 36]) {
      const { tam, lugares } = lugaresDasPlantas(n);
      expect(lugares).toHaveLength(n);
      expect(new Set(lugares.map((l) => l.join(","))).size).toBe(n);
      for (const [x, y] of lugares) expect(x < tam && y < tam).toBe(true);
    }
  });

  it("nível vira desenho da planta", () => {
    expect(plantaDoNivel(1).estagio).toBe(0);
    expect(plantaDoNivel(6).estagio).toBe(5);
    expect(plantaDoNivel(7)).toMatchObject({ estagio: 6, frutifera: true });
    expect(plantaDoNivel(8).extra).toBe("floresta");
    expect(plantaDoNivel(10).extra).toBe("lenda");
  });

  it("murcha conforme os dias sem fazer", () => {
    expect(saudePeloUltimoDia("2026-10-11", "2026-10-11")).toBe(2);
    expect(saudePeloUltimoDia("2026-10-10", "2026-10-11")).toBe(2);
    expect(saudePeloUltimoDia("2026-10-08", "2026-10-11")).toBe(1);
    expect(saudePeloUltimoDia("2026-10-01", "2026-10-11")).toBe(0);
    expect(saudePeloUltimoDia(null, "2026-10-11")).toBe(1);
  });

  it("monta as plantas do retrato (sem hábito de parar)", () => {
    const s = {
      perfil: { id: "u" },
      habitos: [
        { id: "a", nome: "Água", meta_diaria: 1 },
        { id: "b", nome: "Parar de fumar", eh_negativo: true },
      ],
      habitoCheckins: [{ habito_id: "a", data: "2026-10-11", quantidade: 1 }],
    };
    const p = jardimPessoal(s, "2026-10-11");
    expect(p).toHaveLength(1);
    expect(p[0]).toMatchObject({ id: "a", regada: true, saude: 2, estagio: 0 });
  });

  it("novidades 307", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(307);
    expect(NOVIDADES.some((g) => g.versao === "307")).toBe(true);
  });
});
