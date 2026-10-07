import { describe, it, expect } from "vitest";
import { ehEmoji, EMOJIS_CATEGORIA, EMOJIS_HABITO } from "@/lib/geral/emojis";
import { ICONES_CATEGORIA, MAPA_ICONES_CATEGORIA } from "@/lib/financas/icones-categoria";
import { ICONES_HABITO, MAPA_ICONES_HABITO } from "@/lib/agenda/icones-habito";

describe("Etapa 272 — ícones e emojis", () => {
  it("diferencia nome de ícone de emoji", () => {
    expect(ehEmoji("Utensils")).toBe(false);
    expect(ehEmoji("Gamepad2")).toBe(false);
    expect(ehEmoji("🍔")).toBe(true);
    expect(ehEmoji("👨‍👩‍👧")).toBe(true);
    expect(ehEmoji("")).toBe(false);
    expect(ehEmoji(null)).toBe(false);
  });

  it("não tem ícone repetido nem faltando", () => {
    expect(MAPA_ICONES_CATEGORIA.size).toBe(ICONES_CATEGORIA.length);
    expect(MAPA_ICONES_HABITO.size).toBe(ICONES_HABITO.length);
    for (const i of [...ICONES_CATEGORIA, ...ICONES_HABITO]) expect(i.Icone).toBeTruthy();
  });

  it("mantém os ícones que já estão salvos no banco", () => {
    for (const n of ["Utensils", "PiggyBank", "Home", "Car", "Wallet", "Package"]) expect(MAPA_ICONES_CATEGORIA.has(n)).toBe(true);
    for (const n of ["Droplet", "Footprints", "BookOpen", "Flower2", "Moon", "NotebookPen", "Sparkles"]) expect(MAPA_ICONES_HABITO.has(n)).toBe(true);
  });

  it("todo emoji da lista é reconhecido como emoji", () => {
    for (const g of [...EMOJIS_CATEGORIA, ...EMOJIS_HABITO]) for (const e of g.emojis) expect(ehEmoji(e)).toBe(true);
  });
});
