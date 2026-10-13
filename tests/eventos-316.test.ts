import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ACHADOS, iscasHoje, pescar, sortearAchado, venderDoBalde, lerPesca, progressoColecao, MAX_ISCAS_DIA } from "@/lib/mascote/pesca";
import { eventoDoDia, proximoEvento, progressoDoEvento, resgatarPremioEvento, itemNaLoja, premioResgatado } from "@/lib/mascote/eventos";
import { ITENS, mascotePadrao, lerMascote, comprar } from "@/lib/mascote/mascote";
import { ofertasDoDia } from "@/lib/mascote/feira";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

(globalThis as any).React = React;
const HOJE = "2026-10-25";

describe("Etapa 316 — pescaria e eventos", () => {
  it("iscas: 1 por hábito feito, até 5, menos o que já lançou", () => {
    const m = mascotePadrao("Bolota");
    expect(iscasHoje(m, 0, HOJE)).toBe(0);
    expect(iscasHoje(m, 3, HOJE)).toBe(3);
    expect(iscasHoje(m, 9, HOJE)).toBe(MAX_ISCAS_DIA);
    const r = pescar(m, 3, HOJE, true, "u")!;
    expect(iscasHoje(r.mascote, 3, HOJE)).toBe(2);
    expect(iscasHoje(r.mascote, 3, "2026-10-26")).toBe(3); // novo dia
    expect(pescar(m, 0, HOJE, true, "u")).toBeNull();
  });

  it("pegou vai pra coleção e balde; escapou só gasta a isca; vender dá moedas", () => {
    const m = mascotePadrao("Bolota");
    const fugiu = pescar(m, 5, HOJE, false, "u")!;
    expect(fugiu.achado).toBeNull();
    expect(fugiu.mascote.pesca?.vezes).toBe(1);
    let atual = m;
    const vistos: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = pescar(atual, 5, HOJE, true, "u")!;
      atual = r.mascote;
      vistos.push(r.achado!.id);
    }
    expect(Object.values(atual.pesca!.colecao!).reduce((a, b) => a + b, 0)).toBe(5);
    expect(progressoColecao(atual).achados).toBe(new Set(vistos).size);
    const vendavel = Object.keys(atual.pesca!.balde ?? {})[0];
    if (vendavel) {
      const v = venderDoBalde(atual, vendavel)!;
      expect(v.moedas).toBeGreaterThan(0);
      expect(v.mascote.bonus).toBe((atual.bonus ?? 0) + v.moedas);
      expect(v.mascote.pesca?.balde?.[vendavel]).toBeUndefined();
    }
  });

  it("sorteio respeita os pesos (comuns saem bem mais que lendários)", () => {
    const cont: Record<string, number> = {};
    for (let i = 0; i < 4000; i++) {
      const a = sortearAchado(`2026-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`, i, "u" + i);
      cont[a.raridade] = (cont[a.raridade] ?? 0) + 1;
    }
    expect(cont.comum).toBeGreaterThan(cont.lendario ?? 0);
    expect(cont.comum).toBeGreaterThan(cont.raro ?? 0);
    expect(new Set(ACHADOS.map((a) => a.id)).size).toBe(ACHADOS.length);
  });

  it("lerPesca limpa lixo", () => {
    expect(lerPesca({ dia: HOJE, vezes: 99, colecao: { lambari: 2, xx: 3 }, balde: { lambari: -1 } })).toEqual({ dia: HOJE, vezes: MAX_ISCAS_DIA, colecao: { lambari: 2 } });
    expect(lerMascote({ ...mascotePadrao("B"), pesca: { colecao: { polvo: 1 } }, eventos: ["halloween-2026", "x"] })).toMatchObject({ pesca: { colecao: { polvo: 1 } }, eventos: ["halloween-2026"] });
  });

  it("eventos por data, incluindo o Natal que vira o ano", () => {
    expect(eventoDoDia("2026-10-19")).toBeNull();
    expect(eventoDoDia("2026-10-20")).toMatchObject({ id: "halloween", chave: "halloween-2026", diasRestantes: 13 });
    expect(eventoDoDia("2026-12-25")?.chave).toBe("natal-2026");
    expect(eventoDoDia("2027-01-03")?.chave).toBe("natal-2026");
    expect(eventoDoDia("2027-01-07")).toBeNull();
    expect(proximoEvento("2026-10-13")).toMatchObject({ faltam: 7 });
  });

  it("prêmio do evento: conta hábitos no evento e resgata uma vez", () => {
    const ev = eventoDoDia(HOJE)!;
    const s = {
      habitos: [{ id: "a", meta_diaria: 1 }, { id: "n", meta_diaria: 1, eh_negativo: true }],
      habitoCheckins: [
        { habito_id: "a", data: "2026-10-19", quantidade: 1 }, // antes do evento
        ...Array.from({ length: 6 }, (_, i) => ({ habito_id: "a", data: `2026-10-${20 + i}`, quantidade: 1 })),
        { habito_id: "n", data: "2026-10-21", quantidade: 1 },
      ],
    };
    expect(progressoDoEvento(s, ev, HOJE)).toBe(6);
    const m = mascotePadrao("Bolota");
    expect(resgatarPremioEvento(m, ev, 6)).toBeNull();
    const r = resgatarPremioEvento(m, ev, 25)!;
    expect(r.inventario).toContain("abobora");
    expect(premioResgatado(r, ev)).toBe(true);
    expect(resgatarPremioEvento(r, ev, 30)).toBeNull();
  });

  it("loja: item de evento só no evento; prêmio nunca à venda; feira sem itens de evento", () => {
    const m = mascotePadrao("Bolota");
    const bruxa = ITENS.find((i) => i.id === "bruxa")!;
    const abobora = ITENS.find((i) => i.id === "abobora")!;
    expect(itemNaLoja(bruxa, m, HOJE)).toBe(true);
    expect(itemNaLoja(bruxa, m, "2026-12-01")).toBe(false);
    expect(itemNaLoja(abobora, m, HOJE)).toBe(false);
    expect(itemNaLoja(abobora, { ...m, inventario: ["abobora"] }, HOJE)).toBe(true);
    expect(comprar(m, 999, { tipo: "item", id: "abobora" })).toEqual({ ok: false, motivo: "Só como prêmio de evento" });
    for (let d = 1; d <= 28; d++) for (const o of ofertasDoDia(m, 999, `2026-10-${String(d).padStart(2, "0")}`, "u")) expect(o.item.evento).toBeUndefined();
  });

  it("itens de evento aparecem desenhados", async () => {
    const { Mascote } = await import("@/components/mascote/Mascote");
    const base = renderToStaticMarkup(React.createElement(Mascote, { cor: "verde", fase: 3, humor: "feliz", tamanho: 120, animado: false, volume: false }));
    for (const id of ["bruxa", "morcego", "vassoura", "abobora", "gorroNatal", "sinos", "bengala", "rena"]) {
      const it = ITENS.find((i) => i.id === id)!;
      const html = renderToStaticMarkup(React.createElement(Mascote, { cor: "verde", fase: 3, humor: "feliz", tamanho: 120, animado: false, volume: false, equipados: { [it.slot]: id } }));
      expect(html.length, id).toBeGreaterThan(base.length);
    }
  });

  it("novidades 316", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(316);
    expect(NOVIDADES.some((g) => g.versao === "316")).toBe(true);
  });
});
