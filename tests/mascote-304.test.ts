import { describe, it, expect, beforeAll } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

// o vitest daqui compila JSX no modo clássico: precisa do React global
(globalThis as any).React = React;
let Mascote: any;
beforeAll(async () => {
  Mascote = (await import("@/components/mascote/Mascote")).Mascote;
});
const desenhar = (p: any) => renderToStaticMarkup(React.createElement(Mascote, { cor: "verde", fase: 3, humor: "feliz", ...p }));

describe("Etapa 304 — mascote com volume e luz", () => {
  it("grande: filtro de luz; pequeno: só o sombreado (leve)", () => {
    const grande = desenhar({ tamanho: 200 });
    expect(grande).toContain("feSpecularLighting");
    expect(grande).toMatch(/filter="url\(#vtm-luz-/);
    const pequeno = desenhar({ tamanho: 70 });
    expect(pequeno).not.toMatch(/filter="url\(#vtm-luz-/);
    expect(pequeno).toContain("vtm-vol-");
    expect(desenhar({ tamanho: 200, volume: false })).not.toMatch(/filter="url\(#vtm-luz-/);
  });

  it("luz muda com a hora e o lugar ganha atmosfera", () => {
    expect(desenhar({ tamanho: 200, periodo: "entardecer" })).toContain("#FFB27A");
    expect(desenhar({ tamanho: 200, periodo: "noite" })).toContain("#A9BCFF");
    const lugar = desenhar({ tamanho: 200, comFundo: true, periodo: "manha" });
    expect(lugar).toContain("vtm-neblina-");
    expect(lugar).toContain("vtm-vinheta-");
    expect(lugar).toContain("vtm-raio-luz");
  });

  it("novidades 304", () => {
    expect(VERSAO_NOVIDADES).toBe("304");
    expect(NOVIDADES[0].versao).toBe("304");
  });
});
