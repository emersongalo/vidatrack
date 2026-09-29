export type TransacaoImportada = {
  data: string; // ISO (YYYY-MM-DD)
  valor: number; // sempre positivo — o tipo diz se é receita ou despesa
  tipo: "receita" | "despesa";
  descricao: string;
  /** Etapa 221 — como veio do banco (antes de limpar), pra achar duplicado de importação antiga */
  descricaoOriginal?: string;
  /** Etapa 221 — categoria sugerida/escolhida na tela */
  categoriaId?: string | null;
};

/**
 * Etapa 221 — tira o "ruído" que o banco coloca na descrição
 * ("COMPRA CARTAO DEB MC 12/09 PADARIA SAO JOSE" → "Padaria Sao Jose").
 * Conservador: se sobrar pouca coisa, devolve o original.
 */
export function limparDescricaoBanco(original: string): string {
  let d = original.replace(/\s+/g, " ").trim();
  const prefixos = [
    /^compra (com )?cart[aã]o( (de )?(d[eé]b(ito)?|cr[eé]d(ito)?)\b\.?)?( (mc|visa|elo|master)\b)?/i,
    /^compra (no )?d[eé]bito/i,
    /^pix (enviado|recebido|transf\.?|transfer[eê]ncia)( para| de)?\b/i,
    /^transfer[eê]ncia (enviada|recebida)( pelo pix)?( para| de)?/i,
    /^pagamento (efetuado|de boleto|boleto)\b/i,
    /^pgto\.?/i,
    /^deb\.? autom\.?( de)?/i,
    /^d[eé]bito autom[aá]tico/i,
    /^ted (enviada|recebida)\b/i,
    /^doc (enviado|recebido)\b/i,
  ];
  for (const p of prefixos) d = d.replace(p, " ").trim();
  d = d
    .replace(/^[-–:*]\s*/, "")
    .replace(/\b\d{2}\/\d{2}(\/\d{2,4})?\b/g, " ") // datas
    .replace(/\b\d{2}:\d{2}\b/g, " ") // horas
    .replace(/\*{2,}\d*/g, " ") // ****1234
    .replace(/\s+[-–]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (d.replace(/[^a-z0-9]/gi, "").length < 3) return original.trim();
  // TUDO MAIÚSCULO → Só As Iniciais
  if (d === d.toUpperCase() && /[A-Z]/.test(d)) {
    d = d.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_m, esp, l) => esp + l.toUpperCase());
  }
  return d;
}

/** Valor em texto: "1.234,56", "-1234.56", "R$ 12,00". */
export function lerValor(bruto: string): number {
  let s = bruto.replace(/[R$\s"]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

/** Data em texto: "05/09/2026", "05/09/26" ou "2026-09-05". */
export function lerData(bruta: string): string | null {
  const s = bruta.trim().replace(/"/g, "");
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const ano = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${ano}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

/** Separa uma linha de CSV respeitando aspas ("Padaria, centro"). */
export function separarLinhaCSV(linha: string, delimitador: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      if (aspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else aspas = !aspas;
    } else if (c === delimitador && !aspas) {
      campos.push(atual);
      atual = "";
    } else atual += c;
  }
  campos.push(atual);
  return campos.map((c) => c.trim());
}

/**
 * OFX vem em duas variações: SGML antigo (tags sem fechamento,
 * `<DTPOSTED>20260905120000`) ou XML mais novo (com fechamento,
 * `<DTPOSTED>20260905</DTPOSTED>`). Esse parser lida com as duas —
 * separa por `<STMTTRN>` e lê cada campo com regex, sem se importar
 * se tem tag de fechamento ou não.
 */
export function analisarOFX(conteudo: string): { transacoes: TransacaoImportada[] } | { erro: string } {
  const blocos = conteudo.split(/<STMTTRN>/i).slice(1);
  if (blocos.length === 0) {
    return { erro: "Não encontrei nenhuma transação nesse arquivo OFX." };
  }

  const transacoes: TransacaoImportada[] = [];

  for (const bloco of blocos) {
    const trecho = bloco.split(/<\/STMTTRN>|<STMTTRN>/i)[0];

    const dataMatch = trecho.match(/<DTPOSTED>(\d{8})/i);
    const valorMatch = trecho.match(/<TRNAMT>([-\d.,]+)/i);
    const memoMatch = trecho.match(/<MEMO>([^\n\r<]+)/i);
    const nameMatch = trecho.match(/<NAME>([^\n\r<]+)/i);

    if (!dataMatch || !valorMatch) continue;

    const ano = dataMatch[1].slice(0, 4);
    const mes = dataMatch[1].slice(4, 6);
    const dia = dataMatch[1].slice(6, 8);
    const valor = lerValor(valorMatch[1]);
    if (isNaN(valor)) continue;

    const original = (memoMatch?.[1] || nameMatch?.[1] || "Sem descrição").trim();
    if (valor === 0) continue;

    transacoes.push({
      data: `${ano}-${mes}-${dia}`,
      valor: Math.abs(valor),
      tipo: valor >= 0 ? "receita" : "despesa",
      descricao: limparDescricaoBanco(original),
      descricaoOriginal: original,
    });
  }

  if (transacoes.length === 0) {
    return { erro: "O arquivo tem o formato OFX, mas não consegui ler nenhuma transação válida dele." };
  }

  return { transacoes };
}

/**
 * CSV genérico — tenta reconhecer colunas de Data, Descrição e Valor
 * pelo nome do cabeçalho (aceita variações comuns em português).
 * Aceita vírgula ou ponto-e-vírgula como separador, e datas no
 * formato DD/MM/AAAA (padrão brasileiro).
 */
export function analisarCSV(conteudo: string): { transacoes: TransacaoImportada[] } | { erro: string } {
  const linhas = conteudo.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  if (linhas.length < 2) {
    return { erro: "O arquivo CSV parece vazio ou só tem o cabeçalho." };
  }

  const delimitador = linhas[0].includes(";") ? ";" : ",";
  const cabecalho = separarLinhaCSV(linhas[0], delimitador).map((c) => c.replace(/"/g, "").trim().toLowerCase());

  const idxData = cabecalho.findIndex((c) => c.includes("data") || c === "date");
  const idxDescricao = cabecalho.findIndex(
    (c) => c.includes("descri") || c.includes("hist") || c === "title" || c.includes("estabelecimento") || c === "memo"
  );
  const idxValor = cabecalho.findIndex((c) => c.includes("valor") || c === "amount");
  // Etapa 221 — CSV da fatura do cartão (ex: Nubank: date,title,amount): valor positivo = gasto
  const ehFaturaCartao = cabecalho.includes("title") && cabecalho.includes("amount");

  if (idxData === -1 || idxValor === -1) {
    return {
      erro: 'Não encontrei colunas chamadas "Data" e "Valor" no cabeçalho do CSV. Confira se a primeira linha do arquivo tem esses nomes.',
    };
  }

  const transacoes: TransacaoImportada[] = [];

  for (const linha of linhas.slice(1)) {
    if (!linha.trim()) continue;
    const campos = separarLinhaCSV(linha, delimitador);

    const data = lerData(campos[idxData] ?? "");
    if (!data) continue;

    let valor = lerValor(campos[idxValor] ?? "");
    if (isNaN(valor) || valor === 0) continue;
    if (ehFaturaCartao) valor = -valor;

    const original = idxDescricao >= 0 ? campos[idxDescricao]?.replace(/"/g, "").trim() || "Sem descrição" : "Sem descrição";
    transacoes.push({
      data,
      valor: Math.abs(valor),
      tipo: valor >= 0 ? "receita" : "despesa",
      descricao: limparDescricaoBanco(original),
      descricaoOriginal: original,
    });
  }

  if (transacoes.length === 0) {
    return { erro: "Não consegui ler nenhuma linha válida desse CSV — confira o formato das datas e valores." };
  }

  return { transacoes };
}

export function analisarArquivoExtrato(
  nomeArquivo: string,
  conteudo: string
): { transacoes: TransacaoImportada[] } | { erro: string } {
  const ehOFX = nomeArquivo.toLowerCase().endsWith(".ofx") || conteudo.includes("<OFX>");
  return ehOFX ? analisarOFX(conteudo) : analisarCSV(conteudo);
}
