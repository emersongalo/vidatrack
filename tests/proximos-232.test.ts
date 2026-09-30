import { describe, it, expect } from "vitest";
import { proximosDias } from "@/lib/painel/proximos";

describe("próximos dias no Painel", () => {
  it("junta contas previstas e tarefas com data, sem o que já foi lançado", () => {
    const s = {
      tarefas: [
        { id: "t1", titulo: "Dentista", repetir: "nenhuma", data: "2026-10-02", concluida: false },
        { id: "t2", titulo: "Feita", repetir: "nenhuma", data: "2026-10-02", concluida: true },
        { id: "t3", titulo: "Todo dia", repetir: "diaria", data: null, concluida: false },
        { id: "t4", titulo: "Longe", repetir: "nenhuma", data: "2026-10-20", concluida: false },
      ],
      financas: {
        contas: [{ id: "b", nome: "Banco", tipo: "corrente" }],
        transacoes: [
          { conta_id: "b", tipo: "despesa", valor: 120, data: "2026-10-03", descricao: "Luz" },
          { conta_id: "b", tipo: "despesa", valor: 50, data: "2026-09-29", descricao: "Passado" },
        ],
        recorrencias: [{ id: "r", ativo: true, conta_id: "b", dia_mes: 5, valor: 900, tipo: "despesa", descricao: "Aluguel" }],
      },
    };
    const r = proximosDias(s, "2026-09-30");
    expect(r.map((i) => [i.data, i.titulo, i.tipo])).toEqual([
      ["2026-10-02", "Dentista", "tarefa"],
      ["2026-10-03", "Luz", "despesa"],
      ["2026-10-05", "Aluguel", "despesa"],
    ]);
    expect(r[1].valor).toBe(120);
  });
  it("retrato vazio não quebra", () => {
    expect(proximosDias({}, "2026-09-30")).toEqual([]);
  });
});
