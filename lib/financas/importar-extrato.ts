export type TransacaoImportada = {
  data: string; // ISO (YYYY-MM-DD)
  valor: number; // sempre positivo — o tipo diz se é receita ou despesa
  tipo: "receita" | "despesa";
  descricao: string;
};

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
    const valor = parseFloat(valorMatch[1]);
    if (isNaN(valor)) continue;

    const descricao = (memoMatch?.[1] || nameMatch?.[1] || "Sem descrição").trim();

    transacoes.push({
      data: `${ano}-${mes}-${dia}`,
      valor: Math.abs(valor),
      tipo: valor >= 0 ? "receita" : "despesa",
      descricao,
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
  const linhas = conteudo.trim().split(/\r?\n/);
  if (linhas.length < 2) {
    return { erro: "O arquivo CSV parece vazio ou só tem o cabeçalho." };
  }

  const delimitador = linhas[0].includes(";") ? ";" : ",";
  const cabecalho = linhas[0].split(delimitador).map((c) => c.trim().toLowerCase());

  const idxData = cabecalho.findIndex((c) => c.includes("data"));
  const idxDescricao = cabecalho.findIndex((c) => c.includes("descri") || c.includes("hist"));
  const idxValor = cabecalho.findIndex((c) => c.includes("valor"));

  if (idxData === -1 || idxValor === -1) {
    return {
      erro: 'Não encontrei colunas chamadas "Data" e "Valor" no cabeçalho do CSV. Confira se a primeira linha do arquivo tem esses nomes.',
    };
  }

  const transacoes: TransacaoImportada[] = [];

  for (const linha of linhas.slice(1)) {
    if (!linha.trim()) continue;
    const campos = linha.split(delimitador);

    const dataBruta = campos[idxData]?.trim();
    const partes = dataBruta?.split("/");
    if (!partes || partes.length !== 3) continue;
    const [dia, mes, ano] = partes;
    const data = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;

    const valorBruto = campos[idxValor]?.trim().replace(/\./g, "").replace(",", ".");
    const valor = parseFloat(valorBruto ?? "");
    if (isNaN(valor)) continue;

    transacoes.push({
      data,
      valor: Math.abs(valor),
      tipo: valor >= 0 ? "receita" : "despesa",
      descricao: idxDescricao >= 0 ? campos[idxDescricao]?.trim() || "Sem descrição" : "Sem descrição",
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
