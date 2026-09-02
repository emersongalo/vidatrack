export const ICONES_DISPONIVEIS = [
  "💧", "🏃", "📖", "🧘", "🙏", "😴", "🥗", "💪",
  "📝", "🧹", "💊", "🎯", "🎸", "🚭", "💰", "☀️",
];

export const CORES_DISPONIVEIS = [
  { valor: "habito", classe: "bg-habito" },
  { valor: "nota", classe: "bg-nota" },
  { valor: "financa", classe: "bg-financa" },
  { valor: "neutro", classe: "bg-ink-400" },
];

export function classeCor(cor: string): string {
  const encontrada = CORES_DISPONIVEIS.find((c) => c.valor === cor);
  return encontrada ? encontrada.classe : "bg-ink-400";
}

// Classes completas e literais (não concatenadas) para o Tailwind
// conseguir detectar e gerar o CSS corretamente.
export function classeFundoSuave(cor: string): string {
  switch (cor) {
    case "habito":
      return "bg-habito/15";
    case "nota":
      return "bg-nota/15";
    case "financa":
      return "bg-financa/15";
    default:
      return "bg-ink-400/15";
  }
}

// Valores hexadecimais reais, para uso em gráficos (SVG/Recharts não lê
// classes do Tailwind, precisa da cor de verdade).
export function hexDaCor(cor: string): string {
  switch (cor) {
    case "habito":
      return "#7FB894";
    case "nota":
      return "#9C8FD9";
    case "financa":
      return "#D9A24C";
    default:
      return "#9B9CA6";
  }
}
