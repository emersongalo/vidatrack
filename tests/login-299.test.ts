import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";

// Etapa 299 — sair de um aparelho não pode derrubar o login dos outros.
describe("Etapa 299 — sair só deste aparelho", () => {
  it("todo signOut de 'Sair' usa scope local", () => {
    for (const f of ["app/login/actions.ts", "components/BloqueioApp.tsx"]) {
      const s = readFileSync(f, "utf8");
      const chamadas = s.match(/auth\.signOut\([^)]*\)/g) ?? [];
      expect(chamadas.length).toBeGreaterThan(0);
      for (const c of chamadas) expect(c).toContain('scope: "local"');
    }
  });
});
