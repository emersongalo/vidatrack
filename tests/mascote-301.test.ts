import { describe, it, expect } from "vitest";
import {
  ITENS,
  NOMES_SLOT,
  FASES,
  comprar,
  lerMascote,
  mascotePadrao,
  itensDoArmario,
  quantosNoArmario,
  salvarLook,
  usarLook,
  apagarLook,
  tirarTudo,
  mesmoLook,
  MAX_LOOKS,
} from "@/lib/mascote/mascote";
import { frenteMaisPerto } from "@/lib/mascote/useGiro";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

describe("Etapa 301 — armário, looks e itens novos", () => {
  it("catálogo: ids únicos, todo lugar tem nome, níveis válidos", () => {
    const ids = ITENS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ITENS.length).toBeGreaterThanOrEqual(50);
    for (const i of ITENS) {
      expect(NOMES_SLOT[i.slot]).toBeTruthy();
      expect(FASES[i.nivel]).toBeTruthy();
      expect(i.preco).toBeGreaterThan(0);
    }
    expect(ITENS.filter((i) => i.slot === "amigo").length).toBeGreaterThanOrEqual(5);
  });

  it("comprado vai pro armário, agrupado por lugar", () => {
    let m = mascotePadrao("Bolinha");
    for (const id of ["bone", "sorvete", "passarinho"]) {
      const r = comprar(m, 100, { tipo: "item", id });
      expect(r.ok).toBe(true);
      if (r.ok) m = r.mascote;
    }
    const cor = comprar(m, 100, { tipo: "cor", cor: "rosa" });
    if (cor.ok) m = cor.mascote;
    expect(quantosNoArmario(m)).toBe(3);
    expect(itensDoArmario(m).map((g) => g.slot)).toEqual(["chapeu", "mao", "amigo"]);
    expect(m.equipados).toEqual({ chapeu: "bone", mao: "sorvete", amigo: "passarinho" });
    expect(tirarTudo(m).equipados).toEqual({});
    expect(tirarTudo(m).inventario).toEqual(m.inventario);
  });

  it("looks: salva, usa, apaga e respeita o limite", () => {
    let m = { ...mascotePadrao(), inventario: ["bone", "cafe", "gorro"], equipados: { chapeu: "bone", mao: "cafe" } };
    m = salvarLook(m, "  Trabalho  ");
    expect(m.looks).toEqual([{ nome: "Trabalho", equipados: { chapeu: "bone", mao: "cafe" } }]);
    m = { ...m, equipados: { chapeu: "gorro" } };
    m = salvarLook(m, "");
    expect(m.looks![1].nome).toBe("Look 2");
    m = usarLook(m, 0);
    expect(mesmoLook(m.equipados, { mao: "cafe", chapeu: "bone" })).toBe(true);
    for (let i = 0; i < MAX_LOOKS + 2; i++) m = salvarLook(m, `L${i}`);
    expect(m.looks).toHaveLength(MAX_LOOKS);
    m = apagarLook(m, 0);
    expect(m.looks).toHaveLength(MAX_LOOKS - 1);
  });

  it("lerMascote guarda looks válidos e descarta o resto", () => {
    const m = lerMascote({
      nome: "X",
      cor: "verde",
      inventario: ["bone"],
      equipados: {},
      gastos: 60,
      looks: [{ nome: "A", equipados: { chapeu: "bone", mao: "cafe" } }, { semNome: true }, null],
    });
    expect(m!.looks).toEqual([{ nome: "A", equipados: { chapeu: "bone" } }]);
    expect(lerMascote({ nome: "Y", cor: "verde", inventario: [] })!.looks).toBeUndefined();
  });

  it("giro e novidades 301", () => {
    expect(frenteMaisPerto(190)).toBe(360);
    expect(VERSAO_NOVIDADES).toBe("301");
    expect(NOVIDADES[0].versao).toBe("301");
  });
});
