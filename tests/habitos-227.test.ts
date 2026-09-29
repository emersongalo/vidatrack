import { describe, it, expect } from "vitest";
import { agruparItensHoje, grupoDoItem } from "@/lib/habitos/gruposHoje";
import { resumoDoHabito } from "@/lib/habitos/detalhe";
import { lerLayoutHoje, salvarLayoutHoje, moverItem, fixarItemNoTopo, alternarVisivel, BLOCOS_HOJE_PADRAO } from "@/lib/habitos/blocosHoje";

const HOJE = "2026-09-29";
const somar = (iso: string, n: number) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
};

describe("grupos do Hoje", () => {
  it("separa por horário e tarefas", () => {
    const h = (hora: string | null, feito = false) => ({ tipo: "habito" as const, horarioLembrete: hora, feito });
    expect(grupoDoItem(h("07:30:00"))).toBe("manha");
    expect(grupoDoItem(h("13:00"))).toBe("tarde");
    expect(grupoDoItem(h("21:00"))).toBe("noite");
    expect(grupoDoItem(h(null))).toBe("qualquer");
    expect(grupoDoItem({ tipo: "tarefa", horarioLembrete: "08:00", feito: false })).toBe("tarefas");
    const g = agruparItensHoje([h("21:00", true), h("07:00"), { tipo: "tarefa", horarioLembrete: null, feito: false }, h(null)]);
    expect(g.map((x) => [x.id, x.itens.length, x.feitos])).toEqual([
      ["manha", 1, 0],
      ["noite", 1, 1],
      ["qualquer", 1, 0],
      ["tarefas", 1, 0],
    ]);
    // só hábitos sem horário: título simples
    expect(agruparItensHoje([h(null)])[0].titulo).toBe("Hábitos");
  });
});

describe("detalhe do hábito", () => {
  it("resume sequência, taxa e meses", () => {
    const habito = { id: "h", frequencia: "diaria", dias_semana: [], meta_diaria: 1, criado_em: "2026-08-01T10:00:00Z" };
    const checkins = [0, 1, 2, 5].map((i) => ({ habito_id: "h", data: somar(HOJE, -i), quantidade: 1 }));
    const r = resumoDoHabito(habito, checkins, HOJE);
    expect(r.sequencia).toBe(3);
    expect(r.totalFeitos).toBe(4);
    expect(r.taxa30).toBe(13); // 4 de 30
    expect(r.meses.map((m) => m.mes)).toEqual(["2026-09", "2026-08"]);
    const set = r.meses[0];
    expect(set.dias.find((d) => d.dia === HOJE)?.estado).toBe("feito");
    expect(set.dias.find((d) => d.dia === "2026-09-30")?.estado).toBe("futuro");
    expect(set.dias.find((d) => d.dia === "2026-09-10")?.estado).toBe("falhou");
  });
});

describe("blocos do Hoje", () => {
  it("lê, salva e reorganiza", () => {
    expect(lerLayoutHoje(null).map((b) => b.id)).toEqual(BLOCOS_HOJE_PADRAO);
    const l = lerLayoutHoje(["!diario", "lista", "xyz"]);
    expect(l[0]).toEqual({ id: "diario", visivel: false });
    expect(l).toHaveLength(BLOCOS_HOJE_PADRAO.length);
    expect(salvarLayoutHoje(l).slice(0, 2)).toEqual(["!diario", "lista"]);
    expect(fixarItemNoTopo([1, 2, 3], 2)).toEqual([3, 1, 2]);
    expect(moverItem([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(alternarVisivel([{ visivel: true }], 0)[0].visivel).toBe(false);
  });
});
