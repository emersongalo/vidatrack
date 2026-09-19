// Etapa 141 — interpreta uma frase falada em português e tenta tirar
// dela um valor em reais, o tipo (receita/despesa) e uma descrição.
// É tudo baseado em palavras-chave e um dicionário de números por
// extenso — não é IA, então frases fora do padrão esperado (ex:
// "trinta e cinco reais no mercado") podem sair erradas. A pessoa
// sempre vê o resultado no formulário antes de salvar, então um erro
// aqui só significa corrigir a mão, nunca lançar algo errado sem
// perceber.

const UNIDADES: Record<string, number> = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, três: 3, tres: 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13,
  quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
};
const DEZENAS: Record<string, number> = {
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90,
};
const CENTENAS: Record<string, number> = {
  cem: 100, cento: 100, duzentos: 200, trezentos: 300, quatrocentos: 400, quinhentos: 500,
  seiscentos: 600, setecentos: 700, oitocentos: 800, novecentos: 900,
};

/** Converte uma sequência de palavras tipo "duzentos e cinquenta e três" em 253. */
function palavrasParaNumero(palavras: string[]): number | null {
  let total = 0;
  let achouAlgo = false;
  let resto = [...palavras];

  if (resto[0] === "mil") {
    total += 1000;
    achouAlgo = true;
    resto = resto.slice(1);
    if (resto[0] === "e") resto = resto.slice(1);
  } else if (resto[0] in UNIDADES && resto[1] === "mil") {
    total += UNIDADES[resto[0]] * 1000;
    achouAlgo = true;
    resto = resto.slice(2);
    if (resto[0] === "e") resto = resto.slice(1);
  }

  if (resto[0] in CENTENAS) {
    total += CENTENAS[resto[0]];
    achouAlgo = true;
    resto = resto.slice(1);
    if (resto[0] === "e") resto = resto.slice(1);
  }
  if (resto[0] in DEZENAS) {
    total += DEZENAS[resto[0]];
    achouAlgo = true;
    resto = resto.slice(1);
    if (resto[0] === "e") resto = resto.slice(1);
  }
  if (resto[0] in UNIDADES) {
    total += UNIDADES[resto[0]];
    achouAlgo = true;
  }

  return achouAlgo ? total : null;
}

const PALAVRAS_NUMERO = new Set([
  ...Object.keys(UNIDADES), ...Object.keys(DEZENAS), ...Object.keys(CENTENAS), "mil",
]);

export type ResultadoFala = {
  tipo: "despesa" | "receita" | null;
  valor: string | null; // já formatado, ex: "35,90"
  descricao: string | null;
};

export function interpretarFala(textoOriginal: string): ResultadoFala {
  const texto = textoOriginal.toLowerCase().trim();
  const palavras = texto.split(/\s+/);

  let tipo: "despesa" | "receita" | null = null;
  if (/\b(recebi|ganhei|entrou|caiu|receita)\b/.test(texto)) tipo = "receita";
  else if (/\b(gastei|paguei|comprei|despesa)\b/.test(texto)) tipo = "despesa";

  let reais: number | null = null;
  let centavos = 0;
  let indiceInicioValor = -1;
  let indiceFimValor = -1;

  // 1) Tenta primeiro um número já em dígitos (ex: "35,90 reais", "R$ 20").
  const matchDigitos = texto.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:reais?|r\$)?/);
  if (matchDigitos) {
    const valorStr = matchDigitos[1].replace(".", ",");
    const [parteInteira, parteCentavos] = valorStr.split(",");
    reais = Number(parteInteira);
    centavos = parteCentavos ? Number(parteCentavos.padEnd(2, "0")) : 0;
    indiceInicioValor = matchDigitos.index ?? -1;
    indiceFimValor = indiceInicioValor + matchDigitos[0].length;
  } else {
    // 2) Senão, procura um trecho de números por extenso seguido de "reais".
    const indiceReais = palavras.indexOf("reais") !== -1 ? palavras.indexOf("reais") : palavras.indexOf("real");
    if (indiceReais > 0) {
      // Anda pra trás a partir de "reais" enquanto forem palavras-número (ou "e").
      let inicio = indiceReais;
      while (inicio > 0 && (PALAVRAS_NUMERO.has(palavras[inicio - 1]) || palavras[inicio - 1] === "e")) {
        inicio--;
      }
      const trechoNumero = palavras.slice(inicio, indiceReais);
      const numero = palavrasParaNumero(trechoNumero);
      if (numero !== null) {
        reais = numero;
        indiceInicioValor = palavras.slice(0, inicio).join(" ").length + (inicio > 0 ? 1 : 0);
        indiceFimValor = palavras.slice(0, indiceReais + 1).join(" ").length;

        // Centavos, se a pessoa falou ("...reais e vinte centavos").
        const restoApos = palavras.slice(indiceReais + 1);
        const indiceCentavos = restoApos.indexOf("centavos");
        if (indiceCentavos > 0 && restoApos[0] === "e") {
          const trechoCentavos = restoApos.slice(1, indiceCentavos);
          const numeroCentavos = palavrasParaNumero(trechoCentavos);
          if (numeroCentavos !== null) {
            centavos = numeroCentavos;
            // Consome só até o fim da palavra "centavos" — não o
            // texto inteiro, senão engole qualquer coisa dita depois
            // (ex: "...cinquenta centavos na farmácia").
            const palavrasConsumidas = palavras.slice(0, indiceReais + 1 + indiceCentavos + 1);
            indiceFimValor = palavrasConsumidas.join(" ").length;
          }
        }
      }
    }
  }

  const valor = reais !== null ? `${reais},${String(centavos).padStart(2, "0")}` : null;

  // Descrição = o que sobra depois de tirar o valor e as palavras de ação.
  let descricao = texto;
  if (indiceInicioValor >= 0 && indiceFimValor > indiceInicioValor) {
    descricao = texto.slice(0, indiceInicioValor) + " " + texto.slice(indiceFimValor);
  }
  descricao = descricao
    .replace(/\b(gastei|paguei|comprei|recebi|ganhei|entrou|caiu|de|do|da|dos|das|no|na|nos|nas|em|com|por|um|uma|reais?|centavos?|e)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (descricao) descricao = descricao.charAt(0).toUpperCase() + descricao.slice(1);

  return { tipo, valor, descricao: descricao || null };
}
