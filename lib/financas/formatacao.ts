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

export function ultimoDiaDoMes(dataReferenciaISO?: string): string {
  const d = dataReferenciaISO ? new Date(dataReferenciaISO + "T00:00:00") : new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toLocaleDateString("sv-SE");
}

export type PresetPeriodo = "este_mes" | "mes_passado" | "ultimos_30" | "este_ano" | "tudo";

export function calcularPeriodo(preset: PresetPeriodo): { inicio: string; fim: string } {
  const hoje = new Date();
  const hojeISO = hoje.toLocaleDateString("sv-SE");

  switch (preset) {
    case "este_mes":
      return { inicio: primeiroDiaDoMes(), fim: hojeISO };
    case "mes_passado": {
      const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toLocaleDateString("sv-SE");
      return { inicio: primeiroDiaDoMes(mesPassado), fim: ultimoDiaDoMes(mesPassado) };
    }
    case "ultimos_30": {
      const trintaDiasAtras = new Date(hoje);
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
      return { inicio: trintaDiasAtras.toLocaleDateString("sv-SE"), fim: hojeISO };
    }
    case "este_ano":
      return { inicio: `${hoje.getFullYear()}-01-01`, fim: hojeISO };
    case "tudo":
      return { inicio: "2000-01-01", fim: hojeISO };
  }
}

export const ICONES_CATEGORIA_DESPESA = [
  "🍔", "🏠", "🚗", "💊", "🎬", "📚", "📱", "🛍️", "✈️", "🐾", "🎁", "💡",
];
export const ICONES_CATEGORIA_RECEITA = ["💼", "💰", "📈", "🏦", "🎯", "✨"];

export function nomeDoMesAtual(): string {
  return new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
