// Etapa 298 — o mascote dos hábitos. Tudo desenhado em código (SVG), sem
// imagem nenhuma no servidor. No banco só fica um JSON pequeno em
// perfis.mascote (nome, cor, o que comprou e o que está vestindo).
// As moedas vêm dos check-ins: cada hábito feito = 10 🪙.

import { lerCasa, type Casa } from "@/lib/mascote/casa";

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
  /** Etapa 302 — comidinhas/remédios/adubo comprados e ainda não usados */
  estoque?: Record<string, number>;
  /** Etapa 302 — o que foi dado (últimos ~30 dias): d = dia, t = consumível, h = hábito (adubo) */
  consumos?: Consumo[];
  /** Etapa 302 — frutos já colhidos por planta compartilhada (id do hábito → quantos) */
  colhidos?: Record<string, number>;
  /** Etapa 305 — a casa (cômodos, móveis comprados e onde estão) — ver lib/mascote/casa.ts */
  casa?: Casa;
  /** Etapa 309 — moedas ganhas em missões e baús (somam no saldo) */
  bonus?: number;
  /** Etapa 309 — missões resgatadas por dia (dia → ids) */
  missoes?: Record<string, string[]>;
  /** Etapa 309 — semanas cujo baú já foi aberto (segunda-feira da semana) */
  baus?: string[];
  /** Etapa 310 — total de missões resgatadas desde sempre */
  missoesTotal?: number;
  /** Etapa 310 — conquistas já resgatadas */
  conquistas?: string[];
  /** Etapa 312 — desafios de 7/21/30 dias (ver lib/habitos/trilhas.ts) */
  desafios?: DesafioSalvo[];
  /** Etapa 312 — temas da ilha comprados e o que está em uso */
  temasIlha?: string[];
  temaIlha?: string;
};

export type DesafioSalvo = {
  id: string;
  habitoId: string;
  dias: 7 | 21 | 30;
  inicio: string;
  /** quando terminou (medalha, desistência ou perdeu) */
  fim?: string;
  resultado?: "medalha" | "perdeu" | "desistiu";
};

export type Consumo = { d: string; t: string; h?: string };

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
  { id: "noite", slot: "fundo", nome: "Acampamento", preco: 320, nivel: 3, emoji: "🏕️" },
  { id: "espaco", slot: "fundo", nome: "Espaço", preco: 700, nivel: 4, emoji: "🚀" },
  { id: "montanha", slot: "fundo", nome: "Montanhas", preco: 260, nivel: 3, emoji: "⛰️" },
  { id: "neve", slot: "fundo", nome: "Dia de neve", preco: 300, nivel: 3, emoji: "❄️" },
  { id: "cidade", slot: "fundo", nome: "Cidade grande", preco: 450, nivel: 4, emoji: "🌃" },
  { id: "ceuarco", slot: "fundo", nome: "Céu de arco-íris", preco: 900, nivel: 5, emoji: "🌈" },
];

export const NOMES_SLOT: Record<Slot, string> = {
  chapeu: "Chapéus",
  oculos: "Óculos",
  roupa: "Roupas",
  mao: "Na mão",
  amigo: "Amigos",
  fundo: "Lugares",
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

export function moedasDisponiveis(feitos: number, gastos: number, bonus = 0) {
  return Math.max(0, (feitos || 0) * MOEDAS_POR_HABITO + (bonus || 0) - (gastos || 0));
}

// Etapa 302 — "fome" e "doente" vêm do cuidado dos últimos dias (lib/mascote/vida.ts)
export type Humor = "radiante" | "feliz" | "neutro" | "triste" | "dormindo" | "fome" | "doente";

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
  fome: ["Minha barriga tá roncando… 🍎", "Faz um hábito? Me alimenta! 🥺", "Tô com fominha…"],
  doente: ["Tô dodói… 🤒 cuida de mim?", "Um remedinho e uns hábitos me curam 💊", "Fiquei doente sem cuidado… mas eu melhoro!"],
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
  // Etapa 302 — cuidados
  const estoque: Record<string, number> = {};
  for (const [id, q] of Object.entries(b.estoque ?? {})) {
    const n = Math.floor(Number(q));
    if (CONSUMIVEIS.some((c) => c.id === id) && n > 0) estoque[id] = Math.min(99, n);
  }
  if (Object.keys(estoque).length) m.estoque = estoque;
  const consumos: Consumo[] = (Array.isArray(b.consumos) ? b.consumos : [])
    .filter((c: any) => c && typeof c.d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.d) && CONSUMIVEIS.some((x) => x.id === c.t))
    .map((c: any) => (typeof c.h === "string" ? { d: c.d, t: c.t, h: c.h } : { d: c.d, t: c.t }));
  if (consumos.length) m.consumos = aparar(consumos);
  const colhidos: Record<string, number> = {};
  for (const [h, q] of Object.entries(b.colhidos ?? {})) {
    const n = Math.floor(Number(q));
    if (n > 0) colhidos[h] = n;
  }
  if (Object.keys(colhidos).length) m.colhidos = colhidos;
  const casa = lerCasa(b.casa);
  if (casa) m.casa = casa;
  // Etapa 309 — missões e baús
  const bonus = Math.floor(Number(b.bonus));
  if (bonus > 0) m.bonus = Math.min(1_000_000, bonus);
  const missoes: Record<string, string[]> = {};
  for (const [d, ids] of Object.entries(b.missoes ?? {}).sort().slice(-21)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !Array.isArray(ids)) continue;
    const l = [...new Set(ids.filter((x: unknown) => typeof x === "string").map((x: string) => x.slice(0, 20)))].slice(0, 6);
    if (l.length) missoes[d] = l;
  }
  if (Object.keys(missoes).length) m.missoes = missoes;
  const baus = (Array.isArray(b.baus) ? b.baus : []).filter((x: unknown) => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x as string)).slice(-20);
  if (baus.length) m.baus = baus;
  // Etapa 310
  const mt = Math.floor(Number(b.missoesTotal));
  if (mt > 0) m.missoesTotal = Math.min(100000, mt);
  const conq = [...new Set((Array.isArray(b.conquistas) ? b.conquistas : []).filter((x: unknown) => typeof x === "string").map((x: string) => x.slice(0, 20)))].slice(0, 200) as string[];
  if (conq.length) m.conquistas = conq;
  // Etapa 312 — desafios e temas da ilha
  const ehDia = (x: unknown) => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x);
  const desafios: DesafioSalvo[] = (Array.isArray(b.desafios) ? b.desafios : [])
    .filter((d: any) => d && typeof d.id === "string" && typeof d.habitoId === "string" && [7, 21, 30].includes(d.dias) && ehDia(d.inicio))
    .slice(-40)
    .map((d: any) => {
      const r: DesafioSalvo = { id: d.id.slice(0, 24), habitoId: d.habitoId.slice(0, 40), dias: d.dias, inicio: d.inicio };
      if (ehDia(d.fim)) r.fim = d.fim;
      if (["medalha", "perdeu", "desistiu"].includes(d.resultado)) r.resultado = d.resultado;
      return r;
    });
  if (desafios.length) m.desafios = desafios;
  const temas = [...new Set((Array.isArray(b.temasIlha) ? b.temasIlha : []).filter((x: unknown) => typeof x === "string").map((x: string) => x.slice(0, 20)))].slice(0, 30) as string[];
  if (temas.length) m.temasIlha = temas;
  if (typeof b.temaIlha === "string" && temas.includes(b.temaIlha)) m.temaIlha = b.temaIlha;
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
  const saldo = moedasDisponiveis(feitos, m.gastos, m.bonus);
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

// ---- Etapa 302 — cuidados: comidinhas, farmácia e jardim (gastam moedas) ----

export type Consumivel = {
  id: string;
  nome: string;
  emoji: string;
  preco: number;
  /** quanto enche a barriga / cura (0–100) */
  barriga: number;
  saude: number;
  tipo: "comida" | "remedio" | "planta";
  descricao: string;
};

export const CONSUMIVEIS: Consumivel[] = [
  { id: "maca", nome: "Maçã", emoji: "🍎", preco: 15, barriga: 12, saude: 2, tipo: "comida", descricao: "Lanchinho leve" },
  { id: "sanduiche", nome: "Sanduíche", emoji: "🥪", preco: 35, barriga: 28, saude: 0, tipo: "comida", descricao: "Enche bem a barriga" },
  { id: "sopa", nome: "Sopinha", emoji: "🍲", preco: 45, barriga: 22, saude: 10, tipo: "comida", descricao: "Quentinha, ajuda a sarar" },
  { id: "bolo", nome: "Bolo", emoji: "🍰", preco: 70, barriga: 35, saude: 0, tipo: "comida", descricao: "Festa! Deixa ele radiante" },
  { id: "vitamina", nome: "Vitamina", emoji: "🧃", preco: 50, barriga: 5, saude: 20, tipo: "remedio", descricao: "Reforço pra saúde" },
  { id: "remedio", nome: "Remédio", emoji: "💊", preco: 90, barriga: 0, saude: 50, tipo: "remedio", descricao: "Cura quando está doente" },
  { id: "adubo", nome: "Adubo", emoji: "🌿", preco: 120, barriga: 0, saude: 0, tipo: "planta", descricao: "Planta de dupla cresce +2 dias (1 por dia)" },
  // fruto colhido nas plantas de dupla (não se compra)
  { id: "fruta", nome: "Fruta do jardim", emoji: "🍓", preco: 0, barriga: 20, saude: 10, tipo: "comida", descricao: "Colhida na planta de vocês" },
];

export const MAX_CONSUMOS = 60;
export const DIAS_ADUBO = 2;

export function consumivel(id: string) {
  return CONSUMIVEIS.find((c) => c.id === id) ?? null;
}

/** Compra comidinha/remédio/adubo (vai pro estoque). */
export function comprarConsumivel(
  m: DadosMascote,
  feitos: number,
  id: string,
  qtd = 1
): { ok: true; mascote: DadosMascote } | { ok: false; motivo: string } {
  const c = consumivel(id);
  if (!c || c.preco <= 0) return { ok: false, motivo: "Não está à venda" };
  const total = c.preco * qtd;
  const saldo = moedasDisponiveis(feitos, m.gastos, m.bonus);
  if (saldo < total) return { ok: false, motivo: `Faltam ${total - saldo} 🪙` };
  const estoque = { ...(m.estoque ?? {}) };
  estoque[id] = Math.min(99, (estoque[id] ?? 0) + qtd);
  return { ok: true, mascote: { ...m, gastos: m.gastos + total, estoque } };
}

/** Dá um consumível (sai do estoque e entra no histórico do dia). */
export function usarConsumivel(
  m: DadosMascote,
  id: string,
  hoje: string,
  habitoId?: string
): { ok: true; mascote: DadosMascote } | { ok: false; motivo: string } {
  const c = consumivel(id);
  if (!c) return { ok: false, motivo: "Não existe" };
  if ((m.estoque?.[id] ?? 0) <= 0) return { ok: false, motivo: "Acabou — compre na lojinha" };
  if (c.tipo === "planta") {
    if (!habitoId) return { ok: false, motivo: "Escolha a planta" };
    if ((m.consumos ?? []).some((x) => x.t === id && x.h === habitoId && x.d === hoje)) return { ok: false, motivo: "Essa planta já ganhou adubo hoje" };
  }
  const estoque = { ...(m.estoque ?? {}) };
  estoque[id] -= 1;
  if (estoque[id] <= 0) delete estoque[id];
  const novo: Consumo = habitoId ? { d: hoje, t: id, h: habitoId } : { d: hoje, t: id };
  // guarda só ~30 dias, mas o adubo fica pra sempre (conta no crescimento da planta)
  const limite = somarDiasISO(hoje, -30);
  const consumos = aparar([...(m.consumos ?? []).filter((x) => x.t === "adubo" || x.d >= limite), novo]);
  return { ok: true, mascote: { ...m, estoque, consumos } };
}

/** Adubo fica sempre (conta no crescimento); o resto, só os últimos. */
function aparar(l: Consumo[]): Consumo[] {
  const adubos = l.filter((c) => c.t === "adubo").slice(-200);
  const outros = l.filter((c) => c.t !== "adubo").slice(-MAX_CONSUMOS);
  return [...adubos, ...outros].sort((a, b) => a.d.localeCompare(b.d));
}

export function somarDiasISO(iso: string, n: number) {
  const [a, mm, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, mm - 1, d + n)).toISOString().slice(0, 10);
}

// ---- frutos das plantas de dupla ----

export const FRUTO_A_PARTIR = 30; // dias de crescimento (estágio Flor)
export const FRUTO_A_CADA = 3;
export const MAX_FRUTOS_ESPERANDO = 5;
const FRUTAS = ["🍓", "🍎", "🍊", "🍋", "🍇", "🍑", "🍒", "🫐"];

/** Fruta da planta (sempre a mesma pro mesmo hábito). */
export function frutaDaPlanta(habitoId: string) {
  let h = 0;
  for (const ch of habitoId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FRUTAS[h % FRUTAS.length];
}

/** Quantos frutos a planta já deu desde sempre. */
export function frutosProduzidos(crescimento: number) {
  if (crescimento < FRUTO_A_PARTIR) return 0;
  return 1 + Math.floor((crescimento - FRUTO_A_PARTIR) / FRUTO_A_CADA);
}

export function frutosParaColher(m: DadosMascote | null, habitoId: string, crescimento: number) {
  const ja = m?.colhidos?.[habitoId] ?? 0;
  return Math.max(0, Math.min(MAX_FRUTOS_ESPERANDO, frutosProduzidos(crescimento) - ja));
}

/** Colhe tudo que está maduro: vira "fruta" no estoque. */
export function colherFrutos(m: DadosMascote, habitoId: string, crescimento: number): { mascote: DadosMascote; colhidos: number } {
  const n = frutosParaColher(m, habitoId, crescimento);
  if (n <= 0) return { mascote: m, colhidos: 0 };
  const estoque = { ...(m.estoque ?? {}) };
  estoque.fruta = Math.min(99, (estoque.fruta ?? 0) + n);
  const colhidos = { ...(m.colhidos ?? {}), [habitoId]: frutosProduzidos(crescimento) };
  return { mascote: { ...m, estoque, colhidos }, colhidos: n };
}

/** Adubos dados numa planta (por uma pessoa). */
export function adubosNaPlanta(m: DadosMascote | null, habitoId: string) {
  return (m?.consumos ?? []).filter((c) => c.t === "adubo" && c.h === habitoId).length;
}
