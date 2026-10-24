// Etapa 357 — Agenda mais viva: emoji do compromisso, cor de cada pessoa
// (quem é o dono) e links de mapa.

// ---------- emoji ----------
// o emoji fica no começo do título ("🎂 Aniversário da Su"): não precisa de
// coluna nova no banco e aparece igual nas notificações
const RE_EMOJI_INICIO = new RegExp("^(\\p{Extended_Pictographic}(?:\\uFE0F|\\u200D\\p{Extended_Pictographic}|\\p{Emoji_Modifier})*)\\s*", "u");

export function separarEmoji(titulo: string | null | undefined): { emoji: string | null; texto: string } {
  const t = String(titulo ?? "");
  const m = t.match(RE_EMOJI_INICIO);
  if (!m) return { emoji: null, texto: t };
  return { emoji: m[1], texto: t.slice(m[0].length) || t };
}

export function juntarEmoji(emoji: string | null | undefined, texto: string) {
  const limpo = separarEmoji(texto).texto.trim();
  return emoji ? `${emoji} ${limpo}` : limpo;
}

export const EMOJIS_AGENDA = [
  "📅", "🍽️", "☕", "🎂", "🎉", "💼", "🩺", "🦷", "💊", "🏋️", "⚽", "🏃",
  "✈️", "🚗", "🏖️", "🎬", "🎵", "⛪", "📚", "🎓", "🛒", "🏠", "🐶", "👶",
  "💇", "💅", "💰", "📞", "💻", "❤️", "🙏", "⭐",
];

const PALAVRAS: [RegExp, string][] = [
  [/anivers|niver|parab/i, "🎂"],
  [/jantar|almo[cç]o|restaurante|pizza|churrasco|comer/i, "🍽️"],
  [/caf[eé]/i, "☕"],
  [/festa|balada|comemora/i, "🎉"],
  [/reuni[aã]o|trabalho|cliente|call|meet/i, "💼"],
  [/m[eé]dic|consulta|exame|hospital|cl[ií]nica/i, "🩺"],
  [/dentista/i, "🦷"],
  [/rem[eé]dio|vacina/i, "💊"],
  [/academia|treino|muscula/i, "🏋️"],
  [/futebol|jogo|pelada/i, "⚽"],
  [/corrida|caminhada|correr/i, "🏃"],
  [/viagem|voo|aeroporto|viajar/i, "✈️"],
  [/carro|oficina|revis[aã]o|uber/i, "🚗"],
  [/praia|f[eé]rias/i, "🏖️"],
  [/cinema|filme|s[eé]rie/i, "🎬"],
  [/ensaio|louvor|m[uú]sica|show|banda/i, "🎵"],
  [/igreja|culto|missa|c[eé]lula/i, "⛪"],
  [/aula|curso|estud|prova/i, "📚"],
  [/formatura/i, "🎓"],
  [/mercado|compras|feira/i, "🛒"],
  [/casa|limpeza|faxina|mudan[cç]a/i, "🏠"],
  [/pet|cachorro|gato|veterin/i, "🐶"],
  [/beb[eê]|escola|filh/i, "👶"],
  [/cabelo|barbe|sal[aã]o/i, "💇"],
  [/unha|manicure/i, "💅"],
  [/pagar|conta|boleto|banco/i, "💰"],
  [/ligar|liga[cç][aã]o/i, "📞"],
  [/namoro|encontro|date/i, "❤️"],
  [/ora[cç][aã]o/i, "🙏"],
];

/** emoji que combina com o título (ou null) */
export function sugerirEmoji(titulo: string, tipo?: string | null): string | null {
  if (tipo === "aniversario") return "🎂";
  for (const [re, e] of PALAVRAS) if (re.test(titulo)) return e;
  if (tipo === "data_especial") return "⭐";
  return null;
}

// ---------- cor de cada pessoa ----------
export const CORES_PESSOA = ["#38BDF8", "#F472B6", "#7FB894", "#D9A24C", "#9C8FD9", "#F87171", "#2DD4BF", "#FB923C"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Cor fixa de cada pessoa da agenda. Mesmo resultado nos dois celulares
 * (depende só dos ids), e duas pessoas nunca ficam com a mesma cor.
 */
export function coresDasPessoas(ids: Iterable<string>): Map<string, string> {
  const lista = [...new Set([...ids].filter(Boolean))].sort();
  const usadas = new Set<number>();
  const mapa = new Map<string, string>();
  for (const id of lista) {
    let i = hash(id) % CORES_PESSOA.length;
    let tentativas = 0;
    while (usadas.has(i) && tentativas < CORES_PESSOA.length) {
      i = (i + 1) % CORES_PESSOA.length;
      tentativas++;
    }
    usadas.add(i);
    mapa.set(id, CORES_PESSOA[i]);
  }
  return mapa;
}

// ---------- mapa ----------
const q = (local: string) => encodeURIComponent(local.trim());
/** mapinha pra mostrar dentro do app (sem chave de API) */
export const urlMapaEmbutido = (local: string) => `https://maps.google.com/maps?q=${q(local)}&z=15&output=embed`;
export const urlGoogleMaps = (local: string) => `https://www.google.com/maps/search/?api=1&query=${q(local)}`;
export const urlWaze = (local: string) => `https://waze.com/ul?q=${q(local)}&navigate=yes`;
export const urlRota = (local: string) => `https://www.google.com/maps/dir/?api=1&destination=${q(local)}`;
