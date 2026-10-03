import { describe, it, expect } from "vitest";
import { resumoParar, nomeDoMarco } from "@/lib/habitos/parar";
import { horarioDoHabito } from "@/lib/habitos/horario";
import { encadearHabitos } from "@/components/HojeLocalFirst";

const HOJE = "2026-10-21";

describe("hábito de parar", () => {
  it("dias limpos, economia e próximo marco", () => {
    const h = { id: "f", criado_em: "2026-10-01T10:00:00Z", economia_dia: 12 };
    const r = resumoParar(h, [{ habito_id: "f", data: "2026-10-11" }], HOJE);
    expect(r.diasLimpo).toBe(10);
    expect(r.economizado).toBe(120);
    expect(r.economizadoTotal).toBe(19 * 12); // 20 dias desde o início, menos 1 escorregão
    expect(r.recorde).toBe(10);
    expect(r.proximoMarco).toBe(14);
    expect(r.faltaProMarco).toBe(4);
    expect(nomeDoMarco(14)).toBe("2 semanas");
  });
  it("sem escorregão conta desde a criação; sem valor não mostra economia", () => {
    const r = resumoParar({ id: "f", criado_em: "2026-10-14" }, [], HOJE);
    expect(r.diasLimpo).toBe(7);
    expect(r.economizado).toBeNull();
    expect(r.proximoMarco).toBe(14);
  });
});

describe("melhor horário", () => {
  it("agrupa por faixa e ignora marcação feita em outro dia", () => {
    const c = [
      { habito_id: "a", data: "2026-10-18", criado_em: "2026-10-18T10:30:00Z" }, // 07:30 SP
      { habito_id: "a", data: "2026-10-19", criado_em: "2026-10-19T10:50:00Z" }, // 07:50
      { habito_id: "a", data: "2026-10-20", criado_em: "2026-10-20T22:00:00Z" }, // 19:00
      { habito_id: "a", data: "2026-10-17", criado_em: "2026-10-18T12:00:00Z" }, // marcou depois
    ];
    const h = horarioDoHabito("a", c);
    expect(h.total).toBe(3);
    expect(h.melhor?.nome).toBe("Cedinho");
    expect(h.horaTipica).toBe("07:50");
  });
});

describe("encadear hábitos", () => {
  const item = (id: string, feito: boolean) => ({ id, tipo: "habito" as const, titulo: id.toUpperCase(), icone: "", cor: "habito", feito, repete: true, horarioLembrete: null, ordem: 0 });
  it("filho fica logo depois do pai e sobe pro topo quando o pai é feito", () => {
    const lista = [item("x", false), item("cafe", false), item("ler", false)];
    encadearHabitos(lista, [{ id: "ler", depois_de: "cafe" }]);
    expect(lista.map((i) => i.id)).toEqual(["x", "cafe", "ler"]);
    const lista2 = [item("x", false), item("ler", false), item("cafe", true)];
    encadearHabitos(lista2, [{ id: "ler", depois_de: "cafe" }]);
    expect(lista2.map((i) => i.id)).toEqual(["ler", "x", "cafe"]);
    expect(lista2[0].encadeado).toEqual({ depoisDe: "CAFE", paiId: "cafe", liberado: true });
  });
});
