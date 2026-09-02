export type Banco = {
  id: string;
  nome: string;
  cor: string; // cor associada à marca — não é o logotipo, só um tom de referência
};

export const BANCOS: Banco[] = [
  { id: "outro", nome: "Outro / genérico", cor: "#6B6C76" },
  { id: "nubank", nome: "Nubank", cor: "#820AD1" },
  { id: "inter", nome: "Inter", cor: "#FF7A00" },
  { id: "itau", nome: "Itaú", cor: "#EC7000" },
  { id: "bradesco", nome: "Bradesco", cor: "#CC092F" },
  { id: "santander", nome: "Santander", cor: "#EC0000" },
  { id: "c6", nome: "C6 Bank", cor: "#242424" },
  { id: "caixa", nome: "Caixa", cor: "#0070B8" },
  { id: "bb", nome: "Banco do Brasil", cor: "#F7DC00" },
  { id: "picpay", nome: "PicPay", cor: "#21C25E" },
  { id: "mercadopago", nome: "Mercado Pago", cor: "#00B1EA" },
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
