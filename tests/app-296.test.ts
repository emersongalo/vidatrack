import { describe, it, expect } from "vitest";
import { ehIphone } from "@/lib/app/appInstalado";

describe("Etapa 296 — iPhone", () => {
  it("reconhece iPhone pelo navegador", () => {
    expect(ehIphone("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15")).toBe(true);
    expect(ehIphone("Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36")).toBe(false);
  });
});
