import { describe, it, expect } from "vitest";
import { duplasDoRetrato } from "@/lib/habitos/dupla";

describe("duplas do retrato (Painel)", () => {
  it("só entra hábito com parceiro, com o check-in de cada um separado", () => {
    const s = {
      perfil: { id: "eu" },
      habitos: [
        { id: "h1", nome: "Bíblia", frequencia: "diaria", criado_em: "2026-01-01" },
        { id: "h2", nome: "Correr", frequencia: "diaria", criado_em: "2026-01-01" },
      ],
      habitoCheckins: [{ habito_id: "h1", data: "2026-09-30", quantidade: 1, usuario_id: "eu" }],
      checkinsCompartilhados: [{ habito_id: "h1", data: "2026-09-30", quantidade: 1, usuario_id: "ana" }],
      parceiros: [{ habito_id: "h1", usuario_id: "ana", nome: "Ana" }],
    };
    const r = duplasDoRetrato(s, "2026-09-30", 10);
    expect(r).toHaveLength(1);
    expect(r[0].habito.nome).toBe("Bíblia");
    expect(r[0].info.humor).toBe("festa");
    expect(duplasDoRetrato({ ...s, parceiros: [] }, "2026-09-30", 10)).toEqual([]);
    expect(duplasDoRetrato(null, "2026-09-30", 10)).toEqual([]);
  });
});
