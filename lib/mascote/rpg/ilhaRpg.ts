// Etapa 323 — a ilha em RPG (visão de cima, pixel art): o mapa em grade,
// o que é chão, o que bloqueia, onde ficam as construções, as pessoas
// da ilha e o caminho até um lugar (tocar pra andar). Tudo calculado
// aqui, sem imagem nenhuma — o desenho fica no JogoIlha.

export const TILE = 16;
export const LARGURA = 46;
export const ALTURA = 36;

export type Chao = "agua" | "areia" | "grama" | "trilha" | "pedra" | "pier";
export type LugarIlha = "casa" | "lojinha" | "conquistas" | "jardim" | "feira" | "pesca" | "juntos" | "missoes";
export type EstiloConstrucao = "casa" | "loja" | "templo" | "horta" | "barraca" | "banco" | "quadro" | "nenhum";

export type Construcao = {
  id: LugarIlha;
  nome: string;
  emoji: string;
  estilo: EstiloConstrucao;
  x: number;
  y: number;
  w: number;
  h: number;
  /** onde a pessoa para pra entrar (fora do bloco) */
  porta: { x: number; y: number };
};

export type TipoDecoracao = "arvore" | "pinheiro" | "arbusto" | "pedra" | "placa" | "fonte" | "flor" | "concha" | "lampiao" | "estatua" | "bau";
export type Decoracao = { tipo: TipoDecoracao; x: number; y: number; variante: number; texto?: string };

export type Npc = { id: "flora" | "ze" | "lia"; nome: string; x: number; y: number; roupa: string; cabelo: string; pele: string; chapeu?: string };

export type MapaIlha = {
  w: number;
  h: number;
  chao: Chao[];
  solido: Uint8Array;
  construcoes: Construcao[];
  decoracoes: Decoracao[];
  npcs: Npc[];
  inicio: { x: number; y: number };
  /** Etapa 324 — barranco: a grama fica num platô acima da praia */
  penhasco: Uint8Array;
  /** degraus onde a trilha desce o barranco */
  degrau: Uint8Array;
  /** chão antes das trilhas/praça (pra saber onde é platô de grama) */
  original: Chao[];
};

export type Interacao =
  | { tipo: "lugar"; construcao: Construcao }
  | { tipo: "npc"; npc: Npc }
  | { tipo: "placa"; decoracao: Decoracao }
  | { tipo: "bau"; decoracao: Decoracao };

/** gerador de números com semente (a ilha é sempre a mesma) */
export function semente(n: number) {
  let a = n >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** número fixo por quadradinho (pra variar o desenho sem mudar a cada quadro) */
export function ruido(x: number, y: number, k = 0) {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const idx = (m: { w: number }, x: number, y: number) => y * m.w + x;
export const dentro = (m: { w: number; h: number }, x: number, y: number) => x >= 0 && y >= 0 && x < m.w && y < m.h;

export function chaoEm(m: MapaIlha, x: number, y: number): Chao {
  return dentro(m, x, y) ? m.chao[idx(m, x, y)] : "agua";
}

export function ehSolido(m: MapaIlha, x: number, y: number) {
  if (!dentro(m, x, y)) return true;
  return m.solido[idx(m, x, y)] === 1;
}

function formaDaIlha(x: number, y: number) {
  const dx = (x + 0.5 - LARGURA / 2) / 20.5;
  const dy = (y + 0.5 - ALTURA / 2) / 15.5;
  const onda = 0.09 * Math.sin(x * 1.3 + y * 0.7) + 0.07 * Math.sin(y * 1.9 - x * 0.45) + 0.05 * Math.sin(x * 0.5 + 2);
  return dx ** 4 + dy ** 4 + onda;
}

export function gerarIlha(): MapaIlha {
  const w = LARGURA;
  const h = ALTURA;
  const chao: Chao[] = new Array(w * h).fill("agua");
  const solido = new Uint8Array(w * h);
  const m: MapaIlha = { w, h, chao, solido, construcoes: [], decoracoes: [], npcs: [], inicio: { x: 22, y: 19 }, penhasco: new Uint8Array(w * h), degrau: new Uint8Array(w * h), original: chao };
  const por = (x: number, y: number, c: Chao) => dentro(m, x, y) && (chao[idx(m, x, y)] = c);

  // 1) terra, areia e mar
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = formaDaIlha(x, y);
      if (v < 1) chao[idx(m, x, y)] = v > 0.62 ? "areia" : "grama";
    }

  const original = chao.slice();

  // 2) praça de pedra com a fonte no meio
  for (let y = 12; y <= 19; y++) for (let x = 18; x <= 27; x++) por(x, y, "pedra");

  // 3) construções
  const C: Construcao[] = [
    // Etapa 325 — tamanhos das construções do pacote de pixel art (4×3 as casas)
    { id: "conquistas", nome: "Salão das Conquistas", emoji: "🏆", estilo: "templo", x: 20, y: 5, w: 4, h: 3, porta: { x: 21, y: 8 } },
    { id: "casa", nome: "Sua casa", emoji: "🏠", estilo: "casa", x: 8, y: 8, w: 4, h: 3, porta: { x: 9, y: 11 } },
    { id: "lojinha", nome: "Lojinha", emoji: "🛍️", estilo: "loja", x: 31, y: 8, w: 4, h: 3, porta: { x: 32, y: 11 } },
    { id: "jardim", nome: "Jardim", emoji: "🌱", estilo: "horta", x: 7, y: 22, w: 6, h: 4, porta: { x: 9, y: 21 } },
    { id: "feira", nome: "Feirinha", emoji: "🛒", estilo: "barraca", x: 30, y: 22, w: 4, h: 2, porta: { x: 31, y: 21 } },
    { id: "juntos", nome: "Banco dos Juntos", emoji: "💞", estilo: "banco", x: 21, y: 24, w: 3, h: 1, porta: { x: 24, y: 24 } },
    { id: "missoes", nome: "Quadro de Missões", emoji: "🎯", estilo: "quadro", x: 28, y: 13, w: 1, h: 1, porta: { x: 28, y: 14 } },
  ];

  // 4) trilhas: de cada porta até a praça (em L)
  const trilha = (ax: number, ay: number, bx: number, by: number) => {
    let x = ax;
    let y = ay;
    const marca = () => {
      const c = chaoEm(m, x, y);
      if (c === "grama" || c === "areia") por(x, y, "trilha");
    };
    marca();
    while (y !== by) {
      y += Math.sign(by - y);
      marca();
    }
    while (x !== bx) {
      x += Math.sign(bx - x);
      marca();
    }
  };
  for (const c of C) {
    const alvoX = Math.min(27, Math.max(18, c.porta.x));
    const alvoY = Math.min(19, Math.max(12, c.porta.y));
    trilha(c.porta.x, c.porta.y, alvoX, alvoY);
  }

  // 5) píer de pesca: segue a trilha pro leste até o mar e entra 6 quadrinhos
  let px = 28;
  while (px < w - 1 && chaoEm(m, px, 17) !== "agua") px++;
  trilha(28, 17, px - 1, 17);
  for (let x = px; x < Math.min(w - 1, px + 6); x++) {
    por(x, 17, "pier");
    por(x, 18, "pier");
  }
  const fimPier = Math.min(w - 2, px + 5);
  C.push({ id: "pesca", nome: "Píer de pesca", emoji: "🎣", estilo: "nenhum", x: fimPier + 1, y: 17, w: 0, h: 0, porta: { x: fimPier, y: 17 } });
  m.construcoes = C;

  // 6) o que bloqueia: mar e construções
  for (let i = 0; i < w * h; i++) solido[i] = chao[i] === "agua" ? 1 : 0;
  for (const c of C) for (let y = c.y; y < c.y + c.h; y++) for (let x = c.x; x < c.x + c.w; x++) dentro(m, x, y) && (solido[idx(m, x, y)] = 1);
  // barranco entre o platô de grama e a praia (a trilha desce por degraus)
  // Etapa 325: o barranco fica no último quadrinho de grama (como no pacote de pixel art)
  for (let y = 0; y < h - 1; y++)
    for (let x = 0; x < w; x++) {
      const i = idx(m, x, y);
      if (original[i] !== "grama" || original[idx(m, x, y + 1)] === "grama") continue;
      if (chao[i] === "grama") {
        m.penhasco[i] = 1;
        solido[i] = 1;
      } else if (chao[i] === "trilha") m.degrau[i] = 1;
    }
  m.original = original;

  // 7) decoração fixa
  const fixo: Decoracao[] = [
    { tipo: "fonte", x: 22, y: 14, variante: 0 },
    { tipo: "placa", x: 20, y: 19, variante: 0, texto: "Bem-vindo à ilha! Cada hábito feito faz ela crescer." },
    { tipo: "placa", x: px - 2, y: 16, variante: 0, texto: "→ Píer de pesca. 1 isca por hábito feito hoje." },
    { tipo: "placa", x: 11, y: 21, variante: 0, texto: "Jardim — suas plantinhas crescem com os hábitos." },
    { tipo: "estatua", x: 20, y: 8, variante: 0 },
    { tipo: "bau", x: 26, y: 18, variante: 0 },
    { tipo: "estatua", x: 22, y: 8, variante: 0 },
    { tipo: "lampiao", x: 18, y: 12, variante: 0 },
    { tipo: "lampiao", x: 27, y: 12, variante: 0 },
    { tipo: "lampiao", x: 18, y: 19, variante: 0 },
    { tipo: "lampiao", x: 27, y: 19, variante: 0 },
  ];
  // a fonte ocupa 2×2
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) solido[idx(m, 22 + dx, 14 + dy)] = 1;
  for (const d of fixo) if (d.tipo !== "fonte") solido[idx(m, d.x, d.y)] = 1;
  m.decoracoes.push(...fixo);

  // 8) pessoas da ilha
  m.npcs = [
    { id: "flora", nome: "Dona Flora", x: 13, y: 20, roupa: "#7FB069", cabelo: "#E8E2D6", pele: "#F1C9A5", chapeu: "#E9C46A" },
    { id: "ze", nome: "Seu Zé", x: fimPier, y: 18, roupa: "#3D7DCA", cabelo: "#5B4636", pele: "#C68B59", chapeu: "#D9B26F" },
    { id: "lia", nome: "Lia", x: 29, y: 23, roupa: "#E76F51", cabelo: "#2B2118", pele: "#8D5A3B" },
  ];
  for (const n of m.npcs) solido[idx(m, n.x, n.y)] = 1;

  // 9) natureza espalhada (sem atrapalhar caminhos e portas)
  const livre = (x: number, y: number, folga: number) => {
    for (let yy = y - folga; yy <= y + folga; yy++)
      for (let xx = x - folga; xx <= x + folga; xx++) {
        if (!dentro(m, xx, yy)) return false;
        const c = chao[idx(m, xx, yy)];
        if (c === "trilha" || c === "pedra" || c === "pier") return false;
        if (C.some((k) => xx >= k.x - 1 && xx <= k.x + k.w && yy >= k.y - 1 && yy <= k.y + k.h)) return false;
        if (C.some((k) => xx === k.porta.x && yy === k.porta.y)) return false;
        if (m.npcs.some((n) => n.x === xx && n.y === yy)) return false;
      }
    return true;
  };
  const r = semente(323);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const c = chao[idx(m, x, y)];
      if (solido[idx(m, x, y)]) continue;
      const v = r();
      if (c === "grama" && livre(x, y, 1)) {
        // mais árvores perto da borda, clareiras no meio
        const borda = formaDaIlha(x, y);
        const chance = borda > 0.35 ? 0.2 : 0.07;
        if (v < chance) {
          m.decoracoes.push({ tipo: r() < 0.3 ? "pinheiro" : "arvore", x, y, variante: Math.floor(r() * 3) });
          solido[idx(m, x, y)] = 1;
          continue;
        }
        if (v < chance + 0.03) {
          m.decoracoes.push({ tipo: "arbusto", x, y, variante: Math.floor(r() * 2) });
          solido[idx(m, x, y)] = 1;
          continue;
        }
      }
      if (c === "grama" && v > 0.9 && livre(x, y, 0)) m.decoracoes.push({ tipo: "flor", x, y, variante: Math.floor(r() * 4) });
      if (c === "areia" && livre(x, y, 1)) {
        if (v < 0.035) {
          m.decoracoes.push({ tipo: "pedra", x, y, variante: Math.floor(r() * 2) });
          solido[idx(m, x, y)] = 1;
        } else if (v > 0.95) m.decoracoes.push({ tipo: "concha", x, y, variante: Math.floor(r() * 2) });
      }
    }

  return m;
}

/** Caminho andando em 4 direções (BFS) até o quadrinho, ou até o vizinho livre mais perto se o alvo bloqueia. */
export function caminho(m: MapaIlha, de: { x: number; y: number }, para: { x: number; y: number }): { x: number; y: number }[] | null {
  const alvos = new Set<number>();
  if (!ehSolido(m, para.x, para.y)) alvos.add(idx(m, para.x, para.y));
  else
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]])
      if (!ehSolido(m, para.x + dx, para.y + dy)) alvos.add(idx(m, para.x + dx, para.y + dy));
  if (alvos.size === 0 || !dentro(m, de.x, de.y)) return null;
  const inicio = idx(m, de.x, de.y);
  const veio = new Int32Array(m.w * m.h).fill(-1);
  veio[inicio] = inicio;
  const fila = [inicio];
  for (let i = 0; i < fila.length; i++) {
    const atual = fila[i];
    if (alvos.has(atual)) {
      const passos: { x: number; y: number }[] = [];
      let k = atual;
      while (k !== inicio) {
        passos.push({ x: k % m.w, y: Math.floor(k / m.w) });
        k = veio[k];
      }
      return passos.reverse();
    }
    const x = atual % m.w;
    const y = Math.floor(atual / m.w);
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (ehSolido(m, nx, ny)) continue;
      const n = idx(m, nx, ny);
      if (veio[n] !== -1) continue;
      veio[n] = atual;
      fila.push(n);
    }
  }
  return null;
}

/** O que dá pra fazer onde a pessoa está (perto de porta, pessoa ou placa). */
export function interacaoPerto(m: MapaIlha, px: number, py: number): Interacao | null {
  const perto = (x: number, y: number, raio: number) => Math.hypot(px - (x + 0.5), py - (y + 0.5)) <= raio;
  for (const n of m.npcs) if (perto(n.x, n.y, 1.45)) return { tipo: "npc", npc: n };
  for (const c of m.construcoes) if (perto(c.porta.x, c.porta.y, 0.95)) return { tipo: "lugar", construcao: c };
  for (const d of m.decoracoes) if (d.tipo === "placa" && perto(d.x, d.y, 1.3)) return { tipo: "placa", decoracao: d };
  for (const d of m.decoracoes) if (d.tipo === "bau" && perto(d.x, d.y, 1.3)) return { tipo: "bau", decoracao: d };
  return null;
}

/** Em qual construção/pessoa/placa caiu um toque (pra andar até lá e já interagir). */
export function alvoDoToque(m: MapaIlha, x: number, y: number): Interacao | null {
  for (const n of m.npcs) if (n.x === x && (n.y === y || n.y - 1 === y)) return { tipo: "npc", npc: n };
  for (const c of m.construcoes) {
    if (x === c.porta.x && y === c.porta.y) return { tipo: "lugar", construcao: c };
    if (x >= c.x && x < c.x + c.w && y >= c.y - 2 && y < c.y + c.h) return { tipo: "lugar", construcao: c };
  }
  for (const d of m.decoracoes) if ((d.tipo === "placa" || d.tipo === "bau") && d.x === x && d.y === y) return { tipo: d.tipo, decoracao: d } as Interacao;
  return null;
}

/** Quadrinho onde ficar pra interagir com o alvo. */
export function pontoDoAlvo(m: MapaIlha, a: Interacao): { x: number; y: number } {
  if (a.tipo === "lugar") return a.construcao.porta;
  const { x, y } = a.tipo === "npc" ? a.npc : a.decoracao;
  for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) if (!ehSolido(m, x + dx, y + dy)) return { x: x + dx, y: y + dy };
  return { x, y };
}
