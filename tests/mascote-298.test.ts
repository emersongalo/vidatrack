import { describe, it, expect } from "vitest";
import {
  faseDoMascote,
  moedasDisponiveis,
  humorDoMascote,
  comprar,
  lerMascote,
  alternarEquipado,
  mascotePadrao,
} from "@/lib/mascote/mascote";
import { feitosDesdeSempre } from "@/lib/mascote/useMascote";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";
import { readFileSync } from "fs";

describe("Etapa 298 — mascote dos hábitos", () => {
  it("fases pelo total de hábitos feitos", () => {
    expect(faseDoMascote(0).nome).toBe("Ovinho");
    expect(faseDoMascote(5).nome).toBe("Filhote");
    expect(faseDoMascote(39).nome).toBe("Filhote");
    expect(faseDoMascote(40).nivel).toBe(2);
    expect(faseDoMascote(700).nome).toBe("Lendário");
    expect(faseDoMascote(700).proxima).toBeNull();
    const f = faseDoMascote(20);
    expect(f.faltam).toBe(20);
    expect(f.progresso).toBeCloseTo(15 / 35);
  });

  it("moedas = 10 por hábito menos o que gastou", () => {
    expect(moedasDisponiveis(12, 0)).toBe(120);
    expect(moedasDisponiveis(12, 100)).toBe(20);
    expect(moedasDisponiveis(1, 500)).toBe(0);
  });

  it("humor segue o dia", () => {
    expect(humorDoMascote(3, 3, 14)).toBe("radiante");
    expect(humorDoMascote(2, 3, 14)).toBe("feliz");
    expect(humorDoMascote(0, 3, 10)).toBe("neutro");
    expect(humorDoMascote(0, 3, 21)).toBe("triste");
    expect(humorDoMascote(0, 3, 23)).toBe("dormindo");
  });

  it("comprar confere fase e saldo e já veste", () => {
    const m = mascotePadrao("Bolota");
    expect(comprar(m, 3, { tipo: "item", id: "bone" })).toEqual({ ok: false, motivo: "Libera na fase Filhote" });
    expect(comprar(m, 5, { tipo: "item", id: "cartola" }).ok).toBe(false);
    const r = comprar(m, 10, { tipo: "item", id: "bone" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.mascote.gastos).toBe(60);
      expect(r.mascote.equipados.chapeu).toBe("bone");
      const tirou = alternarEquipado(r.mascote, "bone");
      expect(tirou.equipados.chapeu).toBeUndefined();
    }
    const cor = comprar(m, 20, { tipo: "cor", cor: "rosa" });
    expect(cor.ok && cor.mascote.cor).toBe("rosa");
    expect(comprar(m, 1, { tipo: "cor", cor: "lilas" }).ok).toBe(true);
  });

  it("lerMascote limpa dados estranhos", () => {
    expect(lerMascote(null)).toBeNull();
    expect(lerMascote({ cor: "verde" })).toBeNull();
    const m = lerMascote({ nome: "X", cor: "roxo", inventario: ["bone", 3], equipados: { chapeu: "bone", oculos: "escuros" }, gastos: "abc" });
    expect(m).toEqual({ nome: "X", cor: "verde", inventario: ["bone"], equipados: { chapeu: "bone" }, gastos: 0, criadoEm: undefined });
  });

  it("hábitos feitos: usa o total do servidor ou conta o retrato sem os negativos", () => {
    expect(feitosDesdeSempre({ perfil: { checkins_total: 42 } })).toBe(42);
    expect(
      feitosDesdeSempre({ perfil: {}, habitos: [{ id: "a" }, { id: "b", eh_negativo: true }], habitoCheckins: [{ habito_id: "a" }, { habito_id: "a" }, { habito_id: "b" }] })
    ).toBe(2);
  });

  it("CSS do mascote e novidades", () => {
    const css = readFileSync("app/globals.css", "utf8");
    for (const c of ["vtm-respira", "vtm-piscar", "vtm-ovo", "vtm-z", "vtm-brilha", "vtm-parado"]) expect(css).toContain(`.${c}`);
    expect(VERSAO_NOVIDADES).toBe("298");
    expect(NOVIDADES[0].versao).toBe("298");
  });
});
