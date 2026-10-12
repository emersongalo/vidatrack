import { describe, it, expect } from "vitest";
import {
  casaPadrao,
  colocar,
  comprarMovel,
  desbloquearComodo,
  girar,
  guardados,
  guardar,
  lerCasa,
  mover,
  MOVEIS,
  podeColocar,
  usarEstilo,
  movel,
  type Casa,
} from "@/lib/mascote/casa";
import { lerMascote } from "@/lib/mascote/mascote";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

function com(ids: string[]): Casa {
  let c = casaPadrao();
  for (const id of ids) {
    const r = comprarMovel(c, id, 99999);
    if ("erro" in r) throw new Error(r.erro);
    c = r.casa;
  }
  return c;
}

describe("Etapa 305 — casa do mascote", () => {
  it("catálogo com ids únicos e tamanhos válidos", () => {
    const ids = MOVEIS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(MOVEIS.length).toBeGreaterThanOrEqual(30);
    for (const m of MOVEIS) expect(m.w * m.d).toBeGreaterThan(0);
  });

  it("comprar, colocar, não sobrepor, mover, girar e guardar", () => {
    let c = com(["cama", "criado", "tapete"]);
    expect(comprarMovel(casaPadrao(), "cama", 10)).toEqual({ erro: "Faltam 170 🪙" });
    c = colocar(c, "quarto", "cama", 0, 0)!;
    expect(c.comodos.quarto!.itens).toHaveLength(1);
    expect(guardados(c, "cama")).toBe(0);
    expect(colocar(c, "quarto", "cama", 3, 3)).toBeNull(); // só tinha 1
    expect(colocar(c, "quarto", "criado", 1, 0)).toBeNull(); // em cima da cama
    expect(colocar(c, "quarto", "criado", 5, 5, 0)).not.toBeNull();
    // tapete fica por baixo (pode ter móvel em cima)
    c = colocar(c, "quarto", "tapete", 0, 0)!;
    expect(c).not.toBeNull();
    const u = c.comodos.quarto!.itens[0].u;
    expect(mover(c, "quarto", u, 5, 0)).toBeNull(); // 2×1 não cabe na beirada
    c = mover(c, "quarto", u, 3, 2)!;
    c = girar(c, "quarto", u)!;
    expect(c.comodos.quarto!.itens.find((i) => i.u === u)?.r).toBe(1);
    c = guardar(c, "quarto", u);
    expect(guardados(c, "cama")).toBe(1);
  });

  it("enfeite de parede só encostado na parede e nunca no quintal", () => {
    const q = casaPadrao().comodos.quarto!;
    expect(podeColocar(q, movel("quadro")!, 0, 3, 0, "quarto")).toBe(true);
    expect(podeColocar(q, movel("quadro")!, 2, 2, 0, "quarto")).toBe(false);
    expect(podeColocar(q, movel("quadro")!, 0, 3, 0, "quintal")).toBe(false);
  });

  it("cômodos e estilos custam moedas; quintal só com piso de fora", () => {
    const c = casaPadrao();
    expect(desbloquearComodo(c, "sala", 100)).toEqual({ erro: "Faltam 200 🪙" });
    const r = desbloquearComodo(c, "quintal", 1000);
    if ("erro" in r) throw new Error();
    expect(r.custo).toBe(600);
    expect(usarEstilo(r.casa, "quintal", "madeira", 999)).toEqual({ erro: "Esse piso é de dentro de casa" });
    const e = usarEstilo(r.casa, "quarto", "xadrez", 999);
    if ("erro" in e) throw new Error();
    expect(e.custo).toBe(120);
    const de = usarEstilo(e.casa, "quarto", "xadrez", 0);
    expect("erro" in de ? de.erro : de.custo).toBe(0); // já é seu
  });

  it("lerCasa descarta móvel sobrando ou fora do lugar", () => {
    const c = lerCasa({
      moveis: { cama: 1, xyz: 3 },
      estilos: ["xadrez", "nada"],
      comodos: {
        quarto: { piso: "xadrez", parede: "menta", itens: [{ u: "a", m: "cama", x: 0, y: 0, r: 0 }, { u: "b", m: "cama", x: 2, y: 2, r: 0 }, { u: "c", m: "sofa", x: 1, y: 1, r: 0 }] },
        porao: { itens: [] },
      },
    })!;
    expect(c.moveis).toEqual({ cama: 1 });
    expect(c.estilos).toEqual(["xadrez"]);
    expect(c.comodos.quarto!.itens.map((i) => i.u)).toEqual(["a"]);
    expect(lerMascote({ nome: "X", cor: "verde", inventario: [], casa: { moveis: {}, comodos: {} } })!.casa?.comodos.quarto).toBeTruthy();
  });

  it("novidades 305", () => {
    expect(VERSAO_NOVIDADES).toBe("305");
    expect(NOVIDADES[0].versao).toBe("305");
  });
});
