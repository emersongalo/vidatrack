import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ITENS } from "@/lib/mascote/mascote";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

(globalThis as any).React = React;

const NOVOS = ["orelhas", "capacete", "sombrero", "viking", "nerd", "neon", "babador", "gravataSocial", "ouro", "pirulito", "pipoca", "raquete", "microfone", "joaninha", "abelha", "fantasma", "dragao"];

describe("Etapa 313 — bichinhos soltos e roupas novas", () => {
  it("itens novos no catálogo, sem id repetido", () => {
    const ids = ITENS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of NOVOS) expect(ids).toContain(id);
  });

  it("cada item novo aparece desenhado no mascote", async () => {
    const { Mascote } = await import("@/components/mascote/Mascote");
    const base = renderToStaticMarkup(React.createElement(Mascote, { cor: "verde", fase: 3, humor: "feliz", tamanho: 120, animado: false, volume: false }));
    for (const id of NOVOS) {
      const item = ITENS.find((i) => i.id === id)!;
      const html = renderToStaticMarkup(
        React.createElement(Mascote, { cor: "verde", fase: 3, humor: "feliz", tamanho: 120, animado: false, volume: false, equipados: { [item.slot]: id } })
      );
      expect(html.length, id).toBeGreaterThan(base.length);
    }
  });

  it("bichinho começa no quadradinho livre mais perto", async () => {
    const { livreMaisPerto, BICHOS_ANDAM } = await import("@/components/mascote/CasaIso");
    expect(BICHOS_ANDAM).toContain("cachorro");
    const livres: [number, number][] = [[0, 0], [3, 3], [2, 1], [5, 5]];
    expect(livreMaisPerto(livres, 2, 2)).toEqual([2, 1]);
    expect(livreMaisPerto(livres, 2, 2, new Set(["2,1"]))).toEqual([3, 3]);
    expect(livreMaisPerto([], 1, 1)).toBeNull();
  });

  it("novidades 313", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(313);
    expect(NOVIDADES.some((g) => g.versao === "313")).toBe(true);
  });
});
