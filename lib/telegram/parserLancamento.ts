export type LancamentoInterpretado = {
  tipo: "receita" | "despesa";
  valor: number;
  descricao: string;
  categoriaId: string | null;
  categoriaNome: string | null;
  contaId: string | null;
  contaNome: string | null;
};

const PALAVRAS_RECEITA = [
  "recebi", "salário", "salario", "ganhei", "caiu", "entrada",
  "freela", "freelance", "pagamento recebido", "adiantamento",
];

const VERBOS_INICIO = ["comprei", "gastei", "paguei", "recebi", "ganhei"];

// Bate com os nomes das categorias padrão criadas desde a Etapa 29 —
// se a pessoa renomeou a categoria, não encontra e fica "sem categoria"
// (não é mágica, é combinação de palavras-chave mesmo).
const PALAVRAS_CATEGORIA: Record<string, string[]> = {
  "Alimentação": [
    "mercado", "supermercado", "almoço", "almoco", "jantar", "lanche",
    "restaurante", "ifood", "comida", "padaria", "feira", "café", "cafe",
  ],
  "Moradia": [
    "aluguel", "condomínio", "condominio", "luz", "energia", "água conta",
    "internet", "gás", "gas conta", "iptu",
  ],
  "Transporte": [
    "uber", "gasolina", "combustível", "combustivel", "ônibus", "onibus",
    "passagem", "99", "estacionamento", "pedágio", "pedagio", "metrô", "metro",
  ],
  "Lazer": ["cinema", "show", "bar", "festa", "viagem", "netflix", "spotify", "jogo", "balada"],
  "Saúde": [
    "remédio", "remedio", "farmácia", "farmacia", "médico", "medico",
    "consulta", "exame", "academia", "dentista",
  ],
  "Outras despesas": ["roupa", "calça", "calca", "camisa", "sapato", "tênis", "tenis", "jeans", "presente"],
  "Salário": ["salário", "salario"],
};

function extrairValor(texto: string, temSinalFinanceiro: boolean): number | null {
  // Formato brasileiro: "259,90", "3.845,00", "R$ 1.500,00"
  const comCentavos = texto.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/);
  if (comCentavos) {
    return Number(comCentavos[1].replace(/\./g, "").replace(",", "."));
  }
  // Só com "R$" na frente, sem centavos: "R$50", "R$ 200"
  const soReais = texto.match(/R\$\s*(\d+)/i);
  if (soReais) {
    return Number(soReais[1]);
  }
  // Último recurso: um número solto de 2+ dígitos (sem R$, sem
  // vírgula) — só confia nisso se a mensagem já tiver um verbo
  // financeiro claro (comprei/gastei/paguei/recebi), senão qualquer
  // hora ("14:30"), data ("15/03") ou quantidade vira "lançamento"
  // por engano.
  if (temSinalFinanceiro) {
    const numeroSolto = texto.match(/\b(\d{2,6})\b(?!\s*x\b)/i);
    if (numeroSolto) return Number(numeroSolto[1]);
  }
  return null;
}

function detectarTipo(texto: string): "receita" | "despesa" {
  const minusculo = texto.toLowerCase();
  return PALAVRAS_RECEITA.some((p) => minusculo.includes(p)) ? "receita" : "despesa";
}

function extrairDescricao(texto: string, valorEncontradoComoTexto: string): string {
  let descricao = texto;

  const idxPor = descricao.toLowerCase().indexOf(" por ");
  if (idxPor > 0) {
    descricao = descricao.slice(0, idxPor);
  } else {
    const idxValor = descricao.indexOf(valorEncontradoComoTexto);
    if (idxValor > 0) descricao = descricao.slice(0, idxValor);
  }

  descricao = descricao
    .replace(new RegExp(`^(${VERBOS_INICIO.join("|")})\\s+`, "i"), "")
    .replace(/^(um|uma|uns|umas)\s+/i, "")
    .trim();

  if (!descricao) descricao = "Lançamento via Telegram";
  return descricao.charAt(0).toUpperCase() + descricao.slice(1);
}

function encontrarCategoria(
  texto: string,
  tipo: "receita" | "despesa",
  categoriasDoUsuario: { id: string; nome: string; tipo: string }[]
): { id: string; nome: string } | null {
  const minusculo = texto.toLowerCase();

  for (const [nomeCategoria, palavras] of Object.entries(PALAVRAS_CATEGORIA)) {
    if (!palavras.some((p) => minusculo.includes(p))) continue;

    const categoriaReal = categoriasDoUsuario.find(
      (c) => c.nome.toLowerCase() === nomeCategoria.toLowerCase() && c.tipo === tipo
    );
    if (categoriaReal) return { id: categoriaReal.id, nome: categoriaReal.nome };
  }

  return null;
}

function encontrarConta(
  texto: string,
  contasDoUsuario: { id: string; nome: string }[]
): { id: string; nome: string } | null {
  const minusculo = texto.toLowerCase();

  const porNome = contasDoUsuario.find((c) => minusculo.includes(c.nome.toLowerCase()));
  if (porNome) return porNome;

  return null;
}

export function interpretarMensagem(
  textoOriginal: string,
  contasDoUsuario: { id: string; nome: string }[],
  categoriasDoUsuario: { id: string; nome: string; tipo: string }[]
): LancamentoInterpretado | null {
  const texto = textoOriginal.trim();
  if (!texto) return null;

  const comCentavos = texto.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/);
  const soReais = texto.match(/R\$\s*(\d+)/i);
  const trechoValor = comCentavos?.[1] ?? soReais?.[0] ?? "";

  const minusculo = texto.toLowerCase();
  const temSinalFinanceiro =
    VERBOS_INICIO.some((v) => minusculo.includes(v)) || PALAVRAS_RECEITA.some((p) => minusculo.includes(p));

  const valor = extrairValor(texto, temSinalFinanceiro);
  if (valor === null || valor <= 0) return null; // sem valor reconhecível, não é um lançamento

  const tipo = detectarTipo(texto);
  const descricao = extrairDescricao(texto, trechoValor);
  const categoria = encontrarCategoria(texto, tipo, categoriasDoUsuario);
  const conta = encontrarConta(texto, contasDoUsuario) ?? contasDoUsuario[0] ?? null;

  return {
    tipo,
    valor,
    descricao,
    categoriaId: categoria?.id ?? null,
    categoriaNome: categoria?.nome ?? null,
    contaId: conta?.id ?? null,
    contaNome: conta?.nome ?? null,
  };
}
