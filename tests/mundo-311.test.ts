import { describe, it, expect } from "vitest";
import { infoDupla, precisaParaContar, MAX_PESSOAS_GRUPO, somarDias } from "@/lib/habitos/dupla";
import { limitarZoom, zoomNoPonto } from "@/lib/app/zoom";
import { listarConquistas, MONUMENTOS } from "@/lib/mascote/conquistas";
import { MONUMENTOS_NA_ILHA, estadosDosMonumentos } from "@/lib/mascote/ilha";
import { mascotePadrao } from "@/lib/mascote/mascote";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

const HOJE = "2026-10-12";
const h = { id: "h", nome: "Caminhar", meta_diaria: 1, frequencia: "diaria", criado_em: "2026-01-01" };
const ck = (u: string, d: string) => ({ habito_id: "h", data: d, quantidade: 1, usuario_id: u });
const FAMILIA = ["a", "b", "c", "d", "e"].map((id) => ({ id, nome: id.toUpperCase() }));

describe("Etapa 311 — família, zoom e monumentos", () => {
  it("quantos precisam pra contar o dia", () => {
    expect(MAX_PESSOAS_GRUPO).toBe(6);
    expect(precisaParaContar(2)).toBe(2);
    expect(precisaParaContar(3)).toBe(2);
    expect(precisaParaContar(6)).toBe(3);
  });

  it("família de 6: com metade fazendo a planta cresce", () => {
    const ontem = somarDias(HOJE, -1);
    const c = [ck("eu", ontem), ck("a", ontem), ck("b", ontem), ck("eu", HOJE), ck("a", HOJE)];
    const r = infoDupla(h, c, "eu", FAMILIA, HOJE, 10);
    expect(r.grupo).toEqual({ feitosHoje: 2, total: 6, precisa: 3 });
    expect(r.diasJuntos).toBe(1); // ontem: 3 de 6
    expect(r.humor).toBe("esperandoParceiro");
    const r2 = infoDupla(h, [...c, ck("c", HOJE)], "eu", FAMILIA, HOJE, 10);
    expect(r2.humor).toBe("festa");
    expect(r2.diasJuntos).toBe(2);
    expect(r2.sequencia).toBe(2);
  });

  it("dupla continua precisando dos dois", () => {
    const r = infoDupla(h, [ck("eu", HOJE)], "eu", [FAMILIA[0]], HOJE, 10);
    expect(r.diasJuntos).toBe(0);
    expect(r.grupo).toEqual({ feitosHoje: 1, total: 2, precisa: 2 });
  });

  it("zoom: limites e ponto fixo", () => {
    expect(limitarZoom({ s: 0.5, x: 10, y: 10 }, 300, 200)).toEqual({ s: 1, x: 0, y: 0 });
    expect(limitarZoom({ s: 9, x: -5000, y: 0 }, 300, 200, 3)).toEqual({ s: 3, x: -600, y: 0 });
    const v = zoomNoPonto({ s: 1, x: 0, y: 0 }, 2, 100, 50);
    expect(v).toEqual({ s: 2, x: -100, y: -50 }); // o ponto (100,50) continua no mesmo lugar
  });

  it("todo monumento tem lugar na ilha, sem dois no mesmo lugar", () => {
    const l = listarConquistas({ habitos: [], habitoCheckins: [] }, mascotePadrao("Bolota"), 0);
    for (const c of l) {
      expect(MONUMENTOS[c.id]).toBeTruthy();
      expect(MONUMENTOS_NA_ILHA[c.id]).toBeTruthy();
    }
    const tiles = new Set<string>();
    for (const [x, y, w, d] of Object.values(MONUMENTOS_NA_ILHA))
      for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
        const k = `${Math.floor(x + i)},${Math.floor(y + j)}`;
        expect(tiles.has(k)).toBe(false);
        tiles.add(k);
      }
    const m = { ...mascotePadrao("Bolota"), conquistas: ["h1"] };
    const est = estadosDosMonumentos(listarConquistas({ habitos: [], habitoCheckins: [] }, m, 60));
    expect(est.h1).toBe("feito");
    expect(est.h50).toBe("pronto");
    expect(est.h1000).toBe("travado");
  });

  it("novidades 311", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(311);
    expect(NOVIDADES.some((g) => g.versao === "311")).toBe(true);
  });
});
