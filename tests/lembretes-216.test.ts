import { describe, it, expect } from "vitest";
import { normalizarHorarios, gerarHorariosIntervalo, horariosDoHabito } from "@/lib/habitos/horariosLembrete";

describe("vários lembretes por hábito", () => {
  it("normaliza, ordena e tira repetidos", () => {
    expect(normalizarHorarios(["15:00", "8:00", "08:00", "", null, "25:00", "12:30:00"])).toEqual(["08:00", "12:30", "15:00"]);
  });
  it("a cada 2h das 8 às 20", () => {
    expect(gerarHorariosIntervalo("08:00", "20:00", 2)).toEqual(["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"]);
    expect(gerarHorariosIntervalo("09:00", "11:00", 1.5)).toEqual(["09:00", "10:30"]);
  });
  it("hábito antigo com um horário só continua funcionando", () => {
    expect(horariosDoHabito({ horario_lembrete: "07:30:00" })).toEqual(["07:30"]);
    expect(horariosDoHabito({ horario_lembrete: "07:30:00", horarios_lembrete: ["07:30", "12:00"] })).toEqual(["07:30", "12:00"]);
  });
});
