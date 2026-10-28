import { describe, expect, it } from "vitest";
import { contaEhCompartilhada, filtrarPorEscopo, temOsDoisTipos } from "@/lib/financas/escopo";

const eu = "eu";
const contas = [
  { id: "itau", dono_id: eu, compartilhada: true },
  { id: "nubank", dono_id: eu, compartilhada: false },
  { id: "inter", dono_id: "ela", compartilhada: true },
];
const snap = {
  perfil: { id: eu },
  financas: {
    contas,
    transacoes: [
      { id: "1", conta_id: "itau" },
      { id: "2", conta_id: "nubank" },
      { id: "3", conta_id: "inter" },
    ],
    recorrencias: [{ id: "r1", conta_id: "nubank" }, { id: "r2", conta_id: "itau" }],
    categorias: [{ id: "c" }],
  },
};

describe("Etapa 367 — compartilhada x particular", () => {
  it("conta de outra pessoa é sempre compartilhada", () => {
    expect(contaEhCompartilhada({ id: "x", dono_id: "ela" }, eu)).toBe(true);
    expect(contaEhCompartilhada({ id: "x", dono_id: eu, compartilhada: false }, eu)).toBe(false);
  });
  it("só separa quando tem dos dois tipos", () => {
    expect(temOsDoisTipos(contas, eu)).toBe(true);
    expect(temOsDoisTipos([contas[0], contas[2]], eu)).toBe(false);
  });
  it("Meu mostra só a particular, com lançamentos e contas fixas dela", () => {
    const s = filtrarPorEscopo(snap as any, "meu") as any;
    expect(s.financas.contas.map((c: any) => c.id)).toEqual(["nubank"]);
    expect(s.financas.transacoes.map((t: any) => t.id)).toEqual(["2"]);
    expect(s.financas.recorrencias.map((r: any) => r.id)).toEqual(["r1"]);
    expect(s.financas.categorias).toHaveLength(1);
  });
  it("Compartilhada mostra as compartilhadas (minhas e dela)", () => {
    const s = filtrarPorEscopo(snap as any, "compartilhada") as any;
    expect(s.financas.contas.map((c: any) => c.id)).toEqual(["itau", "inter"]);
    expect(s.financas.transacoes.map((t: any) => t.id)).toEqual(["1", "3"]);
  });
  it("Tudo não mexe", () => {
    expect(filtrarPorEscopo(snap as any, "tudo")).toBe(snap);
  });
});
