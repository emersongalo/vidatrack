// Etapa 305 — a casa do mascote: cômodos em visão isométrica (piso
// quadriculado), móveis comprados com as moedas dos hábitos e colocados em
// qualquer quadradinho. Tudo fica no mesmo JSON do mascote (perfis.mascote.casa)
// — nada de imagem no servidor.

export type ComodoId = "quarto" | "sala" | "cozinha" | "quintal" | "garagem" | "lazer";
export const TAM = 6; // cada cômodo tem 6×6 quadradinhos

export type Colocado = { u: string; m: string; x: number; y: number; r: 0 | 1 };
export type Comodo = { piso: string; parede: string; itens: Colocado[] };
export type Casa = {
  comodos: Partial<Record<ComodoId, Comodo>>;
  /** móveis comprados (id → quantidade) — os colocados contam aqui também */
  moveis: Record<string, number>;
  /** pisos e paredes comprados */
  estilos: string[];
  /** Etapa 308 — o "sonho": móvel que a pessoa quer comprar (barra de progresso no palco) */
  desejo?: string;
};

export const COMODOS: { id: ComodoId; nome: string; emoji: string; preco: number; externo?: boolean }[] = [
  { id: "quarto", nome: "Quarto", emoji: "🛏️", preco: 0 },
  { id: "sala", nome: "Sala", emoji: "🛋️", preco: 300 },
  { id: "cozinha", nome: "Cozinha", emoji: "🍳", preco: 450 },
  { id: "quintal", nome: "Quintal", emoji: "🌳", preco: 600, externo: true },
  // Etapa 308
  { id: "garagem", nome: "Garagem", emoji: "🚗", preco: 900 },
  // Etapa 312
  { id: "lazer", nome: "Área de lazer", emoji: "🏖️", preco: 1200, externo: true },
];

export type Estilo = { id: string; nome: string; tipo: "piso" | "parede"; preco: number; a: string; b: string; externo?: boolean };

export const ESTILOS: Estilo[] = [
  // pisos (a/b = as duas cores do quadriculado)
  { id: "madeira", nome: "Madeira", tipo: "piso", preco: 0, a: "#C99A6B", b: "#BC8C5E" },
  { id: "carpete", nome: "Carpete lilás", tipo: "piso", preco: 60, a: "#B7A9E0", b: "#AC9DD8" },
  { id: "azulejo", nome: "Azulejo", tipo: "piso", preco: 80, a: "#E8EEF2", b: "#CFDCE6" },
  { id: "xadrez", nome: "Xadrez", tipo: "piso", preco: 120, a: "#F3EDE2", b: "#3F3A44" },
  { id: "tabuas", nome: "Tábuas escuras", tipo: "piso", preco: 140, a: "#7A5236", b: "#6C472E" },
  { id: "grama", nome: "Grama", tipo: "piso", preco: 0, a: "#86C77A", b: "#7BBE6F", externo: true },
  { id: "pedra", nome: "Pedrinhas", tipo: "piso", preco: 100, a: "#C9C3B6", b: "#B8B1A3", externo: true },
  // paredes (a = parede, b = rodapé/detalhe)
  { id: "creme", nome: "Creme", tipo: "parede", preco: 0, a: "#F1E6D2", b: "#D9C7A8" },
  { id: "menta", nome: "Menta", tipo: "parede", preco: 60, a: "#CDEBDD", b: "#9FCFB8" },
  { id: "rosa", nome: "Rosinha", tipo: "parede", preco: 60, a: "#F6D6DE", b: "#E3AFBE" },
  { id: "azul", nome: "Azul noite", tipo: "parede", preco: 90, a: "#3D4F7A", b: "#2C3A5E" },
  { id: "tijolo", nome: "Tijolinho", tipo: "parede", preco: 150, a: "#C9775A", b: "#A85E45" },
  { id: "listras", nome: "Listrada", tipo: "parede", preco: 120, a: "#F4E9C9", b: "#E2C98E" },
  // Etapa 308
  { id: "concreto", nome: "Concreto", tipo: "piso", preco: 0, a: "#A8A29E", b: "#9C9590" },
  { id: "porcelanato", nome: "Porcelanato", tipo: "piso", preco: 260, a: "#F5F5F4", b: "#E7E5E4" },
  { id: "cinza", nome: "Cinza garagem", tipo: "parede", preco: 0, a: "#CBD5E1", b: "#94A3B8" },
  { id: "dourada", nome: "Dourada de luxo", tipo: "parede", preco: 900, a: "#F3D58A", b: "#C9A227" },
  // Etapa 312 — pisos de fora
  { id: "deck", nome: "Deck de madeira", tipo: "piso", preco: 220, a: "#B98B5E", b: "#A97C51", externo: true },
  { id: "areia", nome: "Areia de praia", tipo: "piso", preco: 180, a: "#F3DDA8", b: "#EBD297", externo: true },
];

export type CategoriaMovel = "quarto" | "sala" | "cozinha" | "quintal" | "veiculo" | "lazer" | "pet" | "parede" | "enfeite" | "verao";
export type Movel = {
  id: string;
  nome: string;
  emoji: string;
  preco: number;
  /** tamanho em quadradinhos (sem girar) */
  w: number;
  d: number;
  cat: CategoriaMovel;
  /** "chao" = dá pra pisar (tapete); "parede" = vai na parede do fundo */
  tipo?: "chao" | "parede";
  /** acende à noite */
  luz?: boolean;
};

export const MOVEIS: Movel[] = [
  // quarto
  { id: "cama", nome: "Cama", emoji: "🛏️", preco: 180, w: 2, d: 1, cat: "quarto" },
  { id: "camacasal", nome: "Cama de casal", emoji: "🛌", preco: 420, w: 2, d: 2, cat: "quarto" },
  { id: "criado", nome: "Criado-mudo", emoji: "🗄️", preco: 70, w: 1, d: 1, cat: "quarto" },
  { id: "guardaroupa", nome: "Guarda-roupa", emoji: "🚪", preco: 260, w: 2, d: 1, cat: "quarto" },
  { id: "escrivaninha", nome: "Escrivaninha", emoji: "🖥️", preco: 220, w: 2, d: 1, cat: "quarto" },
  { id: "cadeira", nome: "Cadeira", emoji: "🪑", preco: 60, w: 1, d: 1, cat: "quarto" },
  { id: "luminaria", nome: "Luminária", emoji: "💡", preco: 90, w: 1, d: 1, cat: "quarto", luz: true },
  // sala
  { id: "sofa", nome: "Sofá", emoji: "🛋️", preco: 320, w: 2, d: 1, cat: "sala" },
  { id: "poltrona", nome: "Poltrona", emoji: "💺", preco: 150, w: 1, d: 1, cat: "sala" },
  { id: "mesinha", nome: "Mesa de centro", emoji: "🟫", preco: 110, w: 1, d: 1, cat: "sala" },
  { id: "tv", nome: "TV com rack", emoji: "📺", preco: 380, w: 2, d: 1, cat: "sala" },
  { id: "estante", nome: "Estante de livros", emoji: "📚", preco: 240, w: 2, d: 1, cat: "sala" },
  { id: "tapete", nome: "Tapete", emoji: "🟪", preco: 90, w: 2, d: 2, cat: "sala", tipo: "chao" },
  { id: "abajur", nome: "Abajur de pé", emoji: "🪔", preco: 120, w: 1, d: 1, cat: "sala", luz: true },
  // cozinha
  { id: "geladeira", nome: "Geladeira", emoji: "🧊", preco: 300, w: 1, d: 1, cat: "cozinha" },
  { id: "fogao", nome: "Fogão", emoji: "🍳", preco: 240, w: 1, d: 1, cat: "cozinha" },
  { id: "bancada", nome: "Bancada com pia", emoji: "🚰", preco: 260, w: 2, d: 1, cat: "cozinha" },
  { id: "mesajantar", nome: "Mesa de jantar", emoji: "🍽️", preco: 280, w: 2, d: 2, cat: "cozinha" },
  { id: "banqueta", nome: "Banqueta", emoji: "🪑", preco: 50, w: 1, d: 1, cat: "cozinha" },
  // quintal
  { id: "arvore", nome: "Árvore", emoji: "🌳", preco: 200, w: 1, d: 1, cat: "quintal" },
  { id: "canteiro", nome: "Canteiro de flores", emoji: "🌷", preco: 80, w: 1, d: 1, cat: "quintal" },
  { id: "banco", nome: "Banco de praça", emoji: "🪵", preco: 140, w: 2, d: 1, cat: "quintal" },
  { id: "fonte", nome: "Fonte", emoji: "⛲", preco: 520, w: 2, d: 2, cat: "quintal" },
  { id: "churrasqueira", nome: "Churrasqueira", emoji: "🔥", preco: 260, w: 1, d: 1, cat: "quintal" },
  { id: "piscina", nome: "Piscininha", emoji: "🏊", preco: 600, w: 2, d: 2, cat: "quintal", tipo: "chao" },
  { id: "poste", nome: "Poste de luz", emoji: "🏮", preco: 160, w: 1, d: 1, cat: "quintal", luz: true },
  // enfeites (qualquer cômodo)
  { id: "vaso", nome: "Planta no vaso", emoji: "🪴", preco: 60, w: 1, d: 1, cat: "enfeite" },
  { id: "puff", nome: "Puff", emoji: "🟠", preco: 70, w: 1, d: 1, cat: "enfeite" },
  { id: "aquario", nome: "Aquário", emoji: "🐠", preco: 340, w: 1, d: 1, cat: "enfeite" },
  { id: "bau", nome: "Baú do tesouro", emoji: "🧰", preco: 900, w: 1, d: 1, cat: "enfeite" },
  { id: "trofeuG", nome: "Troféu gigante", emoji: "🏆", preco: 1500, w: 1, d: 1, cat: "enfeite" },
  // Etapa 308 — veículos (sonhos maiores!)
  { id: "skate", nome: "Skate", emoji: "🛹", preco: 150, w: 1, d: 1, cat: "veiculo" },
  { id: "patinete", nome: "Patinete", emoji: "🛴", preco: 220, w: 1, d: 1, cat: "veiculo" },
  { id: "bicicleta", nome: "Bicicleta", emoji: "🚲", preco: 380, w: 2, d: 1, cat: "veiculo" },
  { id: "moto", nome: "Moto", emoji: "🏍️", preco: 1400, w: 2, d: 1, cat: "veiculo", luz: true },
  { id: "kart", nome: "Kart de corrida", emoji: "🏎️", preco: 1900, w: 2, d: 1, cat: "veiculo" },
  { id: "carro", nome: "Carro", emoji: "🚗", preco: 2800, w: 2, d: 2, cat: "veiculo", luz: true },
  { id: "jipe", nome: "Jipe aventureiro", emoji: "🚙", preco: 4200, w: 2, d: 2, cat: "veiculo", luz: true },
  { id: "esportivo", nome: "Carro esportivo", emoji: "🏁", preco: 7500, w: 2, d: 2, cat: "veiculo", luz: true },
  { id: "foguete", nome: "Foguete", emoji: "🚀", preco: 20000, w: 1, d: 1, cat: "veiculo", luz: true },
  // lazer
  { id: "rede", nome: "Rede de descanso", emoji: "🏝️", preco: 420, w: 2, d: 1, cat: "lazer" },
  { id: "violaoP", nome: "Violão no suporte", emoji: "🎸", preco: 380, w: 1, d: 1, cat: "lazer" },
  { id: "piano", nome: "Piano", emoji: "🎹", preco: 1600, w: 2, d: 1, cat: "lazer" },
  { id: "fliperama", nome: "Fliperama", emoji: "🕹️", preco: 1200, w: 1, d: 1, cat: "lazer", luz: true },
  { id: "sinuca", nome: "Mesa de sinuca", emoji: "🎱", preco: 2200, w: 2, d: 2, cat: "lazer" },
  { id: "camaelastica", nome: "Cama elástica", emoji: "🤸", preco: 900, w: 2, d: 2, cat: "lazer" },
  { id: "telescopio", nome: "Telescópio", emoji: "🔭", preco: 950, w: 1, d: 1, cat: "lazer" },
  { id: "estatua", nome: "Estátua dourada", emoji: "🗿", preco: 9000, w: 1, d: 1, cat: "lazer" },
  // Etapa 312 — área de lazer / verão
  { id: "piscinaG", nome: "Piscina grande", emoji: "🏊", preco: 1800, w: 3, d: 2, cat: "verao" },
  { id: "espreguicadeira", nome: "Espreguiçadeira", emoji: "🛋️", preco: 260, w: 1, d: 2, cat: "verao" },
  { id: "guardasol", nome: "Guarda-sol", emoji: "⛱️", preco: 180, w: 1, d: 1, cat: "verao" },
  { id: "piquenique", nome: "Mesa de piquenique", emoji: "🧺", preco: 340, w: 2, d: 1, cat: "verao" },
  { id: "chuveirao", nome: "Chuveirão", emoji: "🚿", preco: 220, w: 1, d: 1, cat: "verao" },
  { id: "escorregador", nome: "Escorregador", emoji: "🛝", preco: 1300, w: 2, d: 1, cat: "verao" },
  { id: "fogueiraL", nome: "Fogueira com troncos", emoji: "🔥", preco: 450, w: 1, d: 1, cat: "verao", luz: true },
  // pets
  { id: "cachorro", nome: "Cachorro com casinha", emoji: "🐶", preco: 800, w: 2, d: 1, cat: "pet" },
  { id: "gato", nome: "Gatinho na almofada", emoji: "🐱", preco: 600, w: 1, d: 1, cat: "pet" },
  { id: "coelho", nome: "Coelhinho", emoji: "🐰", preco: 500, w: 1, d: 1, cat: "pet" },
  { id: "passaro", nome: "Gaiola com passarinho", emoji: "🐦", preco: 450, w: 1, d: 1, cat: "pet" },
  // parede (vai nos quadradinhos encostados na parede)
  { id: "quadro", nome: "Quadro", emoji: "🖼️", preco: 80, w: 1, d: 1, cat: "parede", tipo: "parede" },
  { id: "janela", nome: "Janela", emoji: "🪟", preco: 140, w: 1, d: 1, cat: "parede", tipo: "parede" },
  { id: "relogio", nome: "Relógio", emoji: "🕰️", preco: 100, w: 1, d: 1, cat: "parede", tipo: "parede" },
  { id: "prateleira", nome: "Prateleira", emoji: "📗", preco: 90, w: 1, d: 1, cat: "parede", tipo: "parede" },
];

export const NOMES_CATEGORIA: Record<CategoriaMovel, string> = {
  quarto: "🛏️ Quarto",
  sala: "🛋️ Sala",
  cozinha: "🍳 Cozinha",
  quintal: "🌳 Quintal",
  veiculo: "🚗 Veículos",
  lazer: "🎮 Lazer",
  pet: "🐶 Bichinhos",
  parede: "🖼️ Parede",
  enfeite: "🪴 Enfeites",
  verao: "🏖️ Área de lazer",
};

export function movel(id: string) {
  return MOVEIS.find((m) => m.id === id) ?? null;
}

export function estilo(id: string) {
  return ESTILOS.find((e) => e.id === id) ?? null;
}

export function comodoPadrao(id: ComodoId): Comodo {
  const externo = COMODOS.find((c) => c.id === id)?.externo;
  if (id === "garagem") return { piso: "concreto", parede: "cinza", itens: [] };
  return { piso: externo ? "grama" : "madeira", parede: "creme", itens: [] };
}

export function casaPadrao(): Casa {
  return { comodos: { quarto: comodoPadrao("quarto") }, moveis: {}, estilos: [] };
}

/** Tamanho no chão já considerando o giro. */
export function tamanhoNoChao(m: Movel, r: 0 | 1) {
  return r ? { w: m.d, d: m.w } : { w: m.w, d: m.d };
}

/** Valida o JSON salvo: tira móvel inexistente, fora do lugar ou sobrando. */
export function lerCasa(bruto: unknown): Casa | null {
  if (!bruto || typeof bruto !== "object") return null;
  const b = bruto as any;
  const moveis: Record<string, number> = {};
  for (const [id, q] of Object.entries(b.moveis ?? {})) {
    const n = Math.floor(Number(q));
    if (movel(id) && n > 0) moveis[id] = Math.min(20, n);
  }
  const estilos = (Array.isArray(b.estilos) ? b.estilos : []).filter((x: unknown) => typeof x === "string" && estilo(x as string));
  const casa: Casa = { comodos: {}, moveis, estilos };
  if (typeof b.desejo === "string" && movel(b.desejo)) casa.desejo = b.desejo;
  const usados: Record<string, number> = {};
  for (const c of COMODOS) {
    const raw = b.comodos?.[c.id];
    if (!raw || typeof raw !== "object") continue;
    const padrao = comodoPadrao(c.id);
    const piso = estilo(raw.piso)?.tipo === "piso" ? raw.piso : padrao.piso;
    const parede = estilo(raw.parede)?.tipo === "parede" ? raw.parede : padrao.parede;
    const comodo: Comodo = { piso, parede, itens: [] };
    for (const it of Array.isArray(raw.itens) ? raw.itens : []) {
      const mv = it && movel(it.m);
      if (!mv || typeof it.u !== "string") continue;
      const r = it.r === 1 ? 1 : 0;
      const x = Math.floor(Number(it.x));
      const y = Math.floor(Number(it.y));
      if ((usados[mv.id] ?? 0) >= (moveis[mv.id] ?? 0)) continue; // colocou mais do que tem
      if (!podeColocar(comodo, mv, x, y, r, c.id)) continue;
      comodo.itens.push({ u: it.u.slice(0, 12), m: mv.id, x, y, r });
      usados[mv.id] = (usados[mv.id] ?? 0) + 1;
    }
    casa.comodos[c.id] = comodo;
  }
  if (!casa.comodos.quarto) casa.comodos.quarto = comodoPadrao("quarto");
  return casa;
}

/** Quadradinhos ocupados (os de pisar, tipo tapete, e os de parede não contam). */
export function ocupados(comodo: Comodo, ignorar?: string): Set<string> {
  const s = new Set<string>();
  for (const it of comodo.itens) {
    if (it.u === ignorar) continue;
    const mv = movel(it.m);
    if (!mv || mv.tipo === "chao" || mv.tipo === "parede") continue;
    const t = tamanhoNoChao(mv, it.r);
    for (let i = 0; i < t.w; i++) for (let j = 0; j < t.d; j++) s.add(`${it.x + i},${it.y + j}`);
  }
  return s;
}

export function podeColocar(comodo: Comodo, mv: Movel, x: number, y: number, r: 0 | 1, comodoId?: ComodoId, ignorar?: string): boolean {
  const t = tamanhoNoChao(mv, r);
  if (x < 0 || y < 0 || x + t.w > TAM || y + t.d > TAM) return false;
  if (mv.tipo === "parede") {
    if (comodoId && COMODOS.find((c) => c.id === comodoId)?.externo) return false;
    if (x !== 0 && y !== 0) return false; // só encostado na parede
    // um enfeite de parede por quadradinho de parede
    const lado = x === 0 ? "e" : "d";
    const pos = lado === "e" ? y : x;
    return !comodo.itens.some((it) => {
      if (it.u === ignorar) return false;
      const o = movel(it.m);
      if (o?.tipo !== "parede") return false;
      const l2 = it.x === 0 ? "e" : "d";
      return l2 === lado && (l2 === "e" ? it.y : it.x) === pos;
    });
  }
  if (mv.tipo === "chao") {
    // tapete/piscina: não sobrepõe outro tapete
    return !comodo.itens.some((it) => {
      if (it.u === ignorar) return false;
      const o = movel(it.m);
      if (o?.tipo !== "chao") return false;
      const t2 = tamanhoNoChao(o, it.r);
      return x < it.x + t2.w && it.x < x + t.w && y < it.y + t2.d && it.y < y + t.d;
    });
  }
  const occ = ocupados(comodo, ignorar);
  for (let i = 0; i < t.w; i++) for (let j = 0; j < t.d; j++) if (occ.has(`${x + i},${y + j}`)) return false;
  return true;
}

/** Quantos desse móvel estão guardados (comprados e não colocados). */
export function guardados(casa: Casa, id: string) {
  let usados = 0;
  for (const c of Object.values(casa.comodos)) for (const it of c?.itens ?? []) if (it.m === id) usados++;
  return Math.max(0, (casa.moveis[id] ?? 0) - usados);
}

export function novoUid() {
  return Math.random().toString(36).slice(2, 10);
}

export function colocar(casa: Casa, comodoId: ComodoId, id: string, x: number, y: number, r: 0 | 1 = 0): Casa | null {
  const mv = movel(id);
  const comodo = casa.comodos[comodoId];
  if (!mv || !comodo || guardados(casa, id) <= 0) return null;
  if (!podeColocar(comodo, mv, x, y, r, comodoId)) return null;
  return { ...casa, comodos: { ...casa.comodos, [comodoId]: { ...comodo, itens: [...comodo.itens, { u: novoUid(), m: id, x, y, r }] } } };
}

export function mover(casa: Casa, comodoId: ComodoId, u: string, x: number, y: number, r?: 0 | 1): Casa | null {
  const comodo = casa.comodos[comodoId];
  const it = comodo?.itens.find((i) => i.u === u);
  const mv = it && movel(it.m);
  if (!comodo || !it || !mv) return null;
  const rr = r ?? it.r;
  if (!podeColocar(comodo, mv, x, y, rr, comodoId, u)) return null;
  return { ...casa, comodos: { ...casa.comodos, [comodoId]: { ...comodo, itens: comodo.itens.map((i) => (i.u === u ? { ...i, x, y, r: rr } : i)) } } };
}

export function girar(casa: Casa, comodoId: ComodoId, u: string): Casa | null {
  const it = casa.comodos[comodoId]?.itens.find((i) => i.u === u);
  if (!it) return null;
  return mover(casa, comodoId, u, it.x, it.y, it.r ? 0 : 1);
}

export function guardar(casa: Casa, comodoId: ComodoId, u: string): Casa {
  const comodo = casa.comodos[comodoId];
  if (!comodo) return casa;
  return { ...casa, comodos: { ...casa.comodos, [comodoId]: { ...comodo, itens: comodo.itens.filter((i) => i.u !== u) } } };
}

/** Compra (o custo entra no "gastos" do mascote). */
export function comprarMovel(casa: Casa, id: string, saldo: number): { casa: Casa; custo: number } | { erro: string } {
  const mv = movel(id);
  if (!mv) return { erro: "Não existe" };
  if ((casa.moveis[id] ?? 0) >= 20) return { erro: "Já tem bastante desse" };
  if (saldo < mv.preco) return { erro: `Faltam ${mv.preco - saldo} 🪙` };
  const nova: Casa = { ...casa, moveis: { ...casa.moveis, [id]: (casa.moveis[id] ?? 0) + 1 } };
  if (nova.desejo === id) delete nova.desejo; // realizou o sonho!
  return { casa: nova, custo: mv.preco };
}

export function desbloquearComodo(casa: Casa, id: ComodoId, saldo: number): { casa: Casa; custo: number } | { erro: string } {
  const c = COMODOS.find((x) => x.id === id);
  if (!c) return { erro: "Não existe" };
  if (casa.comodos[id]) return { erro: "Já é seu" };
  if (saldo < c.preco) return { erro: `Faltam ${c.preco - saldo} 🪙` };
  return { casa: { ...casa, comodos: { ...casa.comodos, [id]: comodoPadrao(id) } }, custo: c.preco };
}

export function usarEstilo(casa: Casa, comodoId: ComodoId, id: string, saldo: number): { casa: Casa; custo: number } | { erro: string } {
  const e = estilo(id);
  const comodo = casa.comodos[comodoId];
  if (!e || !comodo) return { erro: "Não existe" };
  const externo = !!COMODOS.find((c) => c.id === comodoId)?.externo;
  if (e.tipo === "piso" && !!e.externo !== externo) return { erro: externo ? "Esse piso é de dentro de casa" : "Esse piso é do quintal" };
  if (e.tipo === "parede" && externo) return { erro: "O quintal não tem parede" };
  const tem = e.preco === 0 || casa.estilos.includes(id);
  if (!tem && saldo < e.preco) return { erro: `Faltam ${e.preco - saldo} 🪙` };
  const novo = { ...comodo, [e.tipo]: id } as Comodo;
  return {
    casa: { ...casa, estilos: tem ? casa.estilos : [...casa.estilos, id], comodos: { ...casa.comodos, [comodoId]: novo } },
    custo: tem ? 0 : e.preco,
  };
}

// ---- Etapa 308 — o sonho (meta de compra) ----

export function definirDesejo(casa: Casa, id: string | null): Casa {
  const c = { ...casa };
  if (id && movel(id)) c.desejo = id;
  else delete c.desejo;
  return c;
}

/** Progresso rumo ao sonho: quanto falta e mais ou menos quantos hábitos. */
export function progressoDoDesejo(casa: Casa | null | undefined, moedas: number, moedasPorHabito = 10) {
  const mv = casa?.desejo ? movel(casa.desejo) : null;
  if (!mv) return null;
  const faltam = Math.max(0, mv.preco - moedas);
  return { movel: mv, progresso: Math.min(1, moedas / mv.preco), faltam, habitos: Math.ceil(faltam / moedasPorHabito), pronto: faltam === 0 };
}
