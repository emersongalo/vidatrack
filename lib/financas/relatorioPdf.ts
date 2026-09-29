// Etapa 218 — relatório do mês em PDF (gerado no servidor com pdf-lib,
// sem guardar nada: o arquivo é montado na hora e baixado).
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type DadosRelatorio = {
  nome: string;
  mesRotulo: string; // "setembro de 2026"
  geradoEm: string; // "28/09/2026 08:15"
  receitas: number;
  despesas: number;
  saldoContas: number | null;
  porCategoria: { nome: string; valor: number }[];
  lancamentos: { data: string; descricao: string; categoria: string; conta: string; valor: number; tipo: "receita" | "despesa" | "transferencia"; pendente: boolean }[];
};

const WIN_ANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
function limpar(t: string): string {
  let s = "";
  for (const ch of String(t ?? "")) {
    const c = ch.codePointAt(0)!;
    if ((c >= 32 && c <= 126) || (c >= 160 && c <= 255) || WIN_ANSI_EXTRA.includes(ch)) s += ch;
    else if (c === 10 || c === 9) s += " ";
  }
  return s;
}

export function moeda(v: number): string {
  const sinal = v < 0 ? "-" : "";
  const [int, dec] = Math.abs(v).toFixed(2).split(".");
  return `${sinal}R$ ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${dec}`;
}

function cortar(texto: string, fonte: PDFFont, tamanho: number, largura: number): string {
  let t = limpar(texto);
  if (fonte.widthOfTextAtSize(t, tamanho) <= largura) return t;
  while (t.length > 1 && fonte.widthOfTextAtSize(t + "...", tamanho) > largura) t = t.slice(0, -1);
  return t + "...";
}

const COR_TEXTO = rgb(0.12, 0.12, 0.14);
const COR_CINZA = rgb(0.45, 0.45, 0.5);
const COR_LINHA = rgb(0.88, 0.87, 0.84);
const COR_VERDE = rgb(0.3, 0.55, 0.38);
const COR_VERMELHO = rgb(0.75, 0.25, 0.25);
const COR_AMBAR = rgb(0.78, 0.55, 0.2);

export async function gerarRelatorioPdf(d: DadosRelatorio): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`VidaTrack - ${d.mesRotulo}`);
  pdf.setCreator("VidaTrack");
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrito = await pdf.embedFont(StandardFonts.HelveticaBold);

  const L = 595.28;
  const A = 841.89;
  const M = 44;
  let pagina: PDFPage = pdf.addPage([L, A]);
  let y = A - M;

  const texto = (t: string, x: number, yy: number, tam = 10, fonte = normal, cor = COR_TEXTO) =>
    pagina.drawText(limpar(t), { x, y: yy, size: tam, font: fonte, color: cor });
  const direita = (t: string, xDir: number, yy: number, tam = 10, fonte = normal, cor = COR_TEXTO) =>
    texto(t, xDir - fonte.widthOfTextAtSize(limpar(t), tam), yy, tam, fonte, cor);
  const novaPaginaSePreciso = (altura: number) => {
    if (y - altura < M + 20) {
      pagina = pdf.addPage([L, A]);
      y = A - M;
    }
  };

  // Cabeçalho
  pagina.drawRectangle({ x: 0, y: A - 8, width: L, height: 8, color: COR_AMBAR });
  texto("VidaTrack", M, y - 6, 20, negrito);
  direita(`Relatório de ${d.mesRotulo}`, L - M, y - 4, 12, negrito);
  direita(`${d.nome} · gerado em ${d.geradoEm}`, L - M, y - 18, 8, normal, COR_CINZA);
  y -= 50;

  // Resumo
  const caixas = [
    { rotulo: "Receitas", valor: d.receitas, cor: COR_VERDE },
    { rotulo: "Despesas", valor: d.despesas, cor: COR_VERMELHO },
    { rotulo: "Resultado do mês", valor: d.receitas - d.despesas, cor: d.receitas - d.despesas >= 0 ? COR_VERDE : COR_VERMELHO },
  ];
  const larg = (L - 2 * M - 20) / 3;
  caixas.forEach((c, i) => {
    const x = M + i * (larg + 10);
    pagina.drawRectangle({ x, y: y - 46, width: larg, height: 50, borderColor: COR_LINHA, borderWidth: 1, color: rgb(0.98, 0.98, 0.97) });
    texto(c.rotulo, x + 10, y - 12, 8, normal, COR_CINZA);
    texto(moeda(c.valor), x + 10, y - 34, 14, negrito, c.cor);
  });
  y -= 62;
  if (d.saldoContas !== null) {
    texto(`Saldo em contas hoje: ${moeda(d.saldoContas)}`, M, y, 9, normal, COR_CINZA);
    y -= 18;
  }

  // Despesas por categoria
  if (d.porCategoria.length) {
    y -= 6;
    texto("Despesas por categoria", M, y, 12, negrito);
    y -= 16;
    const total = d.porCategoria.reduce((s, c) => s + c.valor, 0) || 1;
    const larguraBarra = 180;
    for (const c of d.porCategoria) {
      novaPaginaSePreciso(16);
      const pct = c.valor / total;
      texto(cortar(c.nome, normal, 9, 170), M, y, 9);
      pagina.drawRectangle({ x: M + 180, y: y - 1, width: larguraBarra, height: 8, color: rgb(0.93, 0.92, 0.9) });
      pagina.drawRectangle({ x: M + 180, y: y - 1, width: Math.max(1, larguraBarra * pct), height: 8, color: COR_AMBAR });
      direita(`${Math.round(pct * 100)}%`, M + 400, y, 8, normal, COR_CINZA);
      direita(moeda(c.valor), L - M, y, 9, negrito);
      y -= 15;
    }
    y -= 8;
  }

  // Lançamentos
  novaPaginaSePreciso(40);
  texto(`Lançamentos (${d.lancamentos.length})`, M, y, 12, negrito);
  y -= 16;
  const colunas = { data: M, desc: M + 44, cat: M + 250, conta: M + 360, valor: L - M };
  const cabecalho = () => {
    texto("Data", colunas.data, y, 8, negrito, COR_CINZA);
    texto("Descrição", colunas.desc, y, 8, negrito, COR_CINZA);
    texto("Categoria", colunas.cat, y, 8, negrito, COR_CINZA);
    texto("Conta", colunas.conta, y, 8, negrito, COR_CINZA);
    direita("Valor", colunas.valor, y, 8, negrito, COR_CINZA);
    y -= 5;
    pagina.drawLine({ start: { x: M, y }, end: { x: L - M, y }, thickness: 0.5, color: COR_LINHA });
    y -= 11;
  };
  cabecalho();
  for (const t of d.lancamentos) {
    if (y < M + 30) {
      pagina = pdf.addPage([L, A]);
      y = A - M;
      cabecalho();
    }
    const [, mm, dd] = t.data.split("-");
    texto(`${dd}/${mm}`, colunas.data, y, 8.5);
    texto(cortar(t.descricao + (t.pendente ? " (a pagar)" : ""), normal, 8.5, 200), colunas.desc, y, 8.5);
    texto(cortar(t.categoria, normal, 8.5, 104), colunas.cat, y, 8.5, normal, COR_CINZA);
    texto(cortar(t.conta, normal, 8.5, 80), colunas.conta, y, 8.5, normal, COR_CINZA);
    const cor = t.tipo === "receita" ? COR_VERDE : t.tipo === "despesa" ? COR_VERMELHO : COR_CINZA;
    direita((t.tipo === "receita" ? "+" : t.tipo === "despesa" ? "-" : "") + moeda(t.valor), colunas.valor, y, 8.5, normal, cor);
    y -= 13;
  }
  if (!d.lancamentos.length) texto("Nenhum lançamento neste mês.", M, y, 9, normal, COR_CINZA);

  // Rodapé com página
  const paginas = pdf.getPages();
  paginas.forEach((p, i) => {
    p.drawText(limpar(`VidaTrack · vidatrack.online · página ${i + 1} de ${paginas.length}`), {
      x: M,
      y: 24,
      size: 7,
      font: normal,
      color: COR_CINZA,
    });
  });

  return pdf.save();
}
