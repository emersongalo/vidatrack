import { describe, expect, it } from "vitest";
import { alvoDoToque, caminho, chaoEm, ehSolido, gerarIlha, interacaoPerto, pontoDoAlvo } from "@/lib/mascote/rpg/ilhaRpg";

describe("Etapa 323 — ilha em RPG", () => {
  const m = gerarIlha();

  it("a ilha é sempre a mesma", () => {
    const b = gerarIlha();
    expect(b.chao).toEqual(m.chao);
    expect(b.decoracoes.length).toBe(m.decoracoes.length);
  });

  it("começa em chão livre, cercada de mar", () => {
    expect(ehSolido(m, m.inicio.x, m.inicio.y)).toBe(false);
    expect(chaoEm(m, 0, 0)).toBe("agua");
    expect(chaoEm(m, m.w - 1, m.h - 1)).toBe("agua");
  });

  it("dá pra andar até todas as portas e pessoas", () => {
    for (const c of m.construcoes) {
      expect(ehSolido(m, c.porta.x, c.porta.y), c.id).toBe(false);
      expect(caminho(m, m.inicio, c.porta), c.id).not.toBeNull();
    }
    for (const n of m.npcs) expect(caminho(m, m.inicio, n), n.id).not.toBeNull();
  });

  it("o píer entra no mar", () => {
    const pesca = m.construcoes.find((c) => c.id === "pesca")!;
    expect(chaoEm(m, pesca.porta.x, pesca.porta.y)).toBe("pier");
    expect(chaoEm(m, pesca.porta.x + 1, pesca.porta.y)).toBe("agua");
  });

  it("perto da porta, oferece entrar", () => {
    const casa = m.construcoes.find((c) => c.id === "casa")!;
    const i = interacaoPerto(m, casa.porta.x + 0.5, casa.porta.y + 0.5);
    expect(i?.tipo).toBe("lugar");
  });

  it("tocar na construção leva até a porta", () => {
    const loja = m.construcoes.find((c) => c.id === "lojinha")!;
    const a = alvoDoToque(m, loja.x + 1, loja.y + 1);
    expect(a?.tipo).toBe("lugar");
    expect(pontoDoAlvo(m, a!)).toEqual(loja.porta);
  });

  it("caminho não atravessa nada sólido", () => {
    const passos = caminho(m, m.inicio, { x: 10, y: 21 })!;
    for (const p of passos) expect(ehSolido(m, p.x, p.y)).toBe(false);
  });
});
