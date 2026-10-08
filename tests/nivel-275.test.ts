import { describe, it, expect } from "vitest";
import { NIVEIS, nivelPorDias, diasFeitos, subiriaDeNivel } from "@/lib/habitos/nivel";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

describe("Etapa 275 — níveis dos hábitos", () => {
  it("começa como semente e sobe pelos marcos", () => {
    expect(nivelPorDias(0).atual.nome).toBe("Semente");
    expect(nivelPorDias(3).atual.numero).toBe(2);
    expect(nivelPorDias(6).atual.numero).toBe(2);
    expect(nivelPorDias(7).atual.numero).toBe(3);
    expect(nivelPorDias(400).atual.nome).toBe("Lenda");
    expect(nivelPorDias(400).proximo).toBeNull();
  });

  it("calcula quanto falta e o progresso", () => {
    const n = nivelPorDias(10); // entre 7 e 14
    expect(n.faltam).toBe(4);
    expect(n.progresso).toBeCloseTo(3 / 7);
  });

  it("conta só dias que bateram a meta", () => {
    const h = { id: "a", meta_diaria: 2 };
    const c = [
      { habito_id: "a", data: "2026-10-01", quantidade: 2 },
      { habito_id: "a", data: "2026-10-02", quantidade: 1 },
      { habito_id: "a", data: "2026-10-03", quantidade: 1 },
      { habito_id: "a", data: "2026-10-03", quantidade: 1 },
      { habito_id: "b", data: "2026-10-01", quantidade: 5 },
    ];
    expect(diasFeitos(h, c)).toBe(2);
  });

  it("avisa quando o próximo dia sobe de nível", () => {
    expect(subiriaDeNivel(2)?.numero).toBe(2);
    expect(subiriaDeNivel(3)).toBeNull();
    expect(subiriaDeNivel(364)?.nome).toBe("Lenda");
  });

  it("níveis em ordem crescente", () => {
    for (let i = 1; i < NIVEIS.length; i++) expect(NIVEIS[i].minimo).toBeGreaterThan(NIVEIS[i - 1].minimo);
  });

  it("novidades 275 no topo", () => {
    expect(NOVIDADES[0].versao).toBe(VERSAO_NOVIDADES);
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(275);
  });
});
