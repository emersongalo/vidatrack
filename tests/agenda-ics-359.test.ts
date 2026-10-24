import { describe, it, expect, beforeAll } from "vitest";
import { gerarIcs, lerIcs } from "@/lib/agenda/ics";

beforeAll(() => {
  process.env.AGENDA_ICS_SEGREDO = "segredo-de-teste";
});

describe("Etapa 359 — Google Agenda (.ics)", () => {
  const ev: any = {
    id: "11111111-2222-4333-8444-555555555555",
    dono_id: "x",
    titulo: "⛪ Culto, louvor; ensaio",
    local: "Igreja",
    descricao: "linha 1\nlinha 2",
    data: "2026-10-27",
    hora_inicio: "19:00:00",
    hora_fim: "21:00",
    repetir: "semanal",
    repetir_ate: "2026-12-31",
    excecoes: ["2026-11-03"],
    lembretes: [30, 100045],
    tipo: "evento",
  };
  it("gera um calendário válido", () => {
    const t = gerarIcs([ev, { ...ev, id: "a", titulo: "🎂 Aniversário", hora_inicio: null, hora_fim: null, repetir: "anual", repetir_ate: null, excecoes: [], lembretes: [1440] }], { agora: new Date("2026-10-24T12:00:00Z") });
    expect(t).toContain("BEGIN:VCALENDAR");
    expect(t).toContain("DTSTART;TZID=America/Sao_Paulo:20261027T190000");
    expect(t).toContain("RRULE:FREQ=WEEKLY;UNTIL=20261231T235959Z");
    expect(t).toContain("EXDATE;TZID=America/Sao_Paulo:20261103T190000");
    expect(t).toContain("SUMMARY:⛪ Culto\\, louvor\; ensaio");
    expect(t).toContain("TRIGGER:-PT45M"); // hora de sair (45 min)
    expect(t).toContain("DTSTART;VALUE=DATE:20261027");
    expect(t).toContain("TRIGGER:-PT900M"); // dia inteiro: 1 dia antes das 9h
    expect(t.split("\r\n").every((l) => l.length <= 75)).toBe(true);
  });
  it("lê de volta (ida e volta) e entende UTC", () => {
    const lidos = lerIcs(gerarIcs([ev]));
    expect(lidos[0]).toMatchObject({ titulo: "⛪ Culto, louvor; ensaio", data: "2026-10-27", hora_inicio: "19:00", hora_fim: "21:00", repetir: "semanal", repetir_ate: "2026-12-31", local: "Igreja", descricao: "linha 1\nlinha 2" });
    const google = "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART:20261030T230000Z\r\nDTEND:20261031T000000Z\r\nSUMMARY:Jantar\r\nBEGIN:VALARM\r\nDESCRIPTION:x\r\nEND:VALARM\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20261225\r\nSUMMARY:Natal\r\nRRULE:FREQ=YEARLY\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART:20261101T100000Z\r\nSUMMARY:Cancelado\r\nSTATUS:CANCELLED\r\nEND:VEVENT\r\nEND:VCALENDAR";
    const r = lerIcs(google);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ titulo: "Jantar", data: "2026-10-30", hora_inicio: "20:00", hora_fim: "21:00" });
    expect(r[1]).toMatchObject({ titulo: "Natal", data: "2026-12-25", hora_inicio: null, repetir: "anual" });
  });
  it("token: só o servidor gera; outro id não passa", async () => {
    const { gerarTokenIcs, lerTokenIcs } = await import("@/lib/agenda/tokenIcs");
    const id = "11111111-2222-4333-8444-555555555555";
    const t = gerarTokenIcs(id);
    expect(lerTokenIcs(t + ".ics")).toBe(id);
    expect(lerTokenIcs(t.replace(/^1/, "2"))).toBeNull();
    expect(lerTokenIcs("qualquer")).toBeNull();
  });
});

import { lembretesNaJanela, textoLembrete } from "@/lib/agenda/eventos";
describe("Etapa 361 — hora de sair", () => {
  it("avisa X min antes, com texto próprio", () => {
    const e: any = { id: "e", dono_id: "d", titulo: "🦷 Dentista", local: "Clínica", data: "2026-10-27", hora_inicio: "14:00", repetir: "nenhuma", tipo: "evento", lembretes: [100030, 10] };
    const v = lembretesNaJanela([e], "2026-10-27", "13:31", 5);
    expect(v.map((x) => x.minutos)).toEqual([100030]);
    expect(textoLembrete(e, "2026-10-27", 100030, "2026-10-27")).toContain("🚗 Hora de sair pra 🦷 Dentista — começa às 14:00 · Clínica");
    expect(lembretesNaJanela([e], "2026-10-27", "13:51", 5).map((x) => x.minutos)).toEqual([10]);
  });
});
