import { describe, it, expect } from "vitest";
import { interpretarRapido, ocorreNoDia, ocorrenciasEntre, lembretesNaJanela, menosMinutos, textoLembrete, proximaOcorrencia, diaDaSemanaISO, type Evento } from "@/lib/agenda/eventos";

const HOJE = "2026-10-23"; // sexta
const base = (x: Partial<Evento>): Evento => ({ id: "e", dono_id: "u", titulo: "Jantar", data: HOJE, repetir: "nenhuma", tipo: "evento", ...x });

describe("Etapa 341 — repetição", () => {
  it("hoje é sexta", () => expect(diaDaSemanaISO(HOJE)).toBe(5));
  it("semanal, quinzenal, mensal no dia 31, anual 29/02", () => {
    expect(ocorreNoDia(base({ repetir: "semanal" }), "2026-10-30")).toBe(true);
    expect(ocorreNoDia(base({ repetir: "semanal" }), "2026-10-29")).toBe(false);
    expect(ocorreNoDia(base({ repetir: "quinzenal" }), "2026-10-30")).toBe(false);
    expect(ocorreNoDia(base({ repetir: "quinzenal" }), "2026-11-06")).toBe(true);
    expect(ocorreNoDia(base({ data: "2026-01-31", repetir: "mensal" }), "2026-02-28")).toBe(true);
    expect(ocorreNoDia(base({ data: "2024-02-29", repetir: "anual" }), "2027-02-28")).toBe(true);
  });
  it("respeita fim e exceções", () => {
    const e = base({ repetir: "diaria", repetir_ate: "2026-10-25", excecoes: ["2026-10-24"] });
    expect(ocorrenciasEntre([e], HOJE, "2026-10-28").map((o) => o.dia)).toEqual(["2026-10-23", "2026-10-25"]);
  });
  it("próxima ocorrência do aniversário", () => {
    expect(proximaOcorrencia(base({ data: "1990-03-12", repetir: "anual", tipo: "aniversario" }), HOJE)).toBe("2027-03-12");
  });
});

describe("Etapa 341 — lembretes", () => {
  it("conta minutos voltando o dia", () => expect(menosMinutos("2026-10-24", "00:20", 30)).toBe("2026-10-23 23:50"));
  it("acha o lembrete de 1h antes dentro da janela de 5 min", () => {
    const e = base({ hora_inicio: "20:00", lembretes: [60, 1440] });
    expect(lembretesNaJanela([e], HOJE, "19:02").map((l) => l.minutos)).toEqual([60]);
    expect(lembretesNaJanela([e], HOJE, "19:10")).toEqual([]);
  });
  it("véspera de evento de amanhã e dia inteiro às 9h", () => {
    const e = base({ data: "2026-10-24", hora_inicio: "20:00", lembretes: [1440] });
    expect(lembretesNaJanela([e], HOJE, "20:00")).toHaveLength(1);
    const d = base({ lembretes: [0] });
    expect(lembretesNaJanela([d], HOJE, "09:03")).toHaveLength(1);
  });
  it("texto da notificação", () => {
    expect(textoLembrete(base({ hora_inicio: "20:00:00", local: "Casa" }), HOJE, 60, HOJE)).toBe("📅 Jantar — hoje às 20:00 (1 h) · Casa");
  });
});

describe("Etapa 341 — criar rápido", () => {
  it("jantar sexta 20h → próxima sexta", () => {
    const r = interpretarRapido("jantar sexta 20h", HOJE);
    expect(r).toMatchObject({ titulo: "Jantar", data: "2026-10-30", hora_inicio: "20:00", hora_fim: "21:00", repetir: "nenhuma" });
  });
  it("dentista amanhã 14:30", () => {
    expect(interpretarRapido("dentista amanhã 14:30", HOJE)).toMatchObject({ titulo: "Dentista", data: "2026-10-24", hora_inicio: "14:30" });
  });
  it("aniversário da Su 12/03", () => {
    expect(interpretarRapido("aniversário da Su 12/03", HOJE)).toMatchObject({ titulo: "Aniversário da Su", data: "2027-03-12", tipo: "aniversario", repetir: "anual", hora_inicio: null });
  });
  it("reunião toda segunda 9h", () => {
    expect(interpretarRapido("reunião toda segunda 9h", HOJE)).toMatchObject({ titulo: "Reunião", data: "2026-10-26", hora_inicio: "09:00", repetir: "semanal" });
  });
  it("pagar escola dia 10 todo mês", () => {
    expect(interpretarRapido("pagar escola dia 10 todo mês", HOJE)).toMatchObject({ titulo: "Pagar escola", data: "2026-11-10", repetir: "mensal", hora_inicio: null });
  });
  it("culto domingo às 7 da noite / almoço meio-dia", () => {
    expect(interpretarRapido("culto domingo às 7 da noite", HOJE)).toMatchObject({ titulo: "Culto", data: "2026-10-25", hora_inicio: "19:00" });
    expect(interpretarRapido("almoço com a mãe hoje meio-dia", HOJE)).toMatchObject({ titulo: "Almoço com a mãe", data: HOJE, hora_inicio: "12:00" });
  });
});
