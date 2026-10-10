import { describe, it, expect } from "vitest";
import { temaEfetivo, SCRIPT_TEMA } from "@/lib/preferencias/tema";
import { diasDoMes, calendarioDoMes } from "@/lib/geral/calendarioUnico";
import { montarJardim, resumoJardim } from "@/lib/habitos/jardim";
import { ehUnidadeDeMinuto, segundosContados, minutosParaLancar } from "@/lib/habitos/timerHabito";
import { habitosDeHoje, tarefasDeHoje } from "@/lib/geral/modoRapido";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

describe("Etapa 281/282 — design", () => {
  it("tema efetivo", () => {
    expect(temaEfetivo("dark", 12, false)).toBe("dark");
    expect(temaEfetivo("light", 23, true)).toBe("light");
    expect(temaEfetivo("auto", 12, true)).toBe("dark");
    expect(temaEfetivo("auto", 12, false)).toBe("light");
    expect(temaEfetivo("horario", 6, true)).toBe("light");
    expect(temaEfetivo("horario", 17, true)).toBe("light");
    expect(temaEfetivo("horario", 18, false)).toBe("dark");
    expect(temaEfetivo("horario", 2, false)).toBe("dark");
    expect(SCRIPT_TEMA).toContain("vidatrack-tema");
  });

  it("dias do mês", () => {
    expect(diasDoMes("2026-02")).toHaveLength(28);
    expect(diasDoMes("2028-02")).toHaveLength(29);
    expect(diasDoMes("2026-10")[30]).toBe("2026-10-31");
  });

  it("calendário junta hábitos, tarefas e dinheiro", () => {
    const snap: any = {
      perfil: { id: "eu" },
      habitos: [{ id: "h1", nome: "Ler", frequencia: "diaria", meta_diaria: 1, criado_em: "2026-10-01T00:00:00Z" }],
      habitoCheckins: [
        { habito_id: "h1", data: "2026-10-02", quantidade: 1, usuario_id: "eu" },
        { habito_id: "h1", data: "2026-10-03", quantidade: 1, usuario_id: "outro" },
      ],
      tarefas: [{ id: "t1", titulo: "Banco", repetir: "nenhuma", data: "2026-10-05", concluida: true }],
      conclusoesTarefas: [],
      financas: {
        transacoes: [
          { id: "x", tipo: "despesa", valor: 50, data: "2026-10-02" },
          { id: "y", tipo: "receita", valor: 900, data: "2026-10-20" },
          { id: "z", tipo: "despesa", valor: 10, data: "2026-10-02", transferencia_grupo: "g" },
        ],
      },
    };
    const m = calendarioDoMes(snap, "2026-10", "2026-10-09");
    expect(m.size).toBe(31);
    expect(m.get("2026-10-02")).toMatchObject({ habitosFeitos: 1, despesas: 50 });
    expect(m.get("2026-10-03")!.habitosFeitos).toBe(0);
    expect(m.get("2026-10-05")).toMatchObject({ tarefas: 1, tarefasFeitas: 1 });
    expect(m.get("2026-10-20")).toMatchObject({ receitas: 900, agendado: true, habitosDevidos: 0 });
  });

  it("jardim", () => {
    const checkins = Array.from({ length: 8 }, (_, i) => ({ habito_id: "a", data: `2026-10-0${i + 1}`, quantidade: 1 }));
    const p = montarJardim(
      [
        { id: "a", nome: "Água" },
        { id: "b", nome: "Fumar", eh_negativo: true },
        { id: "c", nome: "Correr" },
      ],
      checkins,
      "2026-10-08"
    );
    expect(p.map((x) => x.id)).toEqual(["a", "c"]);
    expect(p[0].nivel.atual.nome).toBe("Mudinha");
    expect(p[0].regadaHoje).toBe(true);
    expect(resumoJardim(p)).toMatchObject({ plantas: 2, dias: 8, regadas: 1 });
  });

  it("timer do hábito", () => {
    expect(ehUnidadeDeMinuto("min")).toBe(true);
    expect(ehUnidadeDeMinuto(" Minutos ")).toBe(true);
    expect(ehUnidadeDeMinuto("copos")).toBe(false);
    expect(ehUnidadeDeMinuto(null)).toBe(false);
    const t = { habitoId: "h", data: "2026-10-09", desde: 1_000_000, acumulado: 30 };
    expect(segundosContados(t, 1_000_000 + 95_000)).toBe(125);
    expect(segundosContados({ ...t, desde: null }, 9e9)).toBe(30);
    expect(minutosParaLancar(125)).toBe(2);
    expect(minutosParaLancar(59)).toBe(0);
  });

  it("modo rápido", () => {
    const h = habitosDeHoje(
      [
        { id: "a", nome: "Água", frequencia: "diaria", meta_diaria: 8, unidade: "copos" },
        { id: "b", nome: "Ler", frequencia: "diaria" },
        { id: "n", nome: "Doce", frequencia: "diaria", eh_negativo: true },
      ],
      [{ habito_id: "b", data: "2026-10-09", quantidade: 1 }, { habito_id: "a", data: "2026-10-09", quantidade: 3 }],
      "2026-10-09"
    );
    expect(h.map((x) => x.id)).toEqual(["a", "b"]);
    expect(h[0]).toMatchObject({ atual: 3, meta: 8 });
    const t = tarefasDeHoje(
      [
        { id: "1", titulo: "Hoje", repetir: "nenhuma", data: "2026-10-09" },
        { id: "2", titulo: "Velha", repetir: "nenhuma", data: "2026-10-01" },
        { id: "3", titulo: "Amanhã", repetir: "nenhuma", data: "2026-10-10" },
      ],
      [],
      "2026-10-09"
    );
    expect(t.map((x) => x.id)).toEqual(["2", "1"]);
    expect(t[0].atrasada).toBe(true);
  });

  it("novidades 281", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(281);
    expect(NOVIDADES.some((g) => g.versao === "281")).toBe(true);
  });
});
