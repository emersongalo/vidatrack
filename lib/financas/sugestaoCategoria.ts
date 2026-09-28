// Etapa 215 — sugere a categoria pela descrição, aprendendo com o que a
// pessoa já lançou. Se não houver histórico, usa palavras-chave comuns.

export function normalizarTexto(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\(\d+\/\d+\)/g, " ") // "(2/10)" de parcelas
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b\d+\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function palavras(s: string): string[] {
  return normalizarTexto(s)
    .split(" ")
    .filter((p) => p.length >= 3 && !PALAVRAS_VAZIAS.has(p));
}

const PALAVRAS_VAZIAS = new Set(["com", "para", "pra", "dos", "das", "de", "do", "da", "the", "compra", "pagamento", "pgto", "pix"]);

// categoria (por nome, normalizado) → palavras que costumam aparecer
const DICIONARIO: { nomes: string[]; chaves: string[] }[] = [
  { nomes: ["mercado", "supermercado", "alimentacao", "comida"], chaves: ["mercado", "supermercado", "atacadao", "assai", "carrefour", "hortifruti", "acougue", "sacolao", "feira"] },
  { nomes: ["restaurante", "alimentacao", "lanche", "delivery", "comida"], chaves: ["ifood", "restaurante", "lanche", "lanchonete", "pizza", "pizzaria", "hamburguer", "burger", "padaria", "cafe", "rappi", "sushi", "mcdonalds", "bk"] },
  { nomes: ["transporte", "combustivel", "carro", "uber"], chaves: ["uber", "posto", "gasolina", "combustivel", "etanol", "estacionamento", "pedagio", "onibus", "metro", "passagem", "ipiranga", "shell"] },
  { nomes: ["saude", "farmacia"], chaves: ["farmacia", "drogaria", "drogasil", "raia", "pacheco", "remedio", "consulta", "medico", "dentista", "exame", "laboratorio", "plano"] },
  { nomes: ["moradia", "casa", "contas"], chaves: ["aluguel", "condominio", "luz", "energia", "enel", "cemig", "copel", "agua", "sabesp", "gas", "iptu", "internet", "vivo", "claro", "tim", "oi"] },
  { nomes: ["assinaturas", "assinatura", "lazer", "streaming"], chaves: ["netflix", "spotify", "disney", "prime", "amazon", "hbo", "max", "globoplay", "youtube", "deezer", "icloud", "google"] },
  { nomes: ["lazer", "diversao", "entretenimento"], chaves: ["cinema", "show", "ingresso", "bar", "viagem", "hotel", "passeio"] },
  { nomes: ["educacao", "estudos", "cursos"], chaves: ["escola", "faculdade", "curso", "livro", "livraria", "mensalidade", "udemy", "material"] },
  { nomes: ["pets", "pet", "animais"], chaves: ["petshop", "pet", "racao", "veterinario", "vet"] },
  { nomes: ["vestuario", "roupas", "compras"], chaves: ["roupa", "renner", "riachuelo", "cea", "shein", "sapato", "tenis", "loja"] },
  { nomes: ["salario", "renda", "trabalho"], chaves: ["salario", "pagamento", "adiantamento", "ferias", "decimo"] },
  { nomes: ["freelance", "extra", "renda extra"], chaves: ["freela", "freelance", "servico", "bico"] },
];

type Transacao = { tipo: string; descricao?: string | null; categoria_id?: string | null; data?: string };
type Categoria = { id: string; nome: string; tipo: string };

/**
 * Devolve o id da categoria mais provável, ou null. Pontua cada lançamento
 * passado do mesmo tipo pela semelhança da descrição; os mais recentes
 * pesam um pouco mais.
 */
export function sugerirCategoria(
  descricao: string,
  tipo: string,
  historico: Transacao[],
  categorias: Categoria[]
): string | null {
  const alvo = normalizarTexto(descricao);
  if (alvo.length < 3) return null;
  const validas = new Map(categorias.filter((c) => c.tipo === tipo).map((c) => [c.id, c]));
  if (validas.size === 0) return null;
  const pAlvo = palavras(descricao);

  const pontos = new Map<string, number>();
  const hist = historico
    .filter((t) => t.tipo === tipo && t.categoria_id && validas.has(t.categoria_id) && t.descricao)
    .sort((a, b) => String(b.data ?? "").localeCompare(String(a.data ?? "")))
    .slice(0, 800);
  hist.forEach((t, i) => {
    const d = normalizarTexto(t.descricao);
    if (!d) return;
    let p = 0;
    if (d === alvo) p = 10;
    else if (d.startsWith(alvo) || alvo.startsWith(d)) p = 6;
    else {
      const pd = new Set(palavras(d));
      const comuns = pAlvo.filter((w) => pd.has(w)).length;
      if (comuns) p = comuns * 3 + (pAlvo[0] && pd.has(pAlvo[0]) ? 1 : 0);
    }
    if (!p) return;
    const pesoRecencia = i < 50 ? 1.2 : 1;
    pontos.set(t.categoria_id!, (pontos.get(t.categoria_id!) ?? 0) + p * pesoRecencia);
  });

  let melhor: string | null = null;
  let melhorPts = 0;
  for (const [id, p] of pontos) {
    if (p > melhorPts) {
      melhor = id;
      melhorPts = p;
    }
  }
  if (melhor && melhorPts >= 3) return melhor;

  // Sem histórico parecido: dicionário de palavras-chave
  const setAlvo = new Set(pAlvo.concat(alvo.split(" ")));
  for (const grupo of DICIONARIO) {
    if (!grupo.chaves.some((k) => setAlvo.has(k))) continue;
    for (const nome of grupo.nomes) {
      const cat = [...validas.values()].find((c) => normalizarTexto(c.nome).includes(nome));
      if (cat) return cat.id;
    }
  }
  return null;
}
