import { describe, it, expect } from "vitest";
import { calcularStreak, calcularMelhorStreak } from "@/lib/habitos/streak";
import { adicionarPausa, encerrarPausas, habitoDevidoNoDia, pausasDe } from "@/lib/habitos/pausa";
import { normalizarEtiquetas, totaisPorEtiqueta } from "@/lib/financas/etiquetas";
import { acharPossiveisDuplicados } from "@/lib/financas/duplicados";
import { progressoMeta } from "@/lib/habitos/metasLongas";
import { gerarRelatorioPdf, moeda } from "@/lib/financas/relatorioPdf";

describe("pausa / modo férias", () => {
  const pausas = [{ inicio: "2026-09-20", fim: "2026-09-25" }];
  it("dias pausados não quebram nem contam na sequência", () => {
    const datas = ["2026-09-17", "2026-09-18", "2026-09-19", "2026-09-26", "2026-09-27", "2026-09-28"];
    expect(calcularStreak(datas, pausas, "2026-09-28")).toBe(6);
    expect(calcularStreak(datas, [], "2026-09-28")).toBe(3);
    expect(calcularMelhorStreak(datas, pausas)).toBe(6);
    expect(calcularMelhorStreak(datas)).toBe(3);
  });
  it("hábito pausado não é devido no dia", () => {
    const h = { frequencia: "diaria", dias_semana: [], pausas };
    expect(habitoDevidoNoDia(h, "2026-09-22")).toBe(false);
    expect(habitoDevidoNoDia(h, "2026-09-26")).toBe(true);
  });
  it("junta pausas e retoma", () => {
    const juntas = adicionarPausa(pausas, "2026-09-26", "2026-09-30");
    expect(juntas).toEqual([{ inicio: "2026-09-20", fim: "2026-09-30" }]);
    expect(encerrarPausas(juntas, "2026-09-27")).toEqual([{ inicio: "2026-09-20", fim: "2026-09-26" }]);
    expect(pausasDe({ pausas: [{ inicio: "x", fim: "y" }] })).toEqual([]);
  });
});

describe("etiquetas", () => {
  it("normaliza e soma", () => {
    expect(normalizarEtiquetas(["#Viagem Praia", "viagem praia", "reforma, casa"])).toEqual(["viagem praia", "reforma", "casa"]);
    const t = totaisPorEtiqueta([
      { tipo: "despesa", valor: 100, etiquetas: ["viagem"], data: "2026-09-01" },
      { tipo: "despesa", valor: 50, etiquetas: ["viagem"], data: "2026-09-03" },
      { tipo: "despesa", valor: 999, etiquetas: ["viagem"], data: "2026-09-03", transferencia_grupo: "g" },
    ]);
    expect(t[0]).toMatchObject({ etiqueta: "viagem", despesas: 150, quantidade: 2 });
  });
});

describe("duplicados na importação", () => {
  it("acha pelo valor e data próxima, mesmo com descrição diferente", () => {
    const r = acharPossiveisDuplicados(
      [
        { tipo: "despesa", valor: 45, data: "2026-09-14", descricao: "PIX ENVIADO JOAO" },
        { tipo: "despesa", valor: 45, data: "2026-09-14", descricao: "PIX ENVIADO JOAO" },
        { tipo: "despesa", valor: 80, data: "2026-09-14", descricao: "MERCADO" },
      ],
      [{ conta_id: "c", tipo: "despesa", valor: 45, data: "2026-09-13", descricao: "Lavagem do carro" }],
      "c"
    );
    expect(r[0]?.descricao).toBe("Lavagem do carro");
    expect(r[1]).toBeNull(); // cada lançamento existente casa uma vez só
    expect(r[2]).toBeNull();
  });
});

describe("metas de longo prazo", () => {
  it("manual e ritmo", () => {
    const m = { id: "1", nome: "Livros", emoji: null, alvo: 12, unidade: "livros", data_inicio: "2026-01-01", data_fim: "2026-12-31", habito_id: null, progresso: 9 };
    const p = progressoMeta(m, [], "2026-07-01");
    expect(p.pct).toBe(75);
    expect(p.status).toBe("adiantada");
  });
  it("conta pelo hábito", () => {
    const m = { id: "1", nome: "Correr", emoji: null, alvo: 100, unidade: "km", data_inicio: "2026-09-01", data_fim: "2026-09-30", habito_id: "h", progresso: 0 };
    const p = progressoMeta(m, [{ habito_id: "h", data: "2026-09-02", quantidade: 5 }, { habito_id: "h", data: "2026-08-30", quantidade: 50 }], "2026-09-03");
    expect(p.feito).toBe(5);
  });
});

describe("relatório PDF", () => {
  it("gera um PDF válido com acentos", async () => {
    const bytes = await gerarRelatorioPdf({
      nome: "João",
      mesRotulo: "setembro de 2026",
      geradoEm: "28/09/2026 08:15",
      receitas: 1000,
      despesas: 450.5,
      saldoContas: 3200,
      porCategoria: [{ nome: "Alimentação", valor: 450.5 }],
      lancamentos: Array.from({ length: 80 }, (_, i) => ({
        data: "2026-09-10",
        descricao: `Padaria São João ✓ ${i}`,
        categoria: "Alimentação",
        conta: "Inter",
        valor: 5.63,
        tipo: "despesa" as const,
        pendente: false,
      })),
    });
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(2000);
    expect(moeda(1234.5)).toBe("R$ 1.234,50");
  });
});
