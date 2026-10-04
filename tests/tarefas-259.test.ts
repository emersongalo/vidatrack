import { describe, it, expect } from "vitest";
import { agruparTarefas, grupoDaTarefa, proximaOcorrencia, resumoTarefas, rotuloData } from "@/lib/agenda/tarefasLista";

const HOJE = "2026-10-04"; // domingo
const t = (id: string, extra: any) => ({ id, titulo: id, repetir: "nenhuma", ...extra });

describe("tarefas por grupo", () => {
  it("única: atrasada, hoje, amanhã, semana, depois e concluída", () => {
    const vazio = new Set<string>();
    expect(grupoDaTarefa(t("a", { data: "2026-10-01" }), HOJE, vazio)).toBe("atrasadas");
    expect(grupoDaTarefa(t("b", { data: HOJE }), HOJE, vazio)).toBe("hoje");
    expect(grupoDaTarefa(t("c", { data: "2026-10-05" }), HOJE, vazio)).toBe("amanha");
    expect(grupoDaTarefa(t("d", { data: "2026-10-09" }), HOJE, vazio)).toBe("semana");
    expect(grupoDaTarefa(t("e", { data: "2026-11-20" }), HOJE, vazio)).toBe("depois");
    expect(grupoDaTarefa(t("f", { data: "2026-10-01", concluida: true }), HOJE, vazio)).toBe("concluidas");
  });
  it("repetida: próxima ocorrência e feita hoje continua em Hoje", () => {
    const seg = t("s", { repetir: "dias_semana", dias_semana: [1] });
    expect(proximaOcorrencia(seg, HOJE)).toBe("2026-10-05");
    expect(grupoDaTarefa(seg, HOJE, new Set())).toBe("amanha");
    const diaria = t("d", { repetir: "diaria" });
    const g = agruparTarefas([diaria], HOJE, new Set(["d"]));
    expect(g.get("hoje")![0]._feita).toBe(true);
  });
  it("resumo do topo", () => {
    const lista = [t("a", { data: "2026-10-01" }), t("b", { data: HOJE }), t("c", { data: HOJE, concluida: true }), t("d", { repetir: "diaria" })];
    expect(resumoTarefas(lista, HOJE, new Set(["d"]))).toEqual({ atrasadas: 1, deHoje: 3, feitasHoje: 2, semana: 0 });
    expect(rotuloData("2026-10-05", HOJE)).toBe("amanhã");
  });
});
