import { describe, it, expect } from "vitest";
import { lugaresDasPlantas } from "@/components/mascote/JardimIso";
import { dadosDoJardim } from "@/lib/mascote/jardimDados";
import { mascotePadrao } from "@/lib/mascote/mascote";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

const info = (extra: any = {}) => ({
  humor: "tranquilo",
  euFiz: false,
  parceiros: [{ id: "p1", nome: "Ana", feito: true }],
  sequencia: 0,
  recorde: 0,
  diasJuntos: 31,
  estagio: 5,
  proximoEstagioEm: 29,
  saude: 2,
  ultimos14: [],
  ...extra,
});

describe("Etapa 306 — jardim isométrico", () => {
  it("canteiros cabem no jardim e não se repetem", () => {
    for (let n = 1; n <= 8; n++) {
      const { tam, lugares } = lugaresDasPlantas(n);
      expect(lugares).toHaveLength(n);
      expect(new Set(lugares.map((l) => l.join(","))).size).toBe(n);
      for (const [x, y] of lugares) expect(x < tam && y < tam).toBe(true);
    }
  });

  it("monta plantas (com adubo e frutos) e mascotes sem repetir o par", () => {
    const meu = { ...mascotePadrao("Bolota", "lilas"), consumos: [{ d: "2026-10-01", t: "adubo", h: "h1" }] };
    const duplas: any[] = [
      { habito: { id: "h1", nome: "Caminhar" }, info: info() },
      { habito: { id: "h2", nome: "Orar" }, info: info({ diasJuntos: 2, parceiros: [{ id: "p1", nome: "Ana", feito: false }] }) },
    ];
    const pm = [{ usuario_id: "p1", mascote: { nome: "Pipoca", cor: "rosa", inventario: [] }, feitos: 50 }];
    const { plantas, mascotes } = dadosDoJardim(duplas, meu, 3, pm);
    expect(plantas[0].estagio).toBe(5); // 31 + 2 de adubo = 33 → flor
    expect(plantas[0].frutos).toBe(2); // 30 → 1, 33 → 2
    expect(plantas[0].regada).toBe(true);
    expect(plantas[1].estagio).toBe(1);
    expect(mascotes.map((m) => m.chave)).toEqual(["eu", "p1"]);
    expect(mascotes[1]).toMatchObject({ nome: "Ana", cor: "rosa", regou: true });
    // sem mascote ainda: ovinho
    expect(dadosDoJardim(duplas, null, 0, []).mascotes.every((m) => m.ovo)).toBe(true);
  });

  it("novidades 306", () => {
    expect(VERSAO_NOVIDADES).toBe("306");
    expect(NOVIDADES[0].versao).toBe("306");
  });
});
