import { describe, it, expect } from "vitest";
import { buscarNoSnapshot, agruparResultados } from "@/lib/geral/busca";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

const snapshot: any = {
  habitos: [{ id: "h1", nome: "Ler a Bíblia", icone: "📖" }],
  tarefas: [{ id: "t1", titulo: "Ler contrato", icone: "NotebookPen", data: "2026-10-10" }],
  financas: {
    metas: [],
    contas: [{ id: "c1", nome: "Nubank" }],
    categorias: [{ id: "k1", nome: "Leitura", tipo: "despesa", icone: "📚" }],
    transacoes: [{ id: "x", conta_id: "c1", categoria_id: "k1", tipo: "despesa", valor: 45.9, data: "2026-10-01", descricao: "Livro" }],
  },
  diario: [],
};

describe("Etapa 279 — busca agrupada", () => {
  it("agrupa na ordem e traz ícones", () => {
    const r = buscarNoSnapshot(snapshot, "le");
    const g = agruparResultados(r);
    expect(g.map((x) => x.titulo)).toEqual(["Hábitos", "Tarefas", "Lançamentos", "Finanças"]);
    expect(g[0].itens[0]).toMatchObject({ href: "/habitos/h1", icone: "📖" });
    expect(g[2].itens[0].icone).toBe("📚");
  });
  it("busca por valor", () => {
    expect(buscarNoSnapshot(snapshot, "45,90")[0].titulo).toBe("Livro");
  });
  it("novidades 279", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(279);
    expect(NOVIDADES.some((g) => g.versao === "279")).toBe(true);
  });
});
