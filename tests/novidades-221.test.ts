import { describe, it, expect } from "vitest";
import { alteracaoAposEnviarSobra, calcularEnvelope, gastoCategoriaNoMes } from "@/lib/financas/envelopes";
import { chaveAssinatura, detectarAssinaturas } from "@/lib/financas/assinaturas";
import { simular, sobraMediaMensal } from "@/lib/financas/simulador";
import { analisarArquivoExtrato, lerData, lerValor, limparDescricaoBanco, separarLinhaCSV } from "@/lib/financas/importar-extrato";
import { itensDaRotina, rotinaDoMomento } from "@/lib/habitos/rotina";
import { resumoDaSemana } from "@/lib/geral/semana";
import { calcularConquistas, conquistasNovas } from "@/lib/habitos/conquistas";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

const HOJE = "2026-09-28"; // segunda
const contas = [{ id: "b", tipo: "corrente" }];

function somar(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

describe("envelopes", () => {
  const trans = [
    { conta_id: "b", categoria_id: "c", tipo: "despesa", valor: 300, data: "2026-07-10" },
    { conta_id: "b", categoria_id: "c", tipo: "despesa", valor: 450, data: "2026-08-10" },
    { conta_id: "b", categoria_id: "c", tipo: "despesa", valor: 100, data: "2026-09-10" },
    { conta_id: "b", categoria_id: "c", tipo: "despesa", valor: 999, data: "2026-09-30" }, // futuro não pago
    { conta_id: "b", categoria_id: "c", tipo: "despesa", valor: 50, data: "2026-09-11", transferencia_grupo: "g" },
  ];
  it("soma só o que conta", () => {
    expect(gastoCategoriaNoMes("c", contas, trans, "2026-09", HOJE)).toBe(100);
  });
  it("sem acumular: sobra do mês passado pode ir pra meta", () => {
    const e = calcularEnvelope({ id: "c", nome: "Mercado", tipo: "despesa", meta_mensal: 500 }, contas, trans, HOJE);
    expect(e).toMatchObject({ trazido: 0, disponivel: 500, gasto: 100, restante: 400, sobraParaMeta: 50, acumula: false });
    expect(alteracaoAposEnviarSobra(e, HOJE)).toEqual({ sobra_enviada_mes: "2026-08" });
    const jaEnviou = calcularEnvelope({ id: "c", nome: "M", tipo: "despesa", meta_mensal: 500, sobra_enviada_mes: "2026-08" }, contas, trans, HOJE);
    expect(jaEnviou.sobraParaMeta).toBe(0);
  });
  it("acumulando desde julho: sobras passam pro mês atual", () => {
    const e = calcularEnvelope({ id: "c", nome: "M", tipo: "despesa", meta_mensal: 500, envelope_desde: "2026-07-01" }, contas, trans, HOJE);
    // julho sobrou 200, agosto sobrou 50
    expect(e).toMatchObject({ trazido: 250, disponivel: 750, restante: 650, sobraParaMeta: 250, acumula: true });
    expect(alteracaoAposEnviarSobra(e, HOJE)).toEqual({ envelope_desde: "2026-09-01" });
  });
});

describe("assinaturas", () => {
  it("acha cobrança mensal e aumento de preço, ignora gasto variável", () => {
    const t: any[] = [];
    ["2026-05", "2026-06", "2026-07", "2026-08"].forEach((m) =>
      t.push({ conta_id: "b", tipo: "despesa", valor: 39.9, data: `${m}-05`, descricao: `NETFLIX.COM ${m.slice(5)}/05` })
    );
    t.push({ conta_id: "b", tipo: "despesa", valor: 44.9, data: "2026-09-05", descricao: "NETFLIX.COM 09/05" });
    ["2026-06", "2026-07", "2026-08", "2026-09"].forEach((m, i) =>
      t.push({ conta_id: "b", tipo: "despesa", valor: [200, 650, 90, 400][i], data: `${m}-12`, descricao: "Mercado" })
    );
    const r = detectarAssinaturas(t, [], HOJE);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ valorAtual: 44.9, meses: 5, diaTipico: 5 });
    expect(r[0].aumento?.pct).toBe(13);
    expect(chaveAssinatura("COMPRA CARTAO NETFLIX.COM 12/09")).toBe("netflix");
  });
});

describe("simulador", () => {
  it("calcula meses com e sem corte", () => {
    const s = simular({ alvo: 5000, atual: 1000, aporteMensal: 400, corteMensal: 100, hojeISO: HOJE });
    expect(s).toMatchObject({ falta: 4000, mesesHoje: 10, mesesComCorte: 8, mesHoje: "2027-07", ganhoEm12Meses: 1200 });
    expect(simular({ alvo: 100, atual: 0, aporteMensal: 0, corteMensal: 0, hojeISO: HOJE }).mesesHoje).toBeNull();
  });
  it("sobra média dos 3 meses fechados", () => {
    const t = [
      { conta_id: "b", tipo: "receita", valor: 1000, data: "2026-08-05" },
      { conta_id: "b", tipo: "despesa", valor: 700, data: "2026-08-06" },
      { conta_id: "b", tipo: "receita", valor: 1000, data: "2026-07-05" },
      { conta_id: "b", tipo: "despesa", valor: 900, data: "2026-07-06" },
      { conta_id: "b", tipo: "receita", valor: 9999, data: "2026-09-05" }, // mês atual não entra
    ];
    expect(sobraMediaMensal(contas, t, HOJE)).toBe(200);
  });
});

describe("importar extrato", () => {
  it("limpa descrição do banco", () => {
    expect(limparDescricaoBanco("COMPRA CARTAO DEB MC 12/09 PADARIA SAO JOSE")).toBe("Padaria Sao Jose");
    expect(limparDescricaoBanco("PIX ENVIADO - Maria Silva")).toBe("Maria Silva");
    expect(limparDescricaoBanco("Uber Trip")).toBe("Uber Trip");
    expect(limparDescricaoBanco("PIX ENVIADO")).toBe("PIX ENVIADO");
    expect(limparDescricaoBanco("Pagamento recebido")).toBe("Pagamento recebido");
  });
  it("lê valores, datas e aspas", () => {
    expect(lerValor("1.234,56")).toBe(1234.56);
    expect(lerValor("-45.90")).toBe(-45.9);
    expect(lerValor("R$ 12,00")).toBe(12);
    expect(lerData("05/09/26")).toBe("2026-09-05");
    expect(lerData("2026-09-05")).toBe("2026-09-05");
    expect(separarLinhaCSV('05/09/2026,"Padaria, centro",-10,50', ",")).toEqual(["05/09/2026", "Padaria, centro", "-10", "50"]);
  });
  it("CSV da fatura do Nubank: valor positivo é gasto", () => {
    const r = analisarArquivoExtrato("fatura.csv", "date,title,amount\n2026-09-03,Padaria,12.50\n2026-09-04,Pagamento recebido,-500.00\n");
    expect("transacoes" in r && r.transacoes).toEqual([
      { data: "2026-09-03", valor: 12.5, tipo: "despesa", descricao: "Padaria", descricaoOriginal: "Padaria" },
      { data: "2026-09-04", valor: 500, tipo: "receita", descricao: "Pagamento recebido", descricaoOriginal: "Pagamento recebido" },
    ]);
  });
  it("CSV de conta brasileiro continua funcionando", () => {
    const r = analisarArquivoExtrato("extrato.csv", "Data;Descrição;Valor\n05/09/2026;COMPRA CARTAO MERCADO BOM;-1.234,50\n");
    expect("transacoes" in r && r.transacoes[0]).toMatchObject({ data: "2026-09-05", valor: 1234.5, tipo: "despesa", descricao: "Mercado Bom" });
  });
  it("OFX", () => {
    const ofx = "<OFX><STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260905120000<TRNAMT>-45.90<MEMO>PIX ENVIADO JOAO</STMTTRN></OFX>";
    const r = analisarArquivoExtrato("x.ofx", ofx);
    expect("transacoes" in r && r.transacoes[0]).toMatchObject({ data: "2026-09-05", valor: 45.9, tipo: "despesa", descricao: "Joao" });
  });
});

describe("rotinas", () => {
  it("lista hábitos da rotina que valem hoje", () => {
    const habitos = [
      { id: "a", nome: "Água", rotina: "manha", frequencia: "diaria", meta_diaria: 2, ordem: 2 },
      { id: "b", nome: "Alongar", rotina: "manha", frequencia: "diaria", ordem: 1 },
      { id: "c", nome: "Ler", rotina: "noite", frequencia: "diaria" },
      { id: "d", nome: "Academia", rotina: "manha", frequencia: "dias_semana", dias_semana: [2] }, // só terça
    ];
    const itens = itensDaRotina(habitos, [{ habito_id: "b", data: HOJE, quantidade: 1 }, { habito_id: "a", data: HOJE, quantidade: 1 }], "manha", HOJE);
    expect(itens.map((i) => [i.nome, i.feito])).toEqual([
      ["Alongar", true],
      ["Água", false],
    ]);
    expect(rotinaDoMomento(7)).toBe("manha");
    expect(rotinaDoMomento(20)).toBe("noite");
  });
});

describe("relatório da semana", () => {
  it("resume hábitos, gastos e humor", () => {
    const s: any = {
      habitos: [{ id: "h", nome: "Ler", frequencia: "diaria", criado_em: "2026-01-01" }],
      habitoCheckins: [0, 1, 2, 3, 4].map((i) => ({ habito_id: "h", data: somar(HOJE, -i), quantidade: 1 })),
      conclusoesTarefas: [{ tarefa_id: "t", data: HOJE }],
      tarefas: [],
      diario: [
        { data: HOJE, humor: 4 },
        { data: somar(HOJE, -1), humor: 5 },
      ],
      financas: {
        contas: [{ id: "b", tipo: "corrente" }],
        categorias: [{ id: "cm", nome: "Mercado" }],
        transacoes: [
          { conta_id: "b", tipo: "despesa", valor: 100, data: HOJE, categoria_id: "cm" },
          { conta_id: "b", tipo: "despesa", valor: 200, data: somar(HOJE, -10) },
        ],
      },
    };
    const r = resumoDaSemana(s, HOJE);
    expect(r.habitos).toMatchObject({ devidos: 7, feitos: 5, pct: 71, diasPerfeitos: 5 });
    expect(r.tarefas).toBe(1);
    expect(r.gastos).toMatchObject({ total: 100, anterior: 200, variacaoPct: -50, maiorCategoria: { nome: "Mercado", valor: 100 } });
    expect(r.humor).toEqual({ media: 4.5, dias: 2 });
  });
});

describe("conquistas", () => {
  it("semana perfeita e aviso só do que é novo", () => {
    const s: any = {
      perfil: { id: "u" },
      habitos: [{ id: "h", nome: "Ler", frequencia: "diaria", criado_em: "2026-01-01" }],
      habitoCheckins: Array.from({ length: 8 }, (_, i) => ({ habito_id: "h", data: somar(HOJE, -1 - i), quantidade: 1 })),
      conclusoesTarefas: [],
      tarefas: [],
      financas: { contas: [], transacoes: [], metas: [] },
    };
    const lista = calcularConquistas(s, HOJE);
    expect(lista.find((c) => c.id === "perfeita7")?.atual).toBe(8);
    expect(lista.find((c) => c.id === "seq7")?.atual).toBe(8);
    // primeira vez: não anuncia nada
    expect(conquistasNovas(lista, null).novas).toEqual([]);
    const r = conquistasNovas(lista, JSON.stringify(["primeiro-habito"]));
    expect(r.novas.map((c) => c.id).sort()).toEqual(["perfeita7", "seq7"]);
    expect(r.vistas).toContain("seq7");
  });
});

describe("novidades 221", () => {
  it("grupo da 221 continua na lista e a versão do topo é a atual", () => {
    expect(NOVIDADES.some((g) => g.versao === "221")).toBe(true);
    expect(NOVIDADES[0].versao).toBe(VERSAO_NOVIDADES);
  });
});
