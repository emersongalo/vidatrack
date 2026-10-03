// Etapa 253 — planilha .xlsx de verdade (sem biblioteca nova).
// O .csv dependia de cada app adivinhar a codificação: no Google
// Planilhas do celular os acentos viravam "AlimentaÃ§Ã£o". No .xlsx o
// texto vai sempre em UTF-8 dentro do arquivo, então abre certo em
// qualquer lugar (Excel, Google Planilhas, Numbers, WPS…).

// ---------- ZIP simples (sem compressão) ----------
const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(dados: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < dados.length; i++) c = TABELA_CRC[(c ^ dados[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function montarZip(arquivos: { nome: string; conteudo: string }[]): Uint8Array {
  const enc = new TextEncoder();
  const partes: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let posicao = 0;

  for (const a of arquivos) {
    const nome = enc.encode(a.nome);
    const dados = enc.encode(a.conteudo);
    const crc = crc32(dados);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // nomes em UTF-8
    local.setUint16(8, 0, true); // sem compressão
    local.setUint32(14, crc, true);
    local.setUint32(18, dados.length, true);
    local.setUint32(22, dados.length, true);
    local.setUint16(26, nome.length, true);
    partes.push(new Uint8Array(local.buffer), nome, dados);

    const cab = new DataView(new ArrayBuffer(46));
    cab.setUint32(0, 0x02014b50, true);
    cab.setUint16(4, 20, true);
    cab.setUint16(6, 20, true);
    cab.setUint16(8, 0x0800, true);
    cab.setUint32(16, crc, true);
    cab.setUint32(20, dados.length, true);
    cab.setUint32(24, dados.length, true);
    cab.setUint16(28, nome.length, true);
    cab.setUint32(42, posicao, true);
    central.push(new Uint8Array(cab.buffer), nome);

    posicao += 30 + nome.length + dados.length;
  }

  const tamanhoCentral = central.reduce((s, p) => s + p.length, 0);
  const fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true);
  fim.setUint16(8, arquivos.length, true);
  fim.setUint16(10, arquivos.length, true);
  fim.setUint32(12, tamanhoCentral, true);
  fim.setUint32(16, posicao, true);

  const tudo = [...partes, ...central, new Uint8Array(fim.buffer)];
  const saida = new Uint8Array(tudo.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of tudo) {
    saida.set(p, o);
    o += p.length;
  }
  return saida;
}

// ---------- XLSX ----------
export type Celula = string | number | { data: string } | null;

function xml(s: string) {
  return s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function letraColuna(i: number): string {
  let s = "";
  i++;
  while (i > 0) {
    const r = (i - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}

/** "2026-10-05" → número de série do Excel */
function serialDaData(iso: string): number {
  const [a, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(a, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000);
}

/**
 * Gera o .xlsx. Estilos: 1 = cabeçalho em negrito, 2 = data dd/mm/aaaa,
 * 3 = dinheiro 1.234,56 (o formato de exibição segue o idioma do app).
 */
export function gerarXlsx(entrada: {
  aba: string;
  cabecalho: string[];
  linhas: Celula[][];
  larguras?: number[];
  /** índices de colunas com valor em dinheiro */
  colunasDinheiro?: number[];
}): Uint8Array {
  const { cabecalho, linhas } = entrada;
  const dinheiro = new Set(entrada.colunasDinheiro ?? []);

  const celula = (v: Celula, col: number, lin: number, estiloTexto = 0) => {
    const ref = `${letraColuna(col)}${lin}`;
    if (v === null || v === "") return "";
    if (typeof v === "number") return `<c r="${ref}" s="${dinheiro.has(col) ? 3 : 0}"><v>${v}</v></c>`;
    if (typeof v === "object") return `<c r="${ref}" s="2"><v>${serialDaData(v.data)}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${estiloTexto ? ` s="${estiloTexto}"` : ""}><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
  };

  const linhasXml = [
    `<row r="1">${cabecalho.map((h, i) => celula(h, i, 1, 1)).join("")}</row>`,
    ...linhas.map((l, j) => `<row r="${j + 2}">${l.map((v, i) => celula(v, i, j + 2)).join("")}</row>`),
  ].join("");

  const cols = entrada.larguras?.length
    ? `<cols>${entrada.larguras.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>`
    : "";
  const ultimaCol = letraColuna(Math.max(0, cabecalho.length - 1));

  const planilha =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    cols +
    `<sheetData>${linhasXml}</sheetData>` +
    (linhas.length ? `<autoFilter ref="A1:${ultimaCol}${linhas.length + 1}"/>` : "") +
    `</worksheet>`;

  const estilos =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>` +
    `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
    `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="4">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
    `<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
    `<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
    `</cellXfs>` +
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
    `</styleSheet>`;

  return montarZip([
    {
      nome: "[Content_Types].xml",
      conteudo:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        `</Types>`,
    },
    {
      nome: "_rels/.rels",
      conteudo:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`,
    },
    {
      nome: "xl/workbook.xml",
      conteudo:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets><sheet name="${xml(entrada.aba.slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets>` +
        `</workbook>`,
    },
    {
      nome: "xl/_rels/workbook.xml.rels",
      conteudo:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`,
    },
    { nome: "xl/worksheets/sheet1.xml", conteudo: planilha },
    { nome: "xl/styles.xml", conteudo: estilos },
  ]);
}
