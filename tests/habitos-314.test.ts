import { describe, it, expect } from "vitest";
import { lerLayoutHoje, BLOCOS_HOJE_PADRAO } from "@/lib/habitos/blocosHoje";
import { relatorioDoMes, mesAnterior, mesSeguinte, nomeDoMes, somarDias } from "@/lib/habitos/relatorioMes";
import { semanaisApertados, textoApertados } from "@/lib/habitos/semanal";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

const ck = (id: string, d: string, q = 1) => ({ habito_id: id, data: d, quantidade: q });

describe("Etapa 314 — desafios no dia, relatório e semana flexível", () => {
  it("bloco de desafios entra logo depois das missões", () => {
    expect(BLOCOS_HOJE_PADRAO.indexOf("desafios")).toBe(BLOCOS_HOJE_PADRAO.indexOf("missoes") + 1);
    const l = lerLayoutHoje(["mascote", "missoes", "lista", "resumo"]);
    expect(l.findIndex((b) => b.id === "desafios")).toBe(2);
    const sem = lerLayoutHoje(["lista", "!missoes"]);
    const i = sem.findIndex((b) => b.id === "missoes");
    expect(sem[i + 1].id).toBe("desafios");
  });

  it("meses: anterior, seguinte e nome", () => {
    expect(mesAnterior("2026-01")).toBe("2025-12");
    expect(mesSeguinte("2026-12")).toBe("2027-01");
    expect(nomeDoMes("2026-09")).toBe("Setembro de 2026");
  });

  it("relatório de um mês fechado: taxa, comparação, dia da semana, destaque e queda", () => {
    const hoje = "2026-10-12";
    const habitos = [
      { id: "a", nome: "Água", meta_diaria: 1, frequencia: "diaria", criado_em: "2026-01-01" },
      { id: "b", nome: "Ler", meta_diaria: 1, frequencia: "diaria", criado_em: "2026-01-01" },
    ];
    const checkins: any[] = [];
    // agosto: os dois todo dia
    for (let d = "2026-08-01"; d <= "2026-08-31"; d = somarDias(d, 1)) checkins.push(ck("a", d), ck("b", d));
    // setembro: água todo dia; ler só nas segundas
    for (let d = "2026-09-01"; d <= "2026-09-30"; d = somarDias(d, 1)) {
      checkins.push(ck("a", d));
      if (new Date(d + "T12:00:00Z").getUTCDay() === 1) checkins.push(ck("b", d));
    }
    const r = relatorioDoMes({ habitos, habitoCheckins: checkins }, "2026-09", hoje);
    expect(r.completo).toBe(true);
    expect(r.devidos).toBe(60);
    expect(r.feitos).toBe(34);
    expect(r.taxa).toBe(57);
    expect(r.taxaAntes).toBe(100);
    expect(r.melhorDia).toBe(1); // segunda
    expect(r.destaque?.nome).toBe("Água");
    expect(r.queda?.nome).toBe("Ler");
    expect(r.melhorSequencia).toEqual({ nome: "Água", dias: 30 });
    expect(r.diasPerfeitos).toBe(4);
    expect(r.sugestoes.some((t) => t.includes("Ler"))).toBe(true);
  });

  it("mês atual: hoje em aberto não conta como falta; semanal conta semanas", () => {
    const hoje = "2026-10-08"; // quinta
    const habitos = [
      { id: "a", nome: "Água", meta_diaria: 1, frequencia: "diaria", criado_em: "2026-01-01" },
      { id: "s", nome: "Correr", meta_diaria: 1, frequencia: "semanal", vezes_semana: 2, criado_em: "2026-01-01" },
      { id: "n", nome: "Sem doce", meta_diaria: 1, frequencia: "diaria", eh_negativo: true, criado_em: "2026-01-01" },
    ];
    const checkins = [ck("a", "2026-10-07"), ck("s", "2026-10-05"), ck("s", "2026-10-06"), ck("n", "2026-10-03")];
    const r = relatorioDoMes({ habitos, habitoCheckins: checkins }, "2026-10", hoje);
    const agua = r.habitos.find((l) => l.id === "a")!;
    expect(agua.devidos).toBe(7); // 1 a 7 (o dia 8 ainda está em aberto)
    const correr = r.habitos.find((l) => l.id === "s")!;
    expect(correr).toMatchObject({ tipo: "semanal", devidos: 1, feitos: 1 });
    const doce = r.habitos.find((l) => l.id === "n")!;
    expect(doce).toMatchObject({ tipo: "parar", devidos: 7, feitos: 6 });
  });

  it("semanal apertado: avisa quando o que falta ocupa os dias que restam", () => {
    const h = { id: "s", nome: "Academia", meta_diaria: 1, frequencia: "semanal", vezes_semana: 3 };
    // sábado 2026-10-10: restam sáb e dom; fez 1 → faltam 2 → apertado
    const l = semanaisApertados([h], [ck("s", "2026-10-06")], "2026-10-10");
    expect(l).toEqual([{ id: "s", nome: "Academia", feitos: 1, vezes: 3, falta: 2, restam: 2 }]);
    expect(textoApertados(l)).toContain("faltam 2 de 3");
    // quarta: ainda tem folga
    expect(semanaisApertados([h], [], "2026-10-07")).toEqual([]);
    // já fez hoje: não avisa
    expect(semanaisApertados([h], [ck("s", "2026-10-10")], "2026-10-10")).toEqual([]);
    // domingo, faltando 1
    expect(textoApertados(semanaisApertados([h], [ck("s", "2026-10-06"), ck("s", "2026-10-07")], "2026-10-11"))).toContain("Último dia");
    expect(textoApertados([])).toBeNull();
  });

  it("novidades 314", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(314);
    expect(NOVIDADES.some((g) => g.versao === "314")).toBe(true);
  });
});
