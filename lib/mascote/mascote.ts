// Etapa 298 — o mascote dos hábitos. Tudo desenhado em código (SVG), sem
// imagem nenhuma no servidor. No banco só fica um JSON pequeno em
// perfis.mascote (nome, cor, o que comprou e o que está vestindo).
// As moedas vêm dos check-ins: cada hábito feito = 10 🪙.

export type Slot = "chapeu" | "oculos" | "roupa" | "mao" | "amigo" | "fundo";
export type CorMascote = "verde" | "lilas" | "dourado" | "rosa" | "azul" | "laranja" | "arcoiris";

export type DadosMascote = {
  nome: string;
  cor: CorMascote;
  inventario: string[];
  equipados: Partial<Record<Slot, string>>;
  /** moedas já gastas na lojinha */
  gastos: number;
  /** Etapa 301 — combinações salvas no armário (até 4) */
  looks?: Look[];
  criadoEm?: string;
};

export type Look = { nome: string; equipados: Partial<Record<Slot, string>> };
export const MAX_LOOKS = 4;

export const MOEDAS_POR_HABITO = 10;

export const CORES_MASCOTE: Record<CorMascote, { nome: string; corpo: string; sombra: string; barriga: string; preco: number }> = {
  verde: { nome: "Verde", corpo: "#8FD3A6", sombra: "#5E9A75", barriga: "#D9F2E1", preco: 0 },
  lilas: { nome: "Lilás", corpo: "#B7A9F0", sombra: "#7B6EC0", barriga: "#ECE7FF", preco: 0 },
  dourado: { nome: "Dourado", corpo: "#F2C46D", sombra: "#C98E2C", barriga: "#FFF1CF", preco: 0 },
  rosa: { nome: "Rosa", corpo: "#F6A6C1", sombra: "#D16E93", barriga: "#FFE3EE", preco: 150 },
  azul: { nome: "Azul", corpo: "#8EC5F5", sombra: "#4F8FCB", barriga: "#E2F1FF", preco: 150 },
  laranja: { nome: "Laranja", corpo: "#F7A86B", sombra: "#D2733A", barriga: "#FFE6D1", preco: 150 },
  arcoiris: { nome: "Arco-íris", corpo: "url(#vtm-arcoiris)", sombra: "#9C8FD9", barriga: "#FFFFFF", preco: 900 },
};

export type Item = { id: string; slot: Slot; nome: string; preco: number; nivel: number; emoji: string };

export const ITENS: Item[] = [
  // chapéus
  { id: "bone", slot: "chapeu", nome: "Boné", preco: 60, nivel: 1, emoji: "🧢" },
  { id: "laco", slot: "chapeu", nome: "Laço", preco: 60, nivel: 1, emoji: "🎀" },
  { id: "flor", slot: "chapeu", nome: "Florzinha", preco: 80, nivel: 1, emoji: "🌼" },
  { id: "gorro", slot: "chapeu", nome: "Gorro", preco: 120, nivel: 2, emoji: "🧶" },
  { id: "festa", slot: "chapeu", nome: "Chapéu de festa", preco: 150, nivel: 2, emoji: "🥳" },
  { id: "cartola", slot: "chapeu", nome: "Cartola", preco: 260, nivel: 3, emoji: "🎩" },
  { id: "coroa", slot: "chapeu", nome: "Coroa", preco: 600, nivel: 4, emoji: "👑" },
  { id: "aureola", slot: "chapeu", nome: "Auréola", preco: 1200, nivel: 5, emoji: "😇" },
  // Etapa 301 — mais chapéus
  { id: "palha", slot: "chapeu", nome: "Chapéu de palha", preco: 90, nivel: 1, emoji: "👒" },
  { id: "fones", slot: "chapeu", nome: "Fones de ouvido", preco: 140, nivel: 2, emoji: "🎧" },
  { id: "chef", slot: "chapeu", nome: "Chapéu de chef", preco: 170, nivel: 2, emoji: "👨‍🍳" },
  { id: "floral", slot: "chapeu", nome: "Coroa de flores", preco: 220, nivel: 2, emoji: "💐" },
  { id: "pirata", slot: "chapeu", nome: "Chapéu pirata", preco: 320, nivel: 3, emoji: "🏴‍☠️" },
  { id: "mago", slot: "chapeu", nome: "Chapéu de mago", preco: 420, nivel: 3, emoji: "🧙" },
  // óculos
  { id: "redondos", slot: "oculos", nome: "Óculos redondos", preco: 80, nivel: 1, emoji: "👓" },
  { id: "escuros", slot: "oculos", nome: "Óculos escuros", preco: 140, nivel: 2, emoji: "🕶️" },
  { id: "coracao", slot: "oculos", nome: "Óculos de coração", preco: 220, nivel: 3, emoji: "😍" },
  { id: "estrela", slot: "oculos", nome: "Óculos de estrela", preco: 320, nivel: 3, emoji: "🤩" },
  { id: "monoculo", slot: "oculos", nome: "Monóculo", preco: 180, nivel: 2, emoji: "🧐" },
  { id: "aviador", slot: "oculos", nome: "Óculos aviador", preco: 260, nivel: 3, emoji: "🛩️" },
  { id: "mergulho", slot: "oculos", nome: "Máscara de mergulho", preco: 300, nivel: 3, emoji: "🤿" },
  // roupas
  { id: "gravata", slot: "roupa", nome: "Gravata borboleta", preco: 70, nivel: 1, emoji: "🎀" },
  { id: "cachecol", slot: "roupa", nome: "Cachecol", preco: 110, nivel: 1, emoji: "🧣" },
  { id: "colar", slot: "roupa", nome: "Colar de pérolas", preco: 180, nivel: 2, emoji: "📿" },
  { id: "medalha", slot: "roupa", nome: "Medalha", preco: 300, nivel: 3, emoji: "🏅" },
  { id: "capa", slot: "roupa", nome: "Capa de herói", preco: 450, nivel: 4, emoji: "🦸" },
  { id: "lenco", slot: "roupa", nome: "Lencinho", preco: 60, nivel: 1, emoji: "🧣" },
  { id: "havaiano", slot: "roupa", nome: "Colar havaiano", preco: 150, nivel: 2, emoji: "🌺" },
  { id: "faixa", slot: "roupa", nome: "Faixa de campeão", preco: 380, nivel: 4, emoji: "🎗️" },
  // na mão
  { id: "cafe", slot: "mao", nome: "Cafezinho", preco: 50, nivel: 1, emoji: "☕" },
  { id: "livro", slot: "mao", nome: "Livro", preco: 90, nivel: 1, emoji: "📖" },
  { id: "halter", slot: "mao", nome: "Halter", preco: 120, nivel: 2, emoji: "🏋️" },
  { id: "balao", slot: "mao", nome: "Balão", preco: 150, nivel: 2, emoji: "🎈" },
  { id: "trofeu", slot: "mao", nome: "Troféu", preco: 500, nivel: 4, emoji: "🏆" },
  { id: "sorvete", slot: "mao", nome: "Sorvete", preco: 70, nivel: 1, emoji: "🍦" },
  { id: "regador", slot: "mao", nome: "Regador", preco: 120, nivel: 2, emoji: "🪴" },
  { id: "violao", slot: "mao", nome: "Violão", preco: 280, nivel: 3, emoji: "🎸" },
  { id: "varinha", slot: "mao", nome: "Varinha mágica", preco: 420, nivel: 4, emoji: "🪄" },
  // amigos (ficam do ladinho)
  { id: "passarinho", slot: "amigo", nome: "Passarinho", preco: 120, nivel: 1, emoji: "🐦" },
  { id: "borboleta", slot: "amigo", nome: "Borboleta", preco: 160, nivel: 2, emoji: "🦋" },
  { id: "patinho", slot: "amigo", nome: "Patinho", preco: 220, nivel: 2, emoji: "🐥" },
  { id: "caracol", slot: "amigo", nome: "Caracol", preco: 260, nivel: 3, emoji: "🐌" },
  { id: "estrelinha", slot: "amigo", nome: "Estrelinha", preco: 550, nivel: 4, emoji: "⭐" },
  // cenários
  { id: "quarto", slot: "fundo", nome: "Quartinho", preco: 100, nivel: 1, emoji: "🛋️" },
  { id: "jardim", slot: "fundo", nome: "Jardim", preco: 160, nivel: 2, emoji: "🌳" },
  { id: "praia", slot: "fundo", nome: "Praia", preco: 240, nivel: 2, emoji: "🏖️" },
  { id: "noite", slot: "fundo", nome: "Noite estrelada", preco: 320, nivel: 3, emoji: "🌙" },
  { id: "espaco", slot: "fundo", nome: "Espaço", preco: 700, nivel: 4, emoji: "🚀" },
  { id: "montanha", slot: "fundo", nome: "Montanhas", preco: 260, nivel: 3, emoji: "⛰️" },
  { id: "neve", slot: "fundo", nome: "Dia de neve", preco: 300, nivel: 3, emoji: "❄️" },
  { id: "cidade", slot: "fundo", nome: "Cidade à noite", preco: 450, nivel: 4, emoji: "🌃" },
  { id: "ceuarco", slot: "fundo", nome: "Céu de arco-íris", preco: 900, nivel: 5, emoji: "🌈" },
];

export const NOMES_SLOT: Record<Slot, string> = {
  chapeu: "Chapéus",
  oculos: "Óculos",
  roupa: "Roupas",
  mao: "Na mão",
  amigo: "Amigos",
  fundo: "Cenários",
};

/** Fases do mascote pelo total de hábitos feitos (desde sempre). */
export const FASES = [
  { nivel: 0, nome: "Ovinho", minimo: 0 },
  { nivel: 1, nome: "Filhote", minimo: 5 },
  { nivel: 2, nome: "Pequeno", minimo: 40 },
  { nivel: 3, nome: "Crescido", minimo: 120 },
  { nivel: 4, nome: "Campeão", minimo: 300 },
  { nivel: 5, nome: "Lendário", minimo: 700 },
];

export function faseDoMascote(feitos: number) {
  const n = Math.max(0, feitos || 0);
  let atual = FASES[0];
  for (const f of FASES) if (n >= f.minimo) atual = f;
  const proxima = FASES.find((f) => f.minimo > n) ?? null;
  const progresso = proxima ? (n - atual.minimo) / (proxima.minimo - atual.minimo) : 1;
  return { ...atual, proxima, progresso, faltam: proxima ? proxima.minimo - n : 0 };
}

export function moedasDisponiveis(feitos: number, gastos: number) {
  return Math.max(0, (feitos || 0) * MOEDAS_POR_HABITO - (gastos || 0));
}

export type Humor = "radiante" | "feliz" | "neutro" | "triste" | "dormindo";

/** Humor pelo dia de hoje (feitos/total) e pela hora. */
export function humorDoMascote(feitosHoje: number, totalHoje: number, hora: number): Humor {
  if (totalHoje > 0 && feitosHoje >= totalHoje) return hora >= 23 || hora < 6 ? "dormindo" : "radiante";
  if (hora >= 23 || hora < 6) return "dormindo";
  if (totalHoje === 0) return "feliz";
  if (feitosHoje / totalHoje >= 0.5) return "feliz";
  if (feitosHoje === 0 && hora >= 20) return "triste";
  return "neutro";
}

export const FRASES_HUMOR: Record<Humor, string[]> = {
  radiante: ["Dia completo! Tô brilhando ✨", "A gente arrasou hoje!", "Que orgulho de nós dois 💚"],
  feliz: ["Tá indo muito bem!", "Bora terminar o dia juntos?", "Cada hábito me deixa mais forte 💪"],
  neutro: ["Bora começar? Um de cada vez 🙂", "Tô aqui torcendo por você!", "Que tal marcar o primeiro?"],
  triste: ["Ainda dá tempo hoje… 🥺", "Senti sua falta hoje", "Só um hábito já me anima!"],
  dormindo: ["Zzz… amanhã tem mais 😴", "Boa noite! Descansa também 🌙"],
};

export function fraseDoHumor(h: Humor, semente = 0) {
  const l = FRASES_HUMOR[h];
  return l[Math.abs(semente) % l.length];
}

export function mascotePadrao(nome = "Vidinho", cor: CorMascote = "verde"): DadosMascote {
  return { nome, cor, inventario: [], equipados: {}, gastos: 0, criadoEm: new Date().toISOString().slice(0, 10) };
}

export function lerMascote(bruto: unknown): DadosMascote | null {
  if (!bruto || typeof bruto !== "object") return null;
  const b = bruto as any;
  if (typeof b.nome !== "string") return null;
  const cor: CorMascote = b.cor in CORES_MASCOTE ? b.cor : "verde";
  const inventario = Array.isArray(b.inventario) ? b.inventario.filter((x: unknown) => typeof x === "string") : [];
  const looks: Look[] = (Array.isArray(b.looks) ? b.looks : [])
    .filter((l: any) => l && typeof l.nome === "string")
    .slice(0, MAX_LOOKS)
    .map((l: any) => ({ nome: l.nome.slice(0, 16), equipados: equipadosValidos(l.equipados, inventario) }));
  const m: DadosMascote = { nome: b.nome.slice(0, 20), cor, inventario, equipados: equipadosValidos(b.equipados, inventario), gastos: Math.max(0, Number(b.gastos) || 0), criadoEm: b.criadoEm };
  if (looks.length) m.looks = looks;
  return m;
}

/** Só fica o que existe, está no lugar certo e foi comprado. */
function equipadosValidos(bruto: unknown, inventario: string[]): Partial<Record<Slot, string>> {
  const equipados: Partial<Record<Slot, string>> = {};
  for (const [slot, id] of Object.entries((bruto as any) ?? {})) {
    const item = ITENS.find((i) => i.id === id);
    if (item && item.slot === slot && inventario.includes(item.id)) equipados[slot as Slot] = item.id;
  }
  return equipados;
}

/** Tenta comprar; devolve o novo estado ou o motivo de não dar. */
export function comprar(
  m: DadosMascote,
  feitos: number,
  alvo: { tipo: "item"; id: string } | { tipo: "cor"; cor: CorMascote }
): { ok: true; mascote: DadosMascote } | { ok: false; motivo: string } {
  const fase = faseDoMascote(feitos).nivel;
  const saldo = moedasDisponiveis(feitos, m.gastos);
  if (alvo.tipo === "cor") {
    const c = CORES_MASCOTE[alvo.cor];
    const chave = `cor:${alvo.cor}`;
    if (c.preco === 0 || m.inventario.includes(chave)) return { ok: true, mascote: { ...m, cor: alvo.cor } };
    if (saldo < c.preco) return { ok: false, motivo: `Faltam ${c.preco - saldo} 🪙` };
    return { ok: true, mascote: { ...m, cor: alvo.cor, gastos: m.gastos + c.preco, inventario: [...m.inventario, chave] } };
  }
  const item = ITENS.find((i) => i.id === alvo.id);
  if (!item) return { ok: false, motivo: "Item não existe" };
  if (m.inventario.includes(item.id)) return { ok: true, mascote: m };
  if (fase < item.nivel) return { ok: false, motivo: `Libera na fase ${FASES[item.nivel].nome}` };
  if (saldo < item.preco) return { ok: false, motivo: `Faltam ${item.preco - saldo} 🪙` };
  return {
    ok: true,
    mascote: { ...m, gastos: m.gastos + item.preco, inventario: [...m.inventario, item.id], equipados: { ...m.equipados, [item.slot]: item.id } },
  };
}

export function alternarEquipado(m: DadosMascote, id: string): DadosMascote {
  const item = ITENS.find((i) => i.id === id);
  if (!item || !m.inventario.includes(id)) return m;
  const eq = { ...m.equipados };
  if (eq[item.slot] === id) delete eq[item.slot];
  else eq[item.slot] = id;
  return { ...m, equipados: eq };
}

// ---- Etapa 301 — armário (o que já é seu) e looks salvos ----

/** Itens comprados, na ordem da lojinha, agrupados por lugar. */
export function itensDoArmario(m: DadosMascote): { slot: Slot; itens: Item[] }[] {
  const ordem: Slot[] = ["chapeu", "oculos", "roupa", "mao", "amigo", "fundo"];
  return ordem
    .map((slot) => ({ slot, itens: ITENS.filter((i) => i.slot === slot && m.inventario.includes(i.id)) }))
    .filter((g) => g.itens.length > 0);
}

export function quantosNoArmario(m: DadosMascote) {
  return m.inventario.filter((id) => ITENS.some((i) => i.id === id)).length;
}

export function tirarTudo(m: DadosMascote): DadosMascote {
  return { ...m, equipados: {} };
}

export function salvarLook(m: DadosMascote, nome: string): DadosMascote {
  const looks = [...(m.looks ?? [])];
  const novo: Look = { nome: (nome.trim() || `Look ${looks.length + 1}`).slice(0, 16), equipados: { ...m.equipados } };
  if (looks.length >= MAX_LOOKS) looks.shift();
  return { ...m, looks: [...looks, novo] };
}

export function usarLook(m: DadosMascote, i: number): DadosMascote {
  const l = m.looks?.[i];
  if (!l) return m;
  const equipados: Partial<Record<Slot, string>> = {};
  for (const [slot, id] of Object.entries(l.equipados)) if (id && m.inventario.includes(id)) equipados[slot as Slot] = id;
  return { ...m, equipados };
}

export function apagarLook(m: DadosMascote, i: number): DadosMascote {
  return { ...m, looks: (m.looks ?? []).filter((_, k) => k !== i) };
}

export function mesmoLook(a: Partial<Record<Slot, string>>, b: Partial<Record<Slot, string>>) {
  const ka = Object.entries(a).filter(([, v]) => v).sort().join("|");
  const kb = Object.entries(b).filter(([, v]) => v).sort().join("|");
  return ka === kb;
}
