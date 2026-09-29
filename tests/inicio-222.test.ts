import { describe, it, expect } from "vitest";
import { BLOCOS_FINANCAS_PADRAO, alternarBloco, fixarNoTopo, lerLayoutBlocos, moverBloco, salvarLayoutBlocos } from "@/lib/financas/blocos";
import { bancoPorId, siglaDoSelo } from "@/lib/financas/bancos";

describe("blocos da tela de Finanças", () => {
  it("padrão quando não tem nada salvo", () => {
    expect(lerLayoutBlocos(null).map((b) => b.id)).toEqual(BLOCOS_FINANCAS_PADRAO);
    expect(lerLayoutBlocos([]).every((b) => b.visivel)).toBe(true);
  });
  it("formato antigo (só gráfico/lançamentos) mantém a ordem deles no fim", () => {
    const l = lerLayoutBlocos(["lancamentos", "grafico"]);
    expect(l.slice(-2).map((b) => b.id)).toEqual(["lancamentos", "grafico"]);
    expect(l[0].id).toBe("previsao");
    expect(l).toHaveLength(BLOCOS_FINANCAS_PADRAO.length);
  });
  it("lê escondidos, ignora lixo e repetidos, completa os que faltam", () => {
    const l = lerLayoutBlocos(["metas", "!contas", "calendario", "metas", "xyz"]);
    expect(l[0]).toEqual({ id: "metas", visivel: true });
    expect(l[1]).toEqual({ id: "contas", visivel: false });
    expect(l).toHaveLength(BLOCOS_FINANCAS_PADRAO.length);
    expect(salvarLayoutBlocos(l).slice(0, 2)).toEqual(["metas", "!contas"]);
  });
  it("mover, fixar e esconder", () => {
    const l = lerLayoutBlocos(null);
    expect(fixarNoTopo(l, 4)[0].id).toBe("metas");
    expect(moverBloco(l, 0, -1)).toBe(l);
    expect(moverBloco(l, 0, 1).slice(0, 2).map((b) => b.id)).toEqual(["teto", "previsao"]);
    expect(alternarBloco(l, 2)[2].visivel).toBe(false);
  });
});

describe("selo do banco", () => {
  it("sigla do banco, iniciais da conta ou $ pra carteira", () => {
    expect(siglaDoSelo("nubank", "Conta Nubank")).toBe("NU");
    expect(bancoPorId("nubank").cor).toBe("#820AD1");
    expect(siglaDoSelo("outro", "Sicoob Crédito")).toBe("SC");
    expect(siglaDoSelo(null, "Poupança")).toBe("PO");
    expect(siglaDoSelo(null, "Dinheiro", "carteira")).toBe("$");
    expect(siglaDoSelo(null, "")).toBe("");
  });
});
