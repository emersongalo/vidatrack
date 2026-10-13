import { describe, it, expect } from "vitest";
import { dormindoNaHora, humorDoMascote, mascotePadrao, lerMascote, ITENS, moedasDisponiveis } from "@/lib/mascote/mascote";
import { ofertasDoDia, comprarNaFeira, precoNaFeira, ITENS_NA_FEIRA } from "@/lib/mascote/feira";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

const HOJE = "2026-10-13";

describe("Etapa 315 — sono, feirinha e mundo vivo", () => {
  it("hora de dormir vale das 23h às 6h", () => {
    expect([23, 0, 3, 5].every(dormindoNaHora)).toBe(true);
    expect([6, 12, 22].some(dormindoNaHora)).toBe(false);
    expect(humorDoMascote(1, 3, 2)).toBe("dormindo");
  });

  it("feirinha: 3 ofertas fixas pro dia, com desconto, só o que não tem e a fase libera", () => {
    const m = mascotePadrao("Bolota");
    const a = ofertasDoDia(m, 50, HOJE, "u1");
    const b = ofertasDoDia(m, 50, HOJE, "u1");
    expect(a.map((o) => o.item.id)).toEqual(b.map((o) => o.item.id));
    expect(a).toHaveLength(ITENS_NA_FEIRA);
    for (const o of a) {
      expect(o.item.nivel).toBeLessThanOrEqual(2); // 50 hábitos = fase Pequeno
      expect(o.preco).toBe(precoNaFeira(o.item));
      expect(o.preco).toBeLessThan(o.item.preco);
    }
    const outroDia = ofertasDoDia(m, 50, "2026-10-14", "u1").map((o) => o.item.id).join();
    const outraPessoa = ofertasDoDia(m, 50, HOJE, "u2").map((o) => o.item.id).join();
    expect(outroDia !== a.map((o) => o.item.id).join() || outraPessoa !== a.map((o) => o.item.id).join()).toBe(true);
  });

  it("comprar na feira: cobra o preço com desconto, equipa e a lista do dia não muda", () => {
    const m = mascotePadrao("Bolota");
    const feitos = 200;
    const ofertas = ofertasDoDia(m, feitos, HOJE, "u1");
    const alvo = ofertas[0];
    const r = comprarNaFeira(m, feitos, alvo.item.id, HOJE, "u1");
    if (!r.ok) throw new Error(r.motivo);
    expect(r.mascote.gastos).toBe(alvo.preco);
    expect(r.mascote.inventario).toContain(alvo.item.id);
    expect(r.mascote.equipados[alvo.item.slot]).toBe(alvo.item.id);
    const depois = ofertasDoDia(r.mascote, feitos, HOJE, "u1");
    expect(depois.map((o) => o.item.id)).toEqual(ofertas.map((o) => o.item.id));
    expect(depois[0].comprado).toBe(true);
    expect(comprarNaFeira(r.mascote, feitos, alvo.item.id, HOJE, "u1")).toEqual({ ok: false, motivo: "Já é seu" });
    const fora = ITENS.find((i) => !ofertas.some((o) => o.item.id === i.id))!;
    expect(comprarNaFeira(m, feitos, fora.id, HOJE, "u1").ok).toBe(false);
    expect(moedasDisponiveis(feitos, r.mascote.gastos)).toBe(feitos * 10 - alvo.preco);
    // sem moedas
    expect(comprarNaFeira(m, 0, ofertasDoDia(m, 0, HOJE, "u1")[0].item.id, HOJE, "u1").ok).toBe(false);
  });

  it("lerMascote guarda só o dia mais recente da feira", () => {
    const id = ITENS[0].id;
    const m = lerMascote({ ...mascotePadrao("B"), feira: { "2026-10-01": [id], [HOJE]: [id, "naoexiste"] } })!;
    expect(m.feira).toEqual({ [HOJE]: [id] });
  });

  it("novidades 315", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(315);
    expect(NOVIDADES.some((g) => g.versao === "315")).toBe(true);
  });
});
