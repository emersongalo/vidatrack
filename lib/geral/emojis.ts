/**
 * Etapa 272 — emojis prontos pra categorias, hábitos e tarefas.
 *
 * O campo "icone" no banco é texto livre: quando o valor é o nome de um
 * ícone (ex: "Utensils") mostra o desenho; quando é um emoji (ex: "🍔")
 * mostra o emoji. Nada muda no banco — só ganhamos mais opções.
 */

export type GrupoEmoji = { titulo: string; emojis: string[] };

export const EMOJIS_CATEGORIA: GrupoEmoji[] = [
  { titulo: "Comida", emojis: ["🍔", "🍕", "🍟", "🌭", "🌮", "🍣", "🍜", "🍝", "🥗", "🍱", "🥩", "🍗", "🥖", "🥐", "🍞", "🧀", "🥚", "🍎", "🍌", "🍇", "🥦", "🥕", "🍰", "🍩", "🍫", "🍦", "🍿", "☕", "🧃", "🥤", "🍺", "🍷", "🛒", "🧺"] },
  { titulo: "Casa e contas", emojis: ["🏠", "🏡", "🏢", "🔑", "🛋️", "🛏️", "🛁", "🚿", "🧹", "🧺", "🧼", "🧽", "💡", "⚡", "🔌", "💧", "🔥", "📶", "📺", "📱", "💻", "📞", "🧾", "📄", "🛠️", "🔧", "🔨", "🪴", "🌱"] },
  { titulo: "Transporte", emojis: ["🚗", "🚙", "🏍️", "🛵", "🚲", "🛴", "🚌", "🚇", "🚆", "🚕", "⛽", "🅿️", "🚦", "🛞", "✈️", "🚢", "🧳", "🗺️", "🏨", "🏖️", "⛺"] },
  { titulo: "Saúde e beleza", emojis: ["💊", "💉", "🩺", "🏥", "🦷", "👓", "🧠", "❤️‍🩹", "🩹", "🧴", "💄", "💅", "💇", "💈", "🧖", "🏋️", "🧘", "🏃", "⚽", "🏊"] },
  { titulo: "Lazer", emojis: ["🎬", "🎮", "🎲", "🎧", "🎵", "🎸", "🎤", "🎟️", "🎭", "🎨", "📷", "📚", "🎉", "🎂", "🎁", "🎈", "🍻", "🏟️", "🎡", "🏝️"] },
  { titulo: "Compras", emojis: ["🛍️", "👕", "👖", "👗", "👟", "👠", "👜", "🕶️", "⌚", "💍", "💎", "🧸", "📦", "🏷️", "🪑", "🖥️", "🎧"] },
  { titulo: "Família e pets", emojis: ["👶", "🍼", "🧒", "👨‍👩‍👧", "👪", "💑", "🧓", "🎒", "🏫", "🎓", "✏️", "🐶", "🐱", "🐾", "🦴", "🐟", "🐦", "🐰"] },
  { titulo: "Dinheiro e trabalho", emojis: ["💰", "💵", "💸", "🪙", "💳", "🏦", "🐷", "📈", "📉", "📊", "💼", "🏭", "🧑‍💻", "🤝", "🏆", "⭐", "🎯", "🧮", "📑", "⚖️", "🏛️", "🛡️", "☂️"] },
  { titulo: "Outros", emojis: ["⛪", "🙏", "🤲", "💝", "🌎", "♻️", "🚬", "🎰", "📮", "✨", "🔔", "❓", "📌", "🚩"] },
];

export const EMOJIS_HABITO: GrupoEmoji[] = [
  { titulo: "Corpo", emojis: ["💧", "🥤", "🏃", "🚶", "🏋️", "🧘", "🚴", "🏊", "⚽", "🤸", "🧗", "💪", "🥗", "🍎", "🥦", "🍳", "💊", "🦷", "😴", "🛌"] },
  { titulo: "Mente", emojis: ["📖", "📚", "✍️", "📝", "🧠", "🧩", "🎓", "🌐", "🗣️", "💻", "🎯", "✅", "🗓️", "⏰", "⏳", "🤔"] },
  { titulo: "Bem-estar", emojis: ["🧘", "🌿", "🌱", "🌸", "🌞", "🌅", "🌙", "🙏", "⛪", "❤️", "😊", "🫶", "🛀", "🕯️", "🌊", "🏞️"] },
  { titulo: "Casa", emojis: ["🧹", "🧺", "🧽", "🍽️", "🛏️", "🪴", "🗑️", "👕", "🧼", "🛒", "🍳", "🔧"] },
  { titulo: "Lazer", emojis: ["🎸", "🎹", "🎤", "🎧", "🎨", "📷", "🎮", "🎬", "🧶", "♟️", "🎲", "📺"] },
  { titulo: "Pessoas", emojis: ["👨‍👩‍👧", "👶", "💑", "📞", "💬", "✉️", "🤝", "🐶", "🐱", "🐾"] },
  { titulo: "Dinheiro", emojis: ["💰", "🐷", "🪙", "💳", "📊", "💼"] },
  { titulo: "Parar de", emojis: ["🚭", "🚫", "📵", "🍺", "🍷", "🍬", "🍟", "🎰", "🛑", "⛔"] },
  { titulo: "Conquistas", emojis: ["⭐", "🏆", "🥇", "🔥", "⚡", "🚀", "🌟", "💎", "👑", "🎉"] },
];

/** Sugestões que aparecem primeiro na aba de emojis. */
export const EMOJIS_POPULARES_CATEGORIA = ["🍔", "🛒", "🏠", "🚗", "⛽", "💊", "🎬", "👕", "📱", "💡", "🐶", "🎓", "💰", "💳", "🎁", "✈️"];
export const EMOJIS_POPULARES_HABITO = ["💧", "🏃", "📖", "🧘", "😴", "🍎", "✍️", "🙏", "🏋️", "🧹", "🎸", "🚭"];

/**
 * Diz se o valor guardado parece um emoji (e não o nome de um ícone).
 * Nome de ícone é sempre letras ASCII; qualquer coisa fora disso tratamos
 * como emoji.
 */
export function ehEmoji(valor: string | null | undefined): boolean {
  if (!valor) return false;
  return !/^[A-Za-z0-9]+$/.test(valor);
}
