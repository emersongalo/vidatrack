import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/local/acaoOffline", () => ({ enfileirarAcao: vi.fn(), novoUuid: () => "x" }));
vi.mock("@/lib/offline/snapshot", () => ({ lerSnapshotOffline: () => null }));
vi.mock("@/lib/offline/fila", () => ({ lerFila: () => [] }));
import { mesCompetencia, valoresAdiar } from "@/lib/financas/competencia";
import { lancamentosRecorrentesQueFaltam } from "@/lib/local/recorrentesMes";
import { recorrentesPrevistasAte, recorrentesPrevistasDoMes } from "@/lib/financas/recorrentesPrevistas";

describe("Etapa 364 — conta fixa adiada pra outro mês", () => {
  it("o mês de competência é o da data original", () => {
    expect(mesCompetencia({ data: "2026-11-03", adiada_de: "2026-10-26" })).toBe("2026-10");
    expect(mesCompetencia({ data: "2026-11-03" })).toBe("2026-11");
  });

  it("adiar conta fixa guarda a data original só na primeira vez", () => {
    expect(valoresAdiar({ data: "2026-10-26", recorrencia_id: "r" }, "2026-11-03")).toEqual({ data: "2026-11-03", adiada_de: "2026-10-26" });
    expect(valoresAdiar({ data: "2026-11-03", adiada_de: "2026-10-26", recorrencia_id: "r" }, "2026-11-10")).toEqual({ data: "2026-11-10" });
    expect(valoresAdiar({ data: "2026-10-26" }, "2026-11-03")).toEqual({ data: "2026-11-03" });
  });

  const snap = (transacoes: any[]) => ({
    financas: { transacoes, recorrencias: [{ id: "sabesp", dia_mes: 26, ativo: true }] },
  });

  it("não gera outra em outubro quando a de outubro foi adiada pra novembro", () => {
    const s = snap([{ id: "1", recorrencia_id: "sabesp", data: "2026-11-03", adiada_de: "2026-10-26" }]);
    expect(lancamentosRecorrentesQueFaltam(s, "2026-10-26")).toHaveLength(0);
  });

  it("em novembro gera a de novembro mesmo com a de outubro lá", () => {
    const s = snap([{ id: "1", recorrencia_id: "sabesp", data: "2026-11-03", adiada_de: "2026-10-26" }]);
    const f = lancamentosRecorrentesQueFaltam(s, "2026-11-05");
    expect(f).toHaveLength(1);
    expect(f[0].data).toBe("2026-11-26");
  });
});

describe("Etapa 364 — contas fixas previstas nos meses futuros", () => {
  const recs = [
    { id: "luz", dia_mes: 7, ativo: true, tipo: "despesa", valor: "150", conta_id: "c" },
    { id: "agua", dia_mes: 25, ativo: true, tipo: "despesa", valor: "80", conta_id: "c", data_inicio: "2026-11-01" },
    { id: "pausada", dia_mes: 5, ativo: false, tipo: "despesa", valor: "10", conta_id: "c" },
    { id: "sabesp", dia_mes: 26, ativo: true, tipo: "despesa", valor: "197", conta_id: "c" },
  ];
  it("mostra as que ainda não foram lançadas no mês", () => {
    const tr = [{ id: "1", recorrencia_id: "sabesp", data: "2026-11-03", adiada_de: "2026-10-26" }];
    const p = recorrentesPrevistasDoMes(recs, tr, "2026-11");
    expect(p.map((x) => x.recorrencia_id)).toEqual(["luz", "agua", "sabesp"]);
    expect(p[0].data).toBe("2026-11-07");
    expect(p[0].valor).toBe(150);
  });
  it("não repete a que já está lançada no mês", () => {
    const tr = [{ id: "1", recorrencia_id: "luz", data: "2026-11-07" }];
    expect(recorrentesPrevistasDoMes(recs, tr, "2026-11").map((x) => x.recorrencia_id)).not.toContain("luz");
  });
  it("soma do mês seguinte até o escolhido", () => {
    const p = recorrentesPrevistasAte(recs, [], "2026-10", "2026-12");
    expect(p.filter((x) => x.recorrencia_id === "luz").map((x) => x.data)).toEqual(["2026-11-07", "2026-12-07"]);
    expect(recorrentesPrevistasAte(recs, [], "2026-12", "2027-01")[0].data).toBe("2027-01-07");
  });
});

describe("Etapa 364 — contas adiadas antes desta versão", () => {
  it("conta fixa antiga com dia antes do dia dela conta como do mês anterior", () => {
    const t = { data: "2026-11-03", criado_em: "2026-09-30T20:21:59Z" };
    expect(mesCompetencia(t, 26)).toBe("2026-10");
    expect(mesCompetencia(t)).toBe("2026-11");
    // criada depois desta versão: só vale adiada_de
    expect(mesCompetencia({ data: "2026-11-03", criado_em: "2026-10-28T10:00:00Z" }, 26)).toBe("2026-11");
    // no dia certo: mês dela mesmo
    expect(mesCompetencia({ data: "2026-10-26", criado_em: "2026-09-30T00:00:00Z" }, 26)).toBe("2026-10");
  });
  it("com os dados de agora: outubro não gera de novo e novembro gera a Sabesp de novembro", () => {
    const recs = [{ id: "sabesp", dia_mes: 26, ativo: true, tipo: "despesa", valor: "197", conta_id: "c" }];
    const tr = [{ id: "a", recorrencia_id: "sabesp", data: "2026-11-03", criado_em: "2026-09-30T20:21:59Z" }];
    expect(recorrentesPrevistasDoMes(recs, tr, "2026-10")).toHaveLength(0);
    expect(recorrentesPrevistasDoMes(recs, tr, "2026-11").map((p) => p.data)).toEqual(["2026-11-26"]);
  });
});
