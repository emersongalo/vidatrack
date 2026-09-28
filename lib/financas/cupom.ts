// Etapa 214 — lê o texto de um cupom/nota (vindo do OCR) e tenta achar
// valor total, data e nome do estabelecimento. Regras simples, sem IA paga.

export type DadosCupom = {
  valor: string | null; // "12,34" (formato do campo de valor)
  data: string | null; // "2026-09-27"
  descricao: string | null;
};

const RE_DINHEIRO = /(\d{1,3}(?:[.\s]\d{3})*|\d+)\s*[,.]\s*(\d{2})(?!\d)/g;

function paraNumero(inteiro: string, centavos: string): number {
  return Number(inteiro.replace(/[.\s]/g, "")) + Number(centavos) / 100;
}

export function formatarValorBR(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function valoresNaLinha(linha: string): number[] {
  const achados: number[] = [];
  for (const m of Array.from(linha.matchAll(RE_DINHEIRO))) {
    const n = paraNumero(m[1], m[2]);
    if (n > 0 && n < 1_000_000) achados.push(n);
  }
  return achados;
}

function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
}

const PALAVRAS_TOTAL = [
  "VALOR A PAGAR",
  "VALOR PAGO",
  "TOTAL A PAGAR",
  "VALOR TOTAL",
  "TOTAL R$",
  "TOTAL GERAL",
  "TOTAL",
];
const PALAVRAS_IGNORAR_TOTAL = ["SUBTOTAL", "TOTAL DE ITENS", "QTD", "TRIBUTOS", "IMPOSTOS", "LEI 12.741", "TROCO", "DESCONTO"];

export function acharValorTotal(linhas: string[]): number | null {
  const norm = linhas.map(semAcento);
  for (const palavra of PALAVRAS_TOTAL) {
    for (let i = 0; i < norm.length; i++) {
      const l = norm[i];
      if (!l.includes(palavra)) continue;
      if (PALAVRAS_IGNORAR_TOTAL.some((p) => l.includes(p))) continue;
      const aqui = valoresNaLinha(linhas[i]);
      if (aqui.length) return aqui[aqui.length - 1];
      const prox = linhas[i + 1] ? valoresNaLinha(linhas[i + 1]) : [];
      if (prox.length) return prox[prox.length - 1];
    }
  }
  // Sem "TOTAL" legível: pega o maior valor (evitando linhas de troco/tributos)
  let maior: number | null = null;
  norm.forEach((l, i) => {
    if (/TROCO|TRIBUTO|IMPOSTO|CNPJ|CPF/.test(l)) return;
    for (const v of valoresNaLinha(linhas[i])) if (maior === null || v > maior) maior = v;
  });
  return maior;
}

export function acharData(texto: string, hojeISO?: string): string | null {
  const re = /(\d{2})[\/.-](\d{2})[\/.-](\d{4}|\d{2})(?!\d)/g;
  const hoje = hojeISO ?? new Date().toLocaleDateString("sv-SE");
  for (const m of Array.from(texto.matchAll(re))) {
    const d = Number(m[1]);
    const mes = Number(m[2]);
    let ano = Number(m[3]);
    if (m[3].length === 2) ano += 2000;
    if (d < 1 || d > 31 || mes < 1 || mes > 12 || ano < 2000) continue;
    const iso = `${ano}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dt = new Date(`${iso}T12:00:00`);
    if (dt.getDate() !== d) continue; // 31/02 etc.
    if (iso > hoje) continue; // cupom não tem data futura
    return iso;
  }
  return null;
}

const LIXO_CABECALHO = /CNPJ|CPF|\bIE\b|INSCR|CUPOM|DOCUMENTO|DANFE|NFC-?E|EXTRATO|CONSUMIDOR|SAT\b|RUA |AV\.|AVENIDA|FONE|TEL|CEP|ENDERECO|BAIRRO|\d{2}\/\d{2}/;

export function acharEstabelecimento(linhas: string[]): string | null {
  for (const bruta of linhas.slice(0, 8)) {
    const linha = bruta.replace(/[^A-Za-zÀ-ÿ\d&.\- ]/g, " ").replace(/\s+/g, " ").trim();
    const letras = (linha.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
    if (letras < 4 || letras < linha.length * 0.6) continue;
    if (LIXO_CABECALHO.test(semAcento(linha))) continue;
    const semSufixo = linha.replace(/\b(LTDA|ME|EPP|EIRELI|S\.?A\.?)\b\.?/gi, "").trim();
    const nome = semSufixo
      .toLowerCase()
      .replace(/(^|\s)[a-zà-ÿ]/g, (c) => c.toUpperCase())
      .slice(0, 60);
    if (nome.length >= 3) return nome;
  }
  return null;
}

export function extrairDadosCupom(texto: string, hojeISO?: string): DadosCupom {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const total = acharValorTotal(linhas);
  return {
    valor: total !== null ? formatarValorBR(total) : null,
    data: acharData(texto, hojeISO),
    descricao: acharEstabelecimento(linhas),
  };
}
