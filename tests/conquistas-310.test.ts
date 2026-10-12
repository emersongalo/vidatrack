import { describe, it, expect } from "vitest";
import { listarConquistas, resgatarConquista, conquistasProntas, melhorSequencia } from "@/lib/mascote/conquistas";
import { missoesDoDia, resgatarMissao } from "@/lib/mascote/missoes";
import { mascotePadrao, lerMascote } from "@/lib/mascote/mascote";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";
import { somarDiasISO } from "@/lib/mascote/mascote";

const HOJE = "2026-10-12";
const retrato = (dias: number) => ({
  perfil: { id: "u" },
  habitos: [{ id: "a", nome: "Água", meta_diaria: 1, frequencia: "diaria", criado_em: "2026-01-01" }],
  habitoCheckins: Array.from({ length: dias }, (_, i) => ({ habito_id: "a", data: somarDiasISO(HOJE, -i), quantidade: 1 })),
  tarefas: [],
  conclusoesTarefas: [],
  diario: [],
});

describe("Etapa 310 — conquistas e mundo", () => {
  it("lista 20 conquistas com progresso", () => {
    const l = listarConquistas(retrato(8), mascotePadrao("Bolota"), 8);
    expect(l).toHaveLength(20);
    expect(new Set(l.map((c) => c.id)).size).toBe(20);
    expect(l.find((c) => c.id === "h1")).toMatchObject({ alcancada: true, resgatada: false });
    expect(l.find((c) => c.id === "h50")).toMatchObject({ atual: 8, alcancada: false });
    expect(l.find((c) => c.id === "s7")!.alcancada).toBe(true);
    expect(melhorSequencia(retrato(8))).toBe(8);
    expect(conquistasProntas(l)).toBeGreaterThanOrEqual(2);
  });

  it("resgatar dá o prêmio uma vez só", () => {
    const m = mascotePadrao("Bolota");
    const l = listarConquistas(retrato(1), m, 1);
    const h1 = l.find((c) => c.id === "h1")!;
    const r = resgatarConquista(m, h1)!;
    expect(r.bonus).toBe((m.bonus ?? 0) + h1.premio);
    expect(r.conquistas).toEqual(["h1"]);
    const l2 = listarConquistas(retrato(1), r, 1);
    expect(l2.find((c) => c.id === "h1")!.resgatada).toBe(true);
    expect(resgatarConquista(r, l2.find((c) => c.id === "h1")!)).toBeNull();
    expect(resgatarConquista(m, l.find((c) => c.id === "h1000")!)).toBeNull();
  });

  it("resgatar missão conta no total de missões", () => {
    const m = mascotePadrao("Bolota");
    const s = { ...retrato(1), habitos: [...retrato(1).habitos] };
    const ms = missoesDoDia(s, HOJE, m);
    const r = resgatarMissao(m, ms[0], HOJE)!;
    expect(r.missoesTotal).toBe(1);
  });

  it("lerMascote guarda conquistas e missões totais", () => {
    const m = lerMascote({ ...mascotePadrao("Bolota"), conquistas: ["h1", 3, "s7"], missoesTotal: 12 })!;
    expect(m.conquistas).toEqual(["h1", "s7"]);
    expect(m.missoesTotal).toBe(12);
  });

  it("novidades 310", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(310);
    expect(NOVIDADES.some((g) => g.versao === "310")).toBe(true);
  });
});
