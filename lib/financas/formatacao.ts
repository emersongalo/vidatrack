export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function primeiroDiaDoMes(dataReferenciaISO?: string): string {
  const d = dataReferenciaISO ? new Date(dataReferenciaISO + "T00:00:00") : new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString("sv-SE");
}

export const ICONES_CATEGORIA_DESPESA = [
  "🍔", "🏠", "🚗", "💊", "🎬", "📚", "📱", "🛍️", "✈️", "🐾", "🎁", "💡",
];
export const ICONES_CATEGORIA_RECEITA = ["💼", "💰", "📈", "🏦", "🎯", "✨"];

export function nomeDoMesAtual(): string {
  return new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
