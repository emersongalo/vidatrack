import { describe, it, expect } from "vitest";
import { resumoDoDia, saudacao } from "@/lib/painel/seuDia";
import { PADRAO_PAINEL } from "@/lib/painel/cartoes";

const HOJE = "2026-09-29"; // terça

describe("seu dia", () => {
  it("conta hábitos e tarefas de hoje", () => {
    const s: any = {
      habitos: [
        { id: "a", nome: "Água", frequencia: "diaria", meta_diaria: 2, ordem: 1 },
        { id: "b", nome: "Ler", frequencia: "diaria", ordem: 0 },
        { id: "c", nome: "Academia", frequencia: "dias_semana", dias_semana: [1] }, // só segunda
        { id: "d", nome: "Fumar", frequencia: "diaria", eh_negativo: true },
      ],
      habitoCheckins: [
        { habito_id: "b", data: HOJE, quantidade: 1 },
        { habito_id: "a", data: HOJE, quantidade: 1 },
      ],
      tarefas: [
        { id: "t1", titulo: "Pagar luz", repetir: "nenhuma", data: HOJE, concluida: false },
        { id: "t2", titulo: "Feita", repetir: "nenhuma", data: HOJE, concluida: true },
        { id: "t3", titulo: "Amanhã", repetir: "nenhuma", data: "2026-09-30", concluida: false },
      ],
      conclusoesTarefas: [],
    };
    const r = resumoDoDia(s, HOJE);
    expect(r.habitos).toEqual({ total: 2, feitos: 1, pendentes: ["Água"] });
    expect(r.tarefas).toEqual({ total: 2, feitas: 1, pendentes: ["Pagar luz"] });
  });
  it("retrato vazio não quebra", () => {
    expect(resumoDoDia(null, HOJE)).toEqual({ habitos: { total: 0, feitos: 0, pendentes: [] }, tarefas: { total: 0, feitas: 0, pendentes: [] } });
  });
  it("saudação e padrão do resumo", () => {
    expect(saudacao(8)).toBe("Bom dia");
    expect(saudacao(14)).toBe("Boa tarde");
    expect(saudacao(21)).toBe("Boa noite");
    expect(PADRAO_PAINEL).not.toContain("habitos");
  });
});
