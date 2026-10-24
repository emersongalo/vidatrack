import { describe, it, expect } from "vitest";
import { separarEmoji, juntarEmoji, sugerirEmoji, coresDasPessoas, urlGoogleMaps } from "@/lib/agenda/visual";

describe("Etapa 357 — agenda: emoji, cor da pessoa e mapa", () => {
  it("emoji no começo do título", () => {
    expect(separarEmoji("🎂 Aniversário da Su")).toEqual({ emoji: "🎂", texto: "Aniversário da Su" });
    expect(separarEmoji("🏋️ Academia")).toEqual({ emoji: "🏋️", texto: "Academia" });
    expect(separarEmoji("👨‍👩‍👧 Família")).toEqual({ emoji: "👨‍👩‍👧", texto: "Família" });
    expect(separarEmoji("Jantar")).toEqual({ emoji: null, texto: "Jantar" });
    expect(juntarEmoji("🍽️", "☕ Jantar")).toBe("🍽️ Jantar");
    expect(juntarEmoji(null, "☕ Jantar")).toBe("Jantar");
  });
  it("sugere emoji pelo título", () => {
    expect(sugerirEmoji("dentista amanhã")).toBe("🦷");
    expect(sugerirEmoji("Ensaio do louvor")).toBe("🎵");
    expect(sugerirEmoji("qualquer coisa", "aniversario")).toBe("🎂");
    expect(sugerirEmoji("xyz")).toBeNull();
  });
  it("cada pessoa tem uma cor, igual nos dois celulares", () => {
    const a = coresDasPessoas(["u-emerson", "u-suelyen"]);
    const b = coresDasPessoas(["u-suelyen", "u-emerson", "u-emerson"]);
    expect(a).toEqual(b);
    expect(a.get("u-emerson")).not.toBe(a.get("u-suelyen"));
  });
  it("link de mapa", () => {
    expect(urlGoogleMaps("Rua A, 10")).toContain("query=Rua%20A%2C%2010");
  });
});
