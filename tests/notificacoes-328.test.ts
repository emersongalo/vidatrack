import { describe, it, expect } from "vitest";
import { inicioDosTitulosFeitos, tituloJaFeito } from "@/lib/notificacoes/limpar";

describe("Etapa 328 — some com o lembrete do que já foi feito", () => {
  const hoje = "2026-10-18";
  const snap = {
    habitos: [
      { id: "h1", nome: "Beber água", meta_diaria: 8 },
      { id: "h2", nome: "Meditar", meta_diaria: 1 },
      { id: "h3", nome: "Ler", meta_diaria: 1 },
    ],
    habitoCheckins: [
      { habito_id: "h1", data: hoje, quantidade: 8 },
      { habito_id: "h2", data: hoje, quantidade: 1 },
      { habito_id: "h3", data: "2026-10-17", quantidade: 1 },
    ],
    tarefas: [
      { id: "t1", titulo: "Pagar luz", repetir: "nenhuma", concluida: true },
      { id: "t2", titulo: "Lixo", repetir: "semanal" },
      { id: "t3", titulo: "Mercado", repetir: "nenhuma", concluida: false },
    ],
    conclusoesTarefas: [{ tarefa_id: "t2", data: hoje }],
  };
  const inicios = inicioDosTitulosFeitos(snap, hoje);

  it("hábito feito hoje (inclusive contador) sai da barra; o de ontem não", () => {
    expect(tituloJaFeito("🔔 Hora de: Meditar", inicios)).toBe(true);
    expect(tituloJaFeito("🔔 Beber água: 5 de 8 copos", inicios)).toBe(true);
    expect(tituloJaFeito("🔔 Hora de: Ler", inicios)).toBe(false);
  });

  it("tarefa concluída (única ou repetida hoje) sai; a pendente fica", () => {
    expect(tituloJaFeito("📝 Lembrete: Pagar luz", inicios)).toBe(true);
    expect(tituloJaFeito("📝 Lembrete: Lixo", inicios)).toBe(true);
    expect(tituloJaFeito("📝 Lembrete: Mercado", inicios)).toBe(false);
  });

  it("não mexe em outros avisos", () => {
    expect(tituloJaFeito("🌙 Falta só Ler hoje", inicios)).toBe(false);
    expect(tituloJaFeito(undefined, inicios)).toBe(false);
    expect(inicioDosTitulosFeitos(null, hoje)).toEqual([]);
  });
});
