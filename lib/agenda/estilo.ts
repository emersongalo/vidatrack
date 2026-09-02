export const ICONES_DISPONIVEIS = [
  "💧", "🏃", "📖", "🧘", "🙏", "😴", "🥗", "💪",
  "📝", "🧹", "💊", "🎯", "🎸", "🚭", "💰", "☀️",
  "❤️", "🎓", "🚴", "➕", "📚", "🧠", "🎨", "🌱",
  "🦷", "🚶", "🍎", "☕️", "📵", "🧴", "🐾", "🎧",
];

// A paleta original (habito/nota/financa/neutro) ligava a cor ao
// MÓDULO do app. A partir daqui, cada hábito/tarefa pode ter sua
// própria cor vibrante, independente do módulo — é o que dá aquele
// visual "vivo" de apps como o HabitNow, onde cada hábito se destaca
// visualmente dos outros.
export const CORES_DISPONIVEIS = [
  { valor: "habito", classe: "bg-habito" },
  { valor: "nota", classe: "bg-nota" },
  { valor: "financa", classe: "bg-financa" },
  { valor: "rosa", classe: "bg-[#E5567A]" },
  { valor: "azul", classe: "bg-[#4C8FCC]" },
  { valor: "roxo", classe: "bg-[#8B5CF6]" },
  { valor: "verde", classe: "bg-[#43A876]" },
  { valor: "laranja", classe: "bg-[#E2793D]" },
  { valor: "ciano", classe: "bg-[#3FB8BD]" },
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
    case "rosa":
      return "bg-[#E5567A]/15";
    case "azul":
      return "bg-[#4C8FCC]/15";
    case "roxo":
      return "bg-[#8B5CF6]/15";
    case "verde":
      return "bg-[#43A876]/15";
    case "laranja":
      return "bg-[#E2793D]/15";
    case "ciano":
      return "bg-[#3FB8BD]/15";
    default:
      return "bg-ink-400/15";
  }
}

// Cor do TEXTO combinando com o fundo suave acima — precisa ser mais
// clara/saturada que o preenchimento sólido pra continuar legível em
// cima de um fundo escuro.
export function classeTextoCor(cor: string): string {
  switch (cor) {
    case "habito":
      return "text-habito";
    case "nota":
      return "text-nota";
    case "financa":
      return "text-financa";
    case "rosa":
      return "text-[#F0839F]";
    case "azul":
      return "text-[#7CB0DE]";
    case "roxo":
      return "text-[#A98BF7]";
    case "verde":
      return "text-[#6BC79A]";
    case "laranja":
      return "text-[#EB9A6A]";
    case "ciano":
      return "text-[#6FCBCF]";
    default:
      return "text-ink-400";
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
    case "rosa":
      return "#E5567A";
    case "azul":
      return "#4C8FCC";
    case "roxo":
      return "#8B5CF6";
    case "verde":
      return "#43A876";
    case "laranja":
      return "#E2793D";
    case "ciano":
      return "#3FB8BD";
    default:
      return "#9B9CA6";
  }
}
