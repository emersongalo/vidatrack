// Etapa 325 — a ilha com o pacote de pixel art "Ninja Adventure" (Pixel-boy,
// licença CC0: uso livre, inclusive comercial). As imagens ficam em
// /public/ilha (no próprio app, nada no Supabase). Aqui: carregar as
// imagens, montar o chão a partir dos quadrinhos do pacote e recortar
// casas, árvores, enfeites e as pessoas.
import { chaoEm, ruido, TILE, type Construcao, type Decoracao, type MapaIlha, type Npc } from "./ilhaRpg";
import { novoCanvas, spriteDecoracao as spriteProcedural, type Direcao } from "./pixelArte";


export type Pacote = {
  tiles: HTMLImageElement;
  npcs: Record<Npc["id"], HTMLImageElement>;
  /** Etapa 326 — baú e bichinhos que passeiam */
  bau: HTMLImageElement;
  bichos: HTMLImageElement[];
};

export const ROSTO_NPC: Record<Npc["id"], string> = {
  flora: "/ilha/rosto-flora.png",
  ze: "/ilha/rosto-ze.png",
  lia: "/ilha/rosto-lia.png",
};

function imagem(src: string) {
  return new Promise<HTMLImageElement>((ok, erro) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => erro(new Error(`não carregou ${src}`));
    i.src = src;
  });
}

let promessa: Promise<Pacote> | null = null;
export function carregarPacote() {
  if (!promessa)
    promessa = Promise.all([
      imagem("/ilha/tileset.png"),
      imagem("/ilha/npc-flora.png"),
      imagem("/ilha/npc-ze.png"),
      imagem("/ilha/npc-lia.png"),
      imagem("/ilha/itens/big-treasure-chest.png"),
      imagem("/ilha/bichos/cachorro.png"),
      imagem("/ilha/bichos/lagartinho.png"),
      imagem("/ilha/bichos/cogumelo.png"),
    ])
      .then(([tiles, flora, ze, lia, bau, cachorro, lagartinho, cogumelo]) => ({ tiles, npcs: { flora, ze, lia }, bau, bichos: [cachorro, lagartinho, cogumelo] }))
      .catch((e) => {
        promessa = null;
        throw e;
      });
  return promessa;
}

type Ctx = CanvasRenderingContext2D;
/** copia um retângulo de quadrinhos do tileset (coluna, linha, largura, altura em quadrinhos) */
const quadrinho = (ctx: Ctx, p: Pacote, col: number, lin: number, x: number, y: number, w = 1, h = 1) =>
  ctx.drawImage(p.tiles, col * TILE, lin * TILE, w * TILE, h * TILE, x, y, w * TILE, h * TILE);

// ───────────────────────── chão ─────────────────────────

// platô de grama em 9 pedaços (o de baixo já tem o barranco)
const PLATO = {
  TL: [12, 15], T: [13, 15], TR: [17, 15],
  L: [12, 16], C: [14, 16], R: [17, 16],
  BL: [12, 17], B: [13, 17], BR: [17, 17],
  // coluna de 1 quadrinho de largura
  sT: [11, 15], sM: [11, 16], sB: [11, 17],
  rampa: [14, 17],
} as const;
const GRAMA_ENFEITE: [number, number][] = [[13, 16], [15, 16]];
const HORTA = { TL: [20, 15], T: [21, 15], TR: [22, 15], L: [20, 16], C: [21, 16], R: [22, 16], BL: [20, 17], B: [21, 17], BR: [22, 17] } as const;
const AREIA: [number, number] = [18, 6];
const TRILHA: [number, number] = [19, 11];
const PRACA: [number, number] = [26, 11];
const AGUA: [number, number] = [20, 8];
const AGUA_ENFEITE: [number, number][] = [[23, 7], [23, 9], [23, 6]];
const PIER: [number, number] = [25, 8];

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const C_BORDA_AREIA = hex("#EF4E29");
const C_BORDA_AREIA2 = hex("#FF9554");
const C_AGUA_ESC = hex("#367C98");
const C_AGUA_MEIO = hex("#43B1DE");
const C_CONTORNO_GRAMA = hex("#1D3A14");
const C_GRAMA_LUZ = hex("#8BC43A");
const C_ESPUMA = hex("#E8F7FF");

export function montarChao(m: MapaIlha, p: Pacote, quadros: number, decoracoes: Decoracao[], horta: Construcao | undefined): HTMLCanvasElement[] {
  const W = m.w * TILE;
  const H = m.h * TILE;
  const plato = (x: number, y: number) => x >= 0 && y >= 0 && x < m.w && y < m.h && m.original[y * m.w + x] === "grama";
  const tipo = (x: number, y: number) => chaoEm(m, x, y);
  const agua = (x: number, y: number) => tipo(x, y) === "agua" || tipo(x, y) === "pier";
  const caminho = (x: number, y: number) => {
    const t = tipo(x, y);
    return t === "trilha" || t === "pedra";
  };

  const saidas: HTMLCanvasElement[] = [];
  for (let q = 0; q < quadros; q++) {
    const { c, ctx } = novoCanvas(W, H, true);
    for (let ty = 0; ty < m.h; ty++)
      for (let tx = 0; tx < m.w; tx++) {
        const x = tx * TILE;
        const y = ty * TILE;
        const t = tipo(tx, ty);
        const k = ty * m.w + tx;
        if (t === "agua" || t === "pier") {
          const r = ruido(tx, ty, 200);
          const [cc, ll] = r > 0.95 ? AGUA_ENFEITE[(Math.floor(r * 1000) + q) % 2] : AGUA;
          quadrinho(ctx, p, cc, ll, x, y);
          if (t === "pier") quadrinho(ctx, p, PIER[0], PIER[1], x, y);
          continue;
        }
        if (m.degrau[k]) {
          quadrinho(ctx, p, PLATO.rampa[0], PLATO.rampa[1], x, y);
          continue;
        }
        if (plato(tx, ty) && (t === "grama" || m.penhasco[k])) {
          const N = plato(tx, ty - 1);
          const S = plato(tx, ty + 1);
          const O = plato(tx - 1, ty);
          const L = plato(tx + 1, ty);
          // por baixo do platô aparece a areia (nos cantos arredondados)
          quadrinho(ctx, p, AREIA[0], AREIA[1], x, y);
          let peca: readonly [number, number] = PLATO.C;
          if (!O && !L) peca = !S ? PLATO.sB : !N ? PLATO.sT : PLATO.sM;
          else if (!S) peca = !O ? PLATO.BL : !L ? PLATO.BR : PLATO.B;
          else if (!N) peca = !O ? PLATO.TL : !L ? PLATO.TR : PLATO.T;
          else if (!O) peca = PLATO.L;
          else if (!L) peca = PLATO.R;
          else {
            const r = ruido(tx, ty, 5);
            peca = r > 0.94 ? GRAMA_ENFEITE[0] : r > 0.93 ? GRAMA_ENFEITE[1] : PLATO.C;
          }
          quadrinho(ctx, p, peca[0], peca[1], x, y);
          continue;
        }
        if (t === "pedra") quadrinho(ctx, p, PRACA[0], PRACA[1], x, y);
        else if (t === "trilha") quadrinho(ctx, p, TRILHA[0], TRILHA[1], x, y);
        else quadrinho(ctx, p, AREIA[0], AREIA[1], x, y);
      }

    // horta do jardim (terra arada com borda de grama)
    if (horta)
      for (let yy = 0; yy < horta.h; yy++)
        for (let xx = 0; xx < horta.w; xx++) {
          const top = yy === 0;
          const fim = yy === horta.h - 1;
          const esq = xx === 0;
          const dir = xx === horta.w - 1;
          const peca = top ? (esq ? HORTA.TL : dir ? HORTA.TR : HORTA.T) : fim ? (esq ? HORTA.BL : dir ? HORTA.BR : HORTA.B) : esq ? HORTA.L : dir ? HORTA.R : HORTA.C;
          quadrinho(ctx, p, peca[0], peca[1], (horta.x + xx) * TILE, (horta.y + yy) * TILE);
        }

    // passada pixel a pixel: borda da praia (vermelho/laranja), água rasa e
    // borda escura onde a grama encontra a trilha/praça
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    const por = (i: number, c: number[]) => {
      d[i] = c[0];
      d[i + 1] = c[1];
      d[i + 2] = c[2];
      d[i + 3] = 255;
    };
    for (let ty = 0; ty < m.h; ty++)
      for (let tx = 0; tx < m.w; tx++) {
        const t = tipo(tx, ty);
        const ehAgua = t === "agua";
        const ehAreia = t === "areia" && !plato(tx, ty);
        const ehGrama = plato(tx, ty) && t === "grama" && !m.penhasco[ty * m.w + tx];
        if (!ehAgua && !ehAreia && !ehGrama) continue;
        const outro = ehAgua ? (x: number, y: number) => !agua(x, y) : ehAreia ? agua : caminho;
        const N = outro(tx, ty - 1), S = outro(tx, ty + 1), O = outro(tx - 1, ty), L = outro(tx + 1, ty);
        const NO = outro(tx - 1, ty - 1), NE = outro(tx + 1, ty - 1), SO = outro(tx - 1, ty + 1), SE = outro(tx + 1, ty + 1);
        if (!N && !S && !O && !L && !NO && !NE && !SO && !SE) continue;
        for (let ly = 0; ly < TILE; ly++)
          for (let lx = 0; lx < TILE; lx++) {
            // distância até o vizinho "diferente" (cantos arredondados)
            let dist = 99;
            if (N) dist = Math.min(dist, ly);
            if (S) dist = Math.min(dist, TILE - 1 - ly);
            if (O) dist = Math.min(dist, lx);
            if (L) dist = Math.min(dist, TILE - 1 - lx);
            if (NO && !N && !O) dist = Math.min(dist, Math.hypot(lx, ly) - 1);
            if (NE && !N && !L) dist = Math.min(dist, Math.hypot(TILE - 1 - lx, ly) - 1);
            if (SO && !S && !O) dist = Math.min(dist, Math.hypot(lx, TILE - 1 - ly) - 1);
            if (SE && !S && !L) dist = Math.min(dist, Math.hypot(TILE - 1 - lx, TILE - 1 - ly) - 1);
            if (dist > 5) continue;
            const i = ((ty * TILE + ly) * W + tx * TILE + lx) * 4;
            if (ehAgua) {
              const onda = Math.sin((tx * TILE + lx) * 0.35 + (ty * TILE + ly) * 0.2 + q * 1.6) > 0.55;
              if (dist < 1.5) por(i, C_AGUA_ESC);
              else if (dist < 2.5 && onda) por(i, C_ESPUMA);
              else if (dist < 4.5) por(i, C_AGUA_MEIO);
            } else if (ehAreia) {
              if (dist < 1.5) por(i, C_BORDA_AREIA);
              else if (dist < 2.5) por(i, C_BORDA_AREIA2);
            } else {
              if (dist < 1) por(i, C_CONTORNO_GRAMA);
              else if (dist < 2) por(i, C_GRAMA_LUZ);
            }
          }
      }
    // brilhinhos no mar
    for (let k = 0; k < 160; k++) {
      const x = Math.floor(ruido(k, q, 400) * W);
      const y = Math.floor(ruido(k, q, 401) * H);
      if (!agua(Math.floor(x / TILE), Math.floor(y / TILE)) || tipo(Math.floor(x / TILE), Math.floor(y / TILE)) === "pier") continue;
      for (let j = 0; j < 3; j++) por(((y) * W + x + j) * 4, j === 1 ? [255, 255, 255] : C_ESPUMA);
    }
    ctx.putImageData(img, 0, 0);

    // flores e plantinhas (dá pra pisar) e conchas
    const FLORES: [number, number][] = [[1, 8], [2, 8], [3, 15], [0, 5]];
    for (const dd of decoracoes) {
      if (dd.tipo === "flor") {
        const [cc, ll] = FLORES[dd.variante % FLORES.length];
        quadrinho(ctx, p, cc, ll, dd.x * TILE, dd.y * TILE);
      }
      if (dd.tipo === "concha") {
        const x = dd.x * TILE + 6;
        const y = dd.y * TILE + 7;
        ctx.fillStyle = "#1A1A1A";
        ctx.fillRect(x - 1, y - 1, 6, 4);
        ctx.fillStyle = dd.variante ? "#FFB3C7" : "#FFF3E0";
        ctx.fillRect(x, y, 4, 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x + 1, y, 1, 1);
      }
    }
    // plantação da horta
    if (horta) {
      const PLANTAS: [number, number][] = [[0, 8], [13, 8], [4, 8], [2, 9], [13, 9]];
      for (let yy = 1; yy < horta.h - 1; yy++)
        for (let xx = 1; xx < horta.w - 1; xx++) {
          const [cc, ll] = PLANTAS[(xx + yy * 2) % PLANTAS.length];
          quadrinho(ctx, p, cc, ll, (horta.x + xx) * TILE, (horta.y + yy) * TILE);
        }
    }
    saidas.push(c);
  }
  return saidas;
}

// ───────────────────────── sprites ─────────────────────────

const cache = new Map<string, { img: HTMLCanvasElement; dx: number; dy: number }>();
function recorte(p: Pacote, chave: string, partes: [number, number, number, number, number, number][], w: number, h: number, dx: number, dy: number) {
  let s = cache.get(chave);
  if (!s) {
    const { c, ctx } = novoCanvas(w, h, true);
    for (const [col, lin, cw, ch, x, y] of partes) quadrinho(ctx, p, col, lin, x, y, cw, ch);
    s = { img: c, dx, dy };
    cache.set(chave, s);
  }
  return s;
}

export function spriteDecoracaoPacote(d: Decoracao, p: Pacote): { img: HTMLCanvasElement; dx: number; dy: number } | null {
  if (d.tipo === "arvore") {
    return recorte(p, "arvore", [[0, 10, 2, 2, 0, 0]], 32, 32, -8, -16);
  }
  if (d.tipo === "pinheiro") return recorte(p, "pinheiro", [[6, 10, 2, 2, 0, 0]], 32, 32, -8, -16);
  if (d.tipo === "arbusto") return recorte(p, `arbusto${d.variante}`, [[d.variante ? 9 : 0, d.variante ? 15 : 6, 1, 1, 0, 0]], 16, 16, 0, 0);
  if (d.tipo === "pedra") return recorte(p, `pedra${d.variante}`, [[d.variante ? 23 : 3, d.variante ? 10 : 6, 1, 1, 0, 0]], 16, 16, 0, 0);
  if (d.tipo === "lampiao") return recorte(p, "lampiao", [[10, 5, 1, 2, 0, 0]], 16, 32, 0, -16);
  if (d.tipo === "estatua") return recorte(p, "estatua", [[27, 6, 1, 2, 0, 0]], 16, 32, 0, -16);
  if (d.tipo === "fonte") return recorte(p, "poco", [[5, 6, 1, 2, 8, 0], [2, 6, 1, 1, 26, 16], [1, 6, 1, 1, -10, 16]], 40, 32, -4, 0);
  // placa: a de código (já tem contorno)
  return spriteProcedural(d);
}

export function spriteConstrucaoPacote(c: Construcao, p: Pacote): { img: HTMLCanvasElement; dx: number; dy: number } | null {
  const W = c.w * TILE;
  const H = c.h * TILE;
  if (c.estilo === "casa") return recorte(p, "casa", [[0, 0, 4, 3, 0, 0]], W, H, 0, 0);
  if (c.estilo === "templo") return recorte(p, "templo", [[4, 0, 4, 3, 0, 0]], W, H, 0, 0);
  if (c.estilo === "loja") return recorte(p, "loja", [[12, 0, 4, 3, 0, 0]], W, H, 0, 0);
  if (c.estilo === "barraca") return recorte(p, "feira", [[5, 8, 2, 2, 0, 0], [7, 8, 2, 2, 32, 0]], 64, 32, 0, 0);
  if (c.estilo === "banco")
    return recorte(p, "banco", [[14, 6, 3, 1, 0, 16]], 48, 32, 0, -16);
  if (c.estilo === "quadro") return recorte(p, "quadro", [[11, 6, 1, 1, 0, 0]], 16, 16, 0, 0);
  return null; // horta vai no chão; píer não tem sprite
}

/** pessoa da ilha: folha 4 colunas (baixo, cima, esquerda, direita) × linhas de animação */
export function desenharNpcPacote(ctx: Ctx, p: Pacote, n: Npc, x: number, y: number, dir: Direcao, t: number) {
  const col = dir === "baixo" ? 0 : dir === "cima" ? 1 : dir === "esq" ? 2 : 3;
  const lin = Math.sin(t * 2.2 + n.x) > 0.85 ? 1 : 0;
  ctx.fillStyle = "rgba(15,35,15,0.30)";
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 15, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(p.npcs[n.id], col * 16, lin * 16, 16, 16, x, y, 16, 16);
}

/** baú (fechado/aberto), com brilho quando dá pra abrir */
export function desenharBau(ctx: Ctx, p: Pacote, x: number, y: number, aberto: boolean, t: number) {
  ctx.fillStyle = "rgba(15,35,15,0.30)";
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 14, 7, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(p.bau, aberto ? 16 : 0, 0, 16, 14, x, y + 1, 16, 14);
  if (!aberto) {
    const f = (t / 600) % 1;
    ctx.fillStyle = `rgba(255,240,170,${1 - f})`;
    ctx.fillRect(x + 3 + f * 2, y - 2 - f * 4, 1, 1);
    ctx.fillRect(x + 12 - f * 2, y - 1 - f * 5, 1, 1);
  }
}

const COLUNA: Record<Direcao, number> = { baixo: 0, cima: 1, esq: 2, dir: 3 };

export type BichoSolto = { img: HTMLImageElement; x: number; y: number; ax: number; ay: number; dir: Direcao; espera: number; passo: number; cachorro: boolean };

/** bichinhos passeando: escolhem um ponto livre perto e vão andando */
export function moverBicho(b: BichoSolto, livre: (x: number, y: number) => boolean, dt: number, sorteio: () => number) {
  if (b.espera > 0) {
    b.espera -= dt;
    return;
  }
  const dx = b.ax - b.x;
  const dy = b.ay - b.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.05) {
    b.espera = 1 + sorteio() * 3;
    for (let k = 0; k < 8; k++) {
      const nx = Math.floor(b.x) + Math.round((sorteio() - 0.5) * 6) + 0.5;
      const ny = Math.floor(b.y) + Math.round((sorteio() - 0.5) * 6) + 0.8;
      if (livre(nx, ny)) {
        b.ax = nx;
        b.ay = ny;
        break;
      }
    }
    return;
  }
  const v = Math.min(d, 1.3 * dt);
  const nx = b.x + (dx / d) * v;
  const ny = b.y + (dy / d) * v;
  if (!livre(nx, ny)) {
    b.ax = b.x;
    b.ay = b.y;
    return;
  }
  b.x = nx;
  b.y = ny;
  b.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "dir" : "esq") : dy > 0 ? "baixo" : "cima";
  b.passo += dt * 6;
}

export function desenharBichoSolto(ctx: Ctx, b: BichoSolto) {
  const x = Math.round(b.x * TILE - 8);
  const y = Math.round(b.y * TILE - 15);
  ctx.fillStyle = "rgba(15,35,15,0.28)";
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 15, 5, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  const q = Math.floor(b.passo) % (b.cachorro ? 2 : 4);
  if (b.cachorro) {
    // cachorrinho: 2 quadros olhando pra direita; espelha pra esquerda
    ctx.save();
    if (b.dir === "esq") {
      ctx.translate(x + 16, y);
      ctx.scale(-1, 1);
      ctx.drawImage(b.img, q * 16, 0, 16, 16, 0, 0, 16, 16);
    } else ctx.drawImage(b.img, q * 16, 0, 16, 16, x, y, 16, 16);
    ctx.restore();
    return;
  }
  ctx.drawImage(b.img, COLUNA[b.dir] * 16, q * 16, 16, 16, x, y, 16, 16);
}
