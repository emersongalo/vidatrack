// Etapa 222 — o ícone do banco é sempre sigla + cor da instituição.
// Não usamos logotipos (são marcas registradas) nem imagem enviada
// pela pessoa. Pra adicionar um banco, é só incluir uma linha aqui.
export type Banco = {
  id: string;
  nome: string;
  cor: string; // cor associada à marca — não é o logotipo, só um tom de referência
  /** texto do selo (2 letras) */
  sigla: string;
  /** cor da sigla por cima da cor do banco */
  texto: string;
};

export const BANCOS: Banco[] = [
  { id: "outro", nome: "Outro / genérico", cor: "#6B6C76", sigla: "", texto: "#FFFFFF" },
  { id: "nubank", nome: "Nubank", cor: "#820AD1", sigla: "NU", texto: "#FFFFFF" },
  { id: "inter", nome: "Inter", cor: "#FF7A00", sigla: "IN", texto: "#FFFFFF" },
  { id: "itau", nome: "Itaú", cor: "#EC7000", sigla: "IT", texto: "#FFFFFF" },
  { id: "bradesco", nome: "Bradesco", cor: "#CC092F", sigla: "BR", texto: "#FFFFFF" },
  { id: "santander", nome: "Santander", cor: "#EC0000", sigla: "SA", texto: "#FFFFFF" },
  { id: "c6", nome: "C6 Bank", cor: "#242424", sigla: "C6", texto: "#FFFFFF" },
  { id: "caixa", nome: "Caixa", cor: "#0070B8", sigla: "CX", texto: "#F39200" },
  { id: "bb", nome: "Banco do Brasil", cor: "#F7DC00", sigla: "BB", texto: "#0038A8" },
  { id: "picpay", nome: "PicPay", cor: "#21C25E", sigla: "PP", texto: "#FFFFFF" },
  { id: "mercadopago", nome: "Mercado Pago", cor: "#00B1EA", sigla: "MP", texto: "#FFFFFF" },
];

const BANCO_PADRAO: Banco = BANCOS[0];

/**
 * Sempre retorna um banco válido (nunca undefined) — se o id não for
 * reconhecido ou vier vazio, cai no "Outro / genérico" com cor neutra.
 */
export function bancoPorId(id: string | null | undefined): Banco {
  if (!id) return BANCO_PADRAO;
  return BANCOS.find((b) => b.id === id) ?? BANCO_PADRAO;
}

/** Sigla do selo: a do banco; sem banco conhecido, as 2 primeiras letras do nome da conta. */
export function siglaDoSelo(bancoId: string | null | undefined, nomeConta?: string | null, tipo?: string | null): string {
  const banco = bancoPorId(bancoId);
  if (banco.sigla) return banco.sigla;
  if (tipo === "carteira") return "$";
  const letras = (nomeConta ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim();
  if (!letras) return "";
  const palavras = letras.split(/\s+/);
  const sigla = palavras.length > 1 ? palavras[0][0] + palavras[1][0] : letras.slice(0, 2);
  return sigla.toUpperCase();
}
