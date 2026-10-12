import { describe, it, expect } from "vitest";
import { casaPadrao, comprarMovel, COMODOS, comodoPadrao, definirDesejo, lerCasa, MOVEIS, NOMES_CATEGORIA, progressoDoDesejo, desbloquearComodo, colocar } from "@/lib/mascote/casa";
import { BLOCOS_HOJE_PADRAO, lerLayoutHoje } from "@/lib/habitos/blocosHoje";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

describe("Etapa 308 — garagem, veículos e sonho", () => {
  it("catálogo novo: veículos, lazer e bichinhos, todos com categoria", () => {
    for (const cat of ["veiculo", "lazer", "pet"] as const) expect(MOVEIS.filter((m) => m.cat === cat).length).toBeGreaterThanOrEqual(4);
    for (const m of MOVEIS) expect(NOMES_CATEGORIA[m.cat]).toBeTruthy();
    expect(Math.max(...MOVEIS.map((m) => m.preco))).toBeGreaterThanOrEqual(10000); // sonho de longo prazo
  });

  it("garagem: liberar e estacionar o carro", () => {
    expect(COMODOS.find((c) => c.id === "garagem")?.preco).toBe(900);
    expect(comodoPadrao("garagem")).toEqual({ piso: "concreto", parede: "cinza", itens: [] });
    const g = desbloquearComodo(casaPadrao(), "garagem", 5000);
    if ("erro" in g) throw new Error(g.erro);
    const r = comprarMovel(g.casa, "carro", 5000);
    if ("erro" in r) throw new Error(r.erro);
    expect(colocar(r.casa, "garagem", "carro", 0, 0)).not.toBeNull();
  });

  it("sonho: progresso, quantos hábitos faltam e some ao comprar", () => {
    const c = definirDesejo(casaPadrao(), "moto");
    expect(progressoDoDesejo(c, 700)).toMatchObject({ faltam: 700, habitos: 70, pronto: false, progresso: 0.5 });
    expect(progressoDoDesejo(c, 2000)?.pronto).toBe(true);
    const r = comprarMovel(c, "moto", 2000);
    if ("erro" in r) throw new Error(r.erro);
    expect(r.casa.desejo).toBeUndefined();
    expect(progressoDoDesejo(r.casa, 2000)).toBeNull();
    expect(lerCasa({ desejo: "foguete", moveis: {}, comodos: {} })?.desejo).toBe("foguete");
    expect(lerCasa({ desejo: "nave", moveis: {}, comodos: {} })?.desejo).toBeUndefined();
    expect(definirDesejo(c, null).desejo).toBeUndefined();
  });

  it("jardim vira bloco da aba Hábitos (depois da lista)", () => {
    expect(BLOCOS_HOJE_PADRAO.indexOf("jardim")).toBe(BLOCOS_HOJE_PADRAO.indexOf("lista") + 1);
    expect(lerLayoutHoje(["lista"]).map((b) => b.id)).toContain("jardim");
  });

  it("novidades 308", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(308);
    expect(NOVIDADES.some((g) => g.versao === "308")).toBe(true);
  });
});
