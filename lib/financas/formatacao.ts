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

export function ultimoDiaDoMes(dataReferenciaISO?: string): string {
  const d = dataReferenciaISO ? new Date(dataReferenciaISO + "T00:00:00") : new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toLocaleDateString("sv-SE");
}

export type PeriodoExtrato = "mes_atual" | "mes_passado" | "personalizado" | "tudo";

export function calcularIntervaloPeriodo(
  periodo: PeriodoExtrato,
  inicioPersonalizado?: string,
  fimPersonalizado?: string
): { inicio: string | null; fim: string | null } {
  const hoje = new Date().toLocaleDateString("sv-SE");

  if (periodo === "mes_atual") {
    return { inicio: primeiroDiaDoMes(), fim: ultimoDiaDoMes() };
  }
  if (periodo === "mes_passado") {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const iso = d.toLocaleDateString("sv-SE");
    return { inicio: primeiroDiaDoMes(iso), fim: ultimoDiaDoMes(iso) };
  }
  if (periodo === "personalizado") {
    return { inicio: inicioPersonalizado || null, fim: fimPersonalizado || hoje };
  }
  return { inicio: null, fim: null }; // "tudo"
}

export const ICONES_CATEGORIA_DESPESA = [
  "🍔", "🏠", "🚗", "💊", "🎬", "📚", "📱", "🛍️", "✈️", "🐾", "🎁", "💡",
];
export const ICONES_CATEGORIA_RECEITA = ["💼", "💰", "📈", "🏦", "🎯", "✨"];

export function nomeDoMesAtual(): string {
  return new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
