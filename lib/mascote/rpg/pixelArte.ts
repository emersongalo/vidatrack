// Etapa 323/324 — pixel art da ilha, desenhada por código (nenhuma imagem
// baixada nem guardada no Supabase). Etapa 324: bem mais detalhada — chão
// com textura e sombreado pixel a pixel (pontilhado estilo 16 bits),
// barranco entre a grama e a praia, mar com profundidade e espuma,
// contorno escuro em tudo e mascote/pessoas repaginados.
import { chaoEm, ruido, TILE, type Construcao, type Decoracao, type MapaIlha, type Npc } from "./ilhaRpg";

type Ctx = CanvasRenderingContext2D;

export const COR = {
  grama: "#5FA84C", gramaEsc: "#4E9442", gramaClara: "#89CB67", tufo: "#3F7F3A",
  areia: "#E8D29C", areiaEsc: "#DCC28B", areiaClara: "#F2E2B4",
  agua: "#3A8BC8", aguaEsc: "#2C74B6", aguaClara: "#6DBDEB", espuma: "#E8F7FF",
  trilha: "#C49866", trilhaEsc: "#B08455", trilhaClara: "#D4AB7A",
  pedra: "#D3CCBD", pedraJunta: "#8F8676", pedraClara: "#E4DED2",
  madeira: "#B07D4F", madeiraEsc: "#7E5533", madeiraClara: "#C9976A",
  tronco: "#6E4A2A", troncoEsc: "#4E331C",
  folha: "#4E9C4A", folhaClara: "#7CC66A", folhaEsc: "#2F6B33",
  pinho: "#3E8E5A", pinhoClaro: "#5DB176", pinhoEsc: "#2C6B43",
  sombra: "rgba(20,30,20,0.28)",
};

export function novoCanvas(w: number, h: number, leitura = false) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", leitura ? { willReadFrequently: true } : undefined)!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

const px = (ctx: Ctx, x: number, y: number, cor: string, w = 1, h = 1) => {
  ctx.fillStyle = cor;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
};

// ───────────────────────── cor e textura ─────────────────────────

type RGB = [number, number, number];
const rgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hex = ([r, g, b]: RGB) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
export const misturar = (a: string, b: string, t: number) => {
  const A = rgb(a);
  const B = rgb(b);
  return hex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
};
const clarear = (c: string, t: number) => misturar(c, "#FFFFFF", t);
const escurecer = (c: string, t: number) => misturar(c, "#10131A", t);

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
const pontilhado = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];

/** ruído suave (pra manchas de grama, ondas de areia...) */
function suave(x: number, y: number, escala: number, k: number) {
  const gx = x / escala;
  const gy = y / escala;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  let fx = gx - x0;
  let fy = gy - y0;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const a = ruido(x0, y0, k);
  const b = ruido(x0 + 1, y0, k);
  const c = ruido(x0, y0 + 1, k);
  const d = ruido(x0 + 1, y0 + 1, k);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** escolhe um tom da rampa com pontilhado (o "dither" dos jogos de 16 bits) */
function tom(rampa: RGB[], v: number, x: number, y: number, forca = 0.9): RGB {
  const i = Math.floor(v * rampa.length + pontilhado(x, y) * forca);
  return rampa[Math.max(0, Math.min(rampa.length - 1, i))];
}
const rampa = (...c: string[]) => c.map(rgb);

const R_GRAMA = rampa("#3B7536", "#468A3F", "#53A047", "#63B252", "#77C25F", "#8FD271");
const R_AREIA = rampa("#C9A96F", "#D8BC82", "#E5CD95", "#EED9A6", "#F6E7C0");
const R_TRILHA = rampa("#8E6440", "#A0754C", "#B4895A", "#C69C6A", "#D6B07F");
const R_AGUA = rampa("#1B568F", "#22659F", "#2C76B4", "#3A8BC8", "#4CA1DA", "#68B8E7", "#8CCFF1");
const R_ROCHA = rampa("#3E281B", "#5A3B27", "#734C32", "#8B5E3E", "#A2734D");
const R_PEDRA = rampa("#A79E8C", "#BDB5A3", "#CEC7B7", "#DCD6C8", "#E8E3D8");

/** contorno escuro em volta do desenho (o que dá o ar de jogo de verdade) */
export function contornar(c: HTMLCanvasElement, forca = 0.62) {
  const ctx = c.getContext("2d")!;
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const W = c.width;
  const H = c.height;
  const opaco = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] >= 200;
  const novo = new Uint8ClampedArray(d);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (d[i + 3] >= 200) continue;
      let viz = -1;
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]])
        if (opaco(x + dx, y + dy)) {
          viz = ((y + dy) * W + (x + dx)) * 4;
          break;
        }
      if (viz < 0) continue;
      novo[i] = d[viz] * (1 - forca) + 16 * forca;
      novo[i + 1] = d[viz + 1] * (1 - forca) + 14 * forca;
      novo[i + 2] = d[viz + 2] * (1 - forca) + 20 * forca;
      novo[i + 3] = 255;
    }
  img.data.set(novo);
  ctx.putImageData(img, 0, 0);
}

/** elipse cheia com luz vindo de cima-esquerda (3 a 5 tons) */
function bola(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, cores: string[], brilho = 0.55) {
  const R = cores.map(rgb);
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      const dd = dx * dx + dy * dy;
      if (dd > 1) continue;
      const luz = (1 - dd) * 0.55 + (-dx * 0.35 - dy * 0.65 + 1) * 0.5 * brilho;
      const c = tom(R, Math.min(0.999, Math.max(0, luz)), x, y, 0.8);
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.fillRect(x, y, 1, 1);
    }
}

function elipse(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, cor: string) {
  ctx.fillStyle = cor;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) ctx.fillRect(x, y, 1, 1);
    }
}

// ───────────────────────── chão ─────────────────────────

/** distância (em quadrinhos) até a terra, pra saber se o mar é raso ou fundo */
function distanciaDaTerra(m: MapaIlha) {
  const d = new Float32Array(m.w * m.h).fill(99);
  const fila: number[] = [];
  for (let i = 0; i < m.w * m.h; i++)
    if (m.chao[i] !== "agua" && m.chao[i] !== "pier") {
      d[i] = 0;
      fila.push(i);
    }
  for (let k = 0; k < fila.length; k++) {
    const i = fila[k];
    const x = i % m.w;
    const y = Math.floor(i / m.w);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
      const j = ny * m.w + nx;
      if (d[j] <= d[i] + 1) continue;
      d[j] = d[i] + 1;
      fila.push(j);
    }
  }
  return d;
}

export function desenharChao(m: MapaIlha, quadros: number, decoracoes: Decoracao[]): HTMLCanvasElement[] {
  const W = m.w * TILE;
  const H = m.h * TILE;
  const dist = distanciaDaTerra(m);
  const distEm = (x: number, y: number) => {
    // interpolação entre os centros dos quadrinhos (mar com degradê suave)
    const gx = x / TILE - 0.5;
    const gy = y / TILE - 0.5;
    const x0 = Math.max(0, Math.min(m.w - 2, Math.floor(gx)));
    const y0 = Math.max(0, Math.min(m.h - 2, Math.floor(gy)));
    const fx = Math.max(0, Math.min(1, gx - x0));
    const fy = Math.max(0, Math.min(1, gy - y0));
    const v = (xx: number, yy: number) => Math.min(4, dist[yy * m.w + xx]);
    return v(x0, y0) * (1 - fx) * (1 - fy) + v(x0 + 1, y0) * fx * (1 - fy) + v(x0, y0 + 1) * (1 - fx) * fy + v(x0 + 1, y0 + 1) * fx * fy;
  };
  const tipo = (tx: number, ty: number) => chaoEm(m, tx, ty);
  const ehAgua = (tx: number, ty: number) => {
    const t = tipo(tx, ty);
    return t === "agua" || t === "pier";
  };

  const base = new Uint8ClampedArray(W * H * 4);
  const aguaIdx: number[] = [];
  const por = (i: number, c: RGB) => {
    base[i] = c[0];
    base[i + 1] = c[1];
    base[i + 2] = c[2];
    base[i + 3] = 255;
  };

  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const tx = Math.floor(x / TILE);
      const ty = Math.floor(y / TILE);
      const lx = x - tx * TILE;
      const ly = y - ty * TILE;
      const t = tipo(tx, ty);
      const i = (y * W + x) * 4;
      const k = ty * m.w + tx;

      if (t === "agua" || t === "pier") {
        aguaIdx.push(i);
        continue;
      }
      if (m.penhasco[k]) {
        // barranco: beirada de grama, paredão de terra com veios e a sombra na areia
        const lip = 2 + Math.floor(suave(x, 0, 5, 31) * 2);
        if (ly < lip) por(i, tom(R_GRAMA, 0.55 + suave(x, y, 4, 2) * 0.3, x, y));
        else if (ly === lip) por(i, rgb("#2E5A2A"));
        else if (ly < 13) {
          const veio = suave(x * 1.0, y * 0.18, 3, 32);
          const luz = 0.75 - (ly - lip) / 14 + (veio - 0.5) * 0.55 + (lx < 2 && !m.penhasco[k - 1] ? -0.25 : 0);
          por(i, tom(R_ROCHA, Math.max(0, Math.min(0.99, luz)), x, y));
        } else if (ly === 13) por(i, rgb("#2A1B12"));
        else por(i, tom(R_AREIA, 0.12 + suave(x, y, 6, 4) * 0.2, x, y));
        continue;
      }
      if (m.degrau[k]) {
        // degraus de terra batida descendo o barranco
        const passo = ly % 5;
        const v = passo === 0 ? 0.92 : passo === 4 ? 0.12 : 0.55 + suave(x, y, 3, 5) * 0.2;
        por(i, tom(R_TRILHA, v, x, y, 0.4));
        if (lx === 0 || lx === TILE - 1) por(i, tom(R_ROCHA, 0.3, x, y));
        continue;
      }
      if (t === "grama") {
        let v = 0.62 * suave(x, y, 30, 1) + 0.28 * suave(x, y, 10, 2) + 0.1 * suave(x, y, 4, 3);
        // escurece perto da borda do platô
        const bordaAreia = [[0, -1], [-1, 0], [1, 0]].some(([dx, dy]) => tipo(tx + dx, ty + dy) === "areia");
        if (bordaAreia) {
          const lados = [ly, lx, TILE - 1 - lx];
          const viz = [tipo(tx, ty - 1), tipo(tx - 1, ty), tipo(tx + 1, ty)];
          for (let s = 0; s < 3; s++) if (viz[s] === "areia" && lados[s] < 2 + suave(x, y, 4, 9) * 2) v = s === 0 ? 0.95 : 0.05;
        }
        let c = tom(R_GRAMA, v, x, y, 0.55);
        // tufinhos de capim em "v" (2 por quadrinho, posição fixa)
        for (let q = 0; q < 2; q++) {
          const ax = Math.floor(ruido(tx, ty, 100 + q) * 12) + 2;
          const ay = Math.floor(ruido(tx, ty, 110 + q) * 11) + 3;
          const ddx = lx - ax;
          const ddy = ly - ay;
          if (ddy === 0 && (ddx === -2 || ddx === 0 || ddx === 2)) c = R_GRAMA[Math.min(5, Math.floor(v * 6) + 2)];
          else if (ddy === 1 && (ddx === -1 || ddx === 1 || ddx === 0)) c = R_GRAMA[Math.max(0, Math.floor(v * 6) - 2)];
        }
        if (ruido(x, y, 9) > 0.992) c = R_GRAMA[5];
        por(i, c);
        continue;
      }
      if (t === "areia") {
        let v = 0.55 * suave(x, y, 16, 4) + 0.45 * suave(x, y, 5, 5);
        const onda = Math.sin(x * 0.21 + y * 0.62 + suave(x, y, 26, 6) * 8);
        if (onda > 0.88) v -= 0.3;
        else if (onda < -0.93) v += 0.25;
        // areia molhada perto do mar
        const molhada = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => tipo(tx + dx, ty + dy) === "agua");
        if (molhada) v -= Math.max(0, 0.35 - distEm(x, y) * 0.5);
        if (ruido(x, y, 12) > 0.993) v = 0.98;
        por(i, tom(R_AREIA, Math.max(0, Math.min(0.99, v)), x, y));
        continue;
      }
      if (t === "trilha") {
        let v = 0.5 * suave(x, y, 9, 13) + 0.5 * suave(x, y, 3, 14);
        // bordas com grama: capim invadindo e terra mais escura
        const viz: [number, number, number][] = [[0, -1, ly], [0, 1, TILE - 1 - ly], [-1, 0, lx], [1, 0, TILE - 1 - lx]];
        let grama = false;
        for (const [dx, dy, dl] of viz) {
          const tv = tipo(tx + dx, ty + dy);
          if (tv !== "grama") continue;
          const larg = 1 + suave(x, y, 3, 15 + dx + dy * 2) * 3.2;
          if (dl < larg - 1) grama = true;
          else if (dl < larg + 1) v -= 0.3;
        }
        if (grama) {
          por(i, tom(R_GRAMA, 0.35 + suave(x, y, 4, 2) * 0.4, x, y));
          continue;
        }
        if (ruido(x, y, 16) > 0.982) v = 0.97;
        else if (ruido(x, y - 1, 16) > 0.982) v = 0.05;
        por(i, tom(R_TRILHA, Math.max(0, Math.min(0.99, v)), x, y));
        continue;
      }
      if (t === "pedra") {
        // calçamento de pedras irregulares com bisel
        const fila = Math.floor(y / 7);
        const desl = (fila % 2) * 5;
        const col = Math.floor((x + desl) / 10);
        const sx = (x + desl) % 10;
        const sy = y % 7;
        const sid = ruido(col, fila, 17);
        if (sx === 0 || sy === 0) por(i, rgb("#8F8676"));
        else {
          let v = 0.45 + sid * 0.35 + suave(x, y, 3, 18) * 0.15;
          if (sx === 1 || sy === 1) v += 0.3;
          if (sx === 9 || sy === 6) v -= 0.35;
          por(i, tom(R_PEDRA, Math.max(0, Math.min(0.99, v)), x, y, 0.5));
        }
        continue;
      }
    }

  const quadrosCanvas: HTMLCanvasElement[] = [];
  for (let q = 0; q < quadros; q++) {
    const dados = new Uint8ClampedArray(base);
    const fase = (q / quadros) * Math.PI * 2;
    for (const i of aguaIdx) {
      const p = i / 4;
      const x = p % W;
      const y = Math.floor(p / W);
      const dd = distEm(x, y) + (suave(x, y, 6, 27) - 0.5) * 0.45;
      let v = 1 - dd / 3.2 + (suave(x, y, 14, 21) - 0.5) * 0.3;
      const onda = Math.sin(x * 0.16 + y * 0.07 + fase + suave(x, y, 30, 7) * 6) * Math.sin(y * 0.42 + x * 0.05 - fase * 0.5);
      if (onda > 0.8) v += 0.2;
      else if (onda < -0.85) v -= 0.12;
      let c = tom(R_AGUA, Math.max(0, Math.min(0.99, v)), x, y);
      // espuma batendo na praia
      if (dd < 0.42) {
        const e = suave(x + q * 2, y, 3, 8 + q);
        c = dd < 0.22 || e > 0.6 ? rgb(COR.espuma) : rgb("#BFE6F8");
      }
      if (ruido(x, y, 40 + q) > 0.9965) c = [255, 255, 255];
      dados[i] = c[0];
      dados[i + 1] = c[1];
      dados[i + 2] = c[2];
      dados[i + 3] = 255;
    }
    const { c, ctx } = novoCanvas(W, H);
    ctx.putImageData(new ImageData(dados, W, H), 0, 0);
    desenharPierEDetalhes(ctx, m, decoracoes);
    quadrosCanvas.push(c);
  }
  return quadrosCanvas;
}

function desenharPierEDetalhes(ctx: Ctx, m: MapaIlha, decoracoes: Decoracao[]) {
  // píer de madeira com tábuas, pregos, estacas e sombra na água
  for (let ty = 0; ty < m.h; ty++)
    for (let tx = 0; tx < m.w; tx++) {
      if (chaoEm(m, tx, ty) !== "pier") continue;
      const ox = tx * TILE;
      const oy = ty * TILE;
      for (let i = 0; i < TILE; i += 4) {
        const v = ruido(tx * 4 + i, ty, 33);
        px(ctx, ox + i, oy, v > 0.5 ? COR.madeira : "#A87449", 4, TILE);
        px(ctx, ox + i + 3, oy, COR.madeiraEsc, 1, TILE);
        px(ctx, ox + i, oy, COR.madeiraClara, 3, 1);
        px(ctx, ox + i + 1, oy + 2, "#5A3B22");
        px(ctx, ox + i + 1, oy + 13, "#5A3B22");
        if (v > 0.7) px(ctx, ox + i + 1, oy + 6, "#946338", 1, 3);
      }
      if (chaoEm(m, tx, ty + 1) === "agua") {
        px(ctx, ox, oy + TILE - 2, "#5A3B22", TILE, 2);
        ctx.fillStyle = "rgba(10,30,60,0.35)";
        ctx.fillRect(ox, oy + TILE, TILE, 4);
        px(ctx, ox + 1, oy + TILE, "#4E331C", 3, 5);
        px(ctx, ox + 12, oy + TILE, "#4E331C", 3, 5);
        px(ctx, ox + 1, oy + TILE, "#6E4A2A", 1, 5);
        px(ctx, ox + 12, oy + TILE, "#6E4A2A", 1, 5);
      }
      if (chaoEm(m, tx, ty - 1) === "agua") px(ctx, ox, oy, "#5A3B22", TILE, 1);
      if (chaoEm(m, tx + 1, ty) === "agua") px(ctx, ox + TILE - 1, oy, "#5A3B22", 1, TILE);
    }

  // flores e conchinhas (dá pra pisar)
  const FLORES = ["#F6A6C1", "#F2C46D", "#FFFFFF", "#B7A9F0", "#F58A7F"];
  for (const d of decoracoes) {
    const ox = d.x * TILE;
    const oy = d.y * TILE;
    if (d.tipo === "flor") {
      for (let k = 0; k < 4; k++) {
        const x = ox + 2 + Math.floor(ruido(d.x, d.y, 80 + k) * 11);
        const y = oy + 3 + Math.floor(ruido(d.x, d.y, 90 + k) * 10);
        const cor = FLORES[(d.variante + k) % FLORES.length];
        px(ctx, x, y + 2, "#2F6B33", 1, 3);
        px(ctx, x + 1, y + 3, "#3E8540", 2, 1);
        px(ctx, x - 1, y, escurecer(cor, 0.25));
        px(ctx, x + 1, y, escurecer(cor, 0.25));
        px(ctx, x, y - 1, cor);
        px(ctx, x, y + 1, escurecer(cor, 0.35));
        px(ctx, x, y, "#F7D154");
      }
    }
    if (d.tipo === "concha") {
      const x = ox + 5 + Math.floor(ruido(d.x, d.y, 3) * 6);
      const y = oy + 7;
      const cor = d.variante ? "#F6C4D3" : "#FFF3E0";
      px(ctx, x - 1, y + 2, "rgba(120,90,50,0.35)", 6, 1);
      px(ctx, x, y, cor, 4, 2);
      px(ctx, x + 1, y - 1, clarear(cor, 0.4), 2, 1);
      px(ctx, x + 1, y + 1, "#C98F86");
      px(ctx, x + 3, y + 1, "#C98F86");
      px(ctx, x - 1, y + 1, escurecer(cor, 0.3));
    }
  }
}

// ───────────────────────── sprites ─────────────────────────

const cacheSprite = new Map<string, HTMLCanvasElement>();
/** desenha uma vez, contorna e guarda; a imagem tem 1px de margem em volta */
function spriteContornado(chave: string, w: number, h: number, desenhar: (ctx: Ctx) => void, sombra?: (ctx: Ctx) => void, forca = 0.62) {
  let s = cacheSprite.get(chave);
  if (!s) {
    const { c, ctx } = novoCanvas(w + 2, h + 2, true);
    ctx.translate(1, 1);
    desenhar(ctx);
    contornar(c, forca);
    if (sombra) {
      ctx.globalCompositeOperation = "destination-over";
      sombra(ctx);
      ctx.globalCompositeOperation = "source-over";
    }
    cacheSprite.set(chave, c);
    s = c;
  }
  return s;
}

/** copa de árvore feita de "tufos" com luz e pontilhado */
function copa(ctx: Ctx, tufos: [number, number, number][], cores: string[]) {
  const R = cores.map(rgb);
  let minX = 99, minY = 99, maxX = -99, maxY = -99;
  for (const [x, y, r] of tufos) {
    minX = Math.min(minX, x - r); minY = Math.min(minY, y - r); maxX = Math.max(maxX, x + r); maxY = Math.max(maxY, y + r);
  }
  for (let y = Math.floor(minY); y <= maxY; y++)
    for (let x = Math.floor(minX); x <= maxX; x++) {
      let melhor = -1;
      let qual = -1;
      tufos.forEach(([tx, ty, r], k) => {
        const d = ((x + 0.5 - tx) ** 2 + (y + 0.5 - ty) ** 2) / (r * r);
        if (d <= 1 && 1 - d + k * 0.001 > melhor) {
          melhor = 1 - d;
          qual = k;
        }
      });
      if (qual < 0) continue;
      const [tx, ty, r] = tufos[qual];
      const dx = (x + 0.5 - tx) / r;
      const dy = (y + 0.5 - ty) / r;
      const altura = (y - minY) / (maxY - minY);
      const luz = melhor * 0.45 + (-dx * 0.4 - dy * 0.6 + 1) * 0.32 - altura * 0.25 + 0.12;
      const c = tom(R, Math.max(0, Math.min(0.999, luz)), x, y, 0.85);
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.fillRect(x, y, 1, 1);
    }
}

const FOLHAS = ["#24552B", "#2F6B33", "#3E8540", "#4E9C4A", "#63B257", "#7CC66A", "#9AD97F"];
const PINHO = ["#1A4430", "#22583A", "#2C6B43", "#3E8E5A", "#5DB176", "#7BC88E"];

/** sprites de decoração: imagem + deslocamento a partir do canto do quadrinho */
export function spriteDecoracao(d: Decoracao): { img: HTMLCanvasElement; dx: number; dy: number } | null {
  if (d.tipo === "arvore") {
    const img = spriteContornado(
      `arvore${d.variante}`,
      34,
      42,
      (ctx) => {
        // tronco com casca e raízes
        for (let y = 26; y < 41; y++) {
          const larg = y > 37 ? 4 + (y - 37) : 3;
          for (let x = 17 - larg; x <= 16 + larg; x++) {
            const v = (x - (17 - larg)) / (larg * 2);
            const c = v < 0.3 ? "#8A6038" : v < 0.7 ? "#6E4A2A" : "#4E331C";
            px(ctx, x, y, ruido(x, y, 5) > 0.82 ? "#4E331C" : c);
          }
        }
        const tufos: [number, number, number][] = [
          [17, 17, 12], [8, 21, 8], [26, 21, 8], [11, 10, 8], [23, 10, 8], [17, 6, 7], [17, 25, 8],
        ];
        copa(ctx, tufos, FOLHAS);
        // detalhes: folhas soltas e frutos/flores
        for (let k = 0; k < 14; k++) {
          const x = 5 + Math.floor(ruido(k, d.variante, 7) * 24);
          const y = 3 + Math.floor(ruido(k, d.variante, 8) * 24);
          px(ctx, x, y, k % 2 ? "#9AD97F" : "#2F6B33");
        }
        if (d.variante === 2)
          for (const [x, y] of [[8, 18], [21, 9], [26, 20], [14, 24], [12, 8], [19, 17]]) {
            px(ctx, x, y, "#C7372F", 2, 2);
            px(ctx, x, y, "#F58A7F");
          }
        if (d.variante === 1)
          for (const [x, y] of [[7, 14], [22, 6], [17, 21], [27, 15], [12, 5]]) {
            px(ctx, x, y, "#FFFFFF");
            px(ctx, x + 1, y, "#FFE3EE");
            px(ctx, x, y + 1, "#FFE3EE");
          }
      },
      (ctx) => elipse(ctx, 18, 40, 13, 3, "rgba(15,35,15,0.30)")
    );
    return { img, dx: -10, dy: -27 };
  }
  if (d.tipo === "pinheiro") {
    const img = spriteContornado(
      `pinheiro${d.variante}`,
      26,
      44,
      (ctx) => {
        px(ctx, 11, 36, "#6E4A2A", 4, 7);
        px(ctx, 11, 36, "#8A6038", 1, 7);
        px(ctx, 14, 36, "#4E331C", 1, 7);
        const R = PINHO.map(rgb);
        const camadas = [
          [0, 14, 7],
          [8, 15, 10],
          [17, 16, 13],
          [26, 13, 13],
        ];
        for (const [topo, alt, base] of camadas)
          for (let y = 0; y < alt; y++) {
            const larg = Math.round(((y + 2) / alt) * base);
            for (let x = -larg; x <= larg; x++) {
              const borda = y === alt - 1 || (y > alt - 3 && Math.abs(x) % 3 === 0);
              const luz = 0.62 - x / (base * 2.2) - y / (alt * 3.5) + (borda ? -0.3 : 0) + (ruido(x, y + topo, 4) - 0.5) * 0.2;
              const c = tom(R, Math.max(0, Math.min(0.999, luz)), x, y, 0.8);
              ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
              ctx.fillRect(13 + x, topo + y + 1, 1, 1);
            }
          }
        if (d.variante === 1) for (const [x, y] of [[9, 12], [16, 20], [11, 30], [17, 33]]) px(ctx, x, y, "#E8F5FF");
      },
      (ctx) => elipse(ctx, 13, 42, 10, 2.5, "rgba(15,35,15,0.30)")
    );
    return { img, dx: -6, dy: -29 };
  }
  if (d.tipo === "arbusto") {
    const img = spriteContornado(
      `arbusto${d.variante}`,
      18,
      15,
      (ctx) => {
        copa(ctx, [[9, 8, 7], [4, 9, 4.5], [14, 9, 4.5], [9, 4, 4.5]], FOLHAS);
        const fruto = d.variante ? ["#4B3BA8", "#8D7CF0"] : ["#B8302A", "#F2776B"];
        for (const [x, y] of [[4, 8], [10, 5], [13, 10], [7, 11], [12, 7]]) {
          px(ctx, x, y, fruto[0], 2, 2);
          px(ctx, x, y, fruto[1]);
        }
      },
      (ctx) => elipse(ctx, 9, 14, 8, 2, "rgba(15,35,15,0.28)")
    );
    return { img, dx: -2, dy: 1 };
  }
  if (d.tipo === "pedra") {
    const img = spriteContornado(
      `pedra${d.variante}`,
      16,
      13,
      (ctx) => {
        bola(ctx, 8, 7, d.variante ? 6 : 7, d.variante ? 5.5 : 4.5, ["#5F656C", "#7B8188", "#9AA0A6", "#B7BCC1", "#D3D7DA"]);
        if (d.variante) {
          px(ctx, 4, 4, "#5FA84C", 4, 1);
          px(ctx, 5, 3, "#77C25F", 2, 1);
        }
        px(ctx, 9, 8, "#5F656C", 2, 1);
      },
      (ctx) => elipse(ctx, 8, 12, 7, 1.8, "rgba(60,40,10,0.28)")
    );
    return { img, dx: -1, dy: 2 };
  }
  if (d.tipo === "placa") {
    const img = spriteContornado(
      "placa",
      16,
      18,
      (ctx) => {
        px(ctx, 7, 9, "#6E4A2A", 2, 9);
        px(ctx, 7, 9, "#8A6038", 1, 9);
        px(ctx, 1, 2, "#8B5E3C", 14, 9);
        px(ctx, 1, 2, "#C9976A", 14, 1);
        for (let y = 3; y < 11; y++) for (let x = 1; x < 15; x++) if (ruido(x, y, 61) > 0.8) px(ctx, x, y, "#7A5230");
        px(ctx, 3, 5, "#4E331C", 9, 1);
        px(ctx, 3, 7, "#4E331C", 7, 1);
        px(ctx, 3, 9, "#4E331C", 8, 1);
      },
      (ctx) => elipse(ctx, 8, 17, 5, 1.5, "rgba(15,35,15,0.3)")
    );
    return { img, dx: -1, dy: -3 };
  }
  if (d.tipo === "lampiao") {
    const img = spriteContornado(
      "lampiao",
      10,
      28,
      (ctx) => {
        px(ctx, 4, 9, "#2E3238", 2, 17);
        px(ctx, 4, 9, "#4A4F57", 1, 17);
        px(ctx, 2, 24, "#2E3238", 6, 3);
        px(ctx, 1, 2, "#2E3238", 8, 8);
        px(ctx, 2, 3, "#F2C46D", 6, 6);
        px(ctx, 2, 3, "#FFE6A3", 3, 3);
        px(ctx, 3, 4, "#FFFFFF", 1, 1);
        px(ctx, 0, 1, "#22252A", 10, 1);
        px(ctx, 3, 0, "#22252A", 4, 1);
      },
      (ctx) => elipse(ctx, 5, 26, 4, 1.4, "rgba(15,35,15,0.3)")
    );
    return { img, dx: 2, dy: -13 };
  }
  return null;
}

/** fonte da praça (2×2) com a água mexendo */
export function desenharFonte(ctx: Ctx, x: number, y: number, t: number) {
  const s = spriteContornado("fonte", 32, 30, (c) => {
    bola(c, 16, 18, 15, 10, ["#8F8676", "#A79E8C", "#BDB5A3", "#D3CCBD", "#E8E3D8"], 0.7);
    bola(c, 16, 17, 12, 7, ["#1B568F", "#22659F", "#2C76B4", "#3A8BC8"], 0.3);
    px(c, 14, 4, "#BDB5A3", 4, 13);
    px(c, 14, 4, "#E4DED2", 1, 13);
    px(c, 17, 4, "#8F8676", 1, 13);
    bola(c, 16, 5, 4, 2, ["#A79E8C", "#CEC7B7", "#E8E3D8"]);
  });
  elipse(ctx, x + 16, y + 29, 15, 3, "rgba(15,35,15,0.25)");
  ctx.drawImage(s, x - 1, y - 1);
  for (let k = 0; k < 5; k++) {
    const a = t * 1.4 + k * 1.25;
    px(ctx, x + 16 + Math.cos(a) * 8, y + 17 + Math.sin(a) * 4.5, "#8CCFF1", 2, 1);
  }
  const sobe = (t * 2.6) % 1;
  for (let k = 0; k < 4; k++) {
    const f = (sobe + k / 4) % 1;
    const dx = (k - 1.5) * 3.5 * f;
    const dy = -7 * Math.sin(f * Math.PI);
    px(ctx, x + 16 + dx, y + 3 + dy + f * 10, k % 2 ? "#FFFFFF" : "#BFE6F8", 1, 2);
  }
}

// ───────────────────────── construções ─────────────────────────

/** desenha a construção numa imagem; o canto de cima fica 1 quadrinho acima do bloco (telhado) */
export function spriteConstrucao(c: Construcao, noite: boolean): HTMLCanvasElement | null {
  // Etapa 324 — com contorno escuro (1px de margem: desenhar em -1,-1)
  if (c.estilo === "nenhum") return null;
  const chave = `${c.id}:${noite ? 1 : 0}`;
  const pronto = cacheSprite.get(chave);
  if (pronto) return pronto;
  const img = desenharConstrucao(c, noite);
  texturizar(img);
  const ctx = img.getContext("2d")!;
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "rgba(15,35,15,0.28)";
  const W = c.w * TILE;
  const H = (c.h + 1) * TILE;
  ctx.beginPath();
  ctx.ellipse(W / 2 + 3, H - 1, W / 2 + 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  cacheSprite.set(chave, img);
  return img;
}

/** dá um ar "pintado": luz de cima, sombra embaixo e grão leve */
function texturizar(c: HTMLCanvasElement) {
  const ctx = c.getContext("2d")!;
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (d[i + 3] < 200) continue;
      const f = 1.06 - (y / c.height) * 0.14 - (x / c.width) * 0.05 + (ruido(x, y, 77) - 0.5) * 0.07;
      d[i] = Math.min(255, d[i] * f);
      d[i + 1] = Math.min(255, d[i + 1] * f);
      d[i + 2] = Math.min(255, d[i + 2] * f);
    }
  ctx.putImageData(img, 0, 0);
}

function desenharConstrucao(c: Construcao, noite: boolean): HTMLCanvasElement {
  return spriteContornado(`_${c.id}:${noite ? 1 : 0}`, c.w * TILE, (c.h + 1) * TILE, (ctx) => {
    const W = c.w * TILE;
    const H = (c.h + 1) * TILE;
    const portaX = (c.porta.x - c.x) * TILE;
    const vidro = noite ? "#FFD873" : "#8EC5F5";
    const vidroClaro = noite ? "#FFF1C4" : "#D6ECFF";
    const janela = (x: number, y: number, w = 10, h = 9) => {
      px(ctx, x - 1, y - 1, "#FFFFFF", w + 2, h + 2);
      px(ctx, x, y, vidro, w, h);
      px(ctx, x + 1, y + 1, vidroClaro, 2, 2);
      px(ctx, x + Math.floor(w / 2), y, "#FFFFFF", 1, h);
      px(ctx, x, y + Math.floor(h / 2), "#FFFFFF", w, 1);
      px(ctx, x - 2, y + h + 1, COR.madeiraEsc, w + 4, 2);
    };
    const porta = (x: number, y: number, cor = "#8B5A2B") => {
      px(ctx, x, y, "#5A3B22", 12, H - y);
      px(ctx, x + 1, y + 1, cor, 10, H - y - 1);
      px(ctx, x + 1, y + 1, "#A9733F", 10, 1);
      px(ctx, x + 5, y + 2, "#5A3B22", 1, H - y - 3);
      px(ctx, x + 8, y + Math.floor((H - y) / 2), "#F2C46D");
    };

    if (c.estilo === "casa") {
      const telhado = Math.round(H * 0.5);
      // paredes de madeira clara com vigas
      px(ctx, 2, telhado - 2, "#F3E3C3", W - 4, H - telhado + 2);
      for (let y = telhado; y < H; y += 5) px(ctx, 2, y, "#E6D2AC", W - 4, 1);
      for (const x of [2, W / 2 - 1, W - 5]) px(ctx, x, telhado - 2, "#8B5E3C", 3, H - telhado + 2);
      px(ctx, 2, H - 3, "#8B5E3C", W - 4, 3);
      // telhado de telha
      for (let y = 0; y < telhado; y++) {
        const recuo = Math.max(0, 10 - y);
        const cor = y % 4 === 3 ? "#B54B28" : y < 3 ? "#EE8456" : "#D9643A";
        px(ctx, recuo, y + 2, cor, W - recuo * 2, 1);
        if (y % 4 === 1) for (let x = recuo + ((y / 4) % 2 ? 3 : 0); x < W - recuo; x += 6) px(ctx, x, y + 2, "#C2552F", 1, 3);
      }
      px(ctx, 0, telhado, "#9C3F22", W, 2);
      // chaminé
      px(ctx, W - 22, 0, "#8E8E8E", 7, 10);
      px(ctx, W - 23, 0, "#6E6E6E", 9, 2);
      // janelas, floreiras e porta
      janela(10, telhado + 6);
      janela(W - 22, telhado + 6);
      for (const x of [9, W - 23]) {
        px(ctx, x, telhado + 18, "#8B5E3C", 12, 3);
        for (let k = 0; k < 4; k++) px(ctx, x + 1 + k * 3, telhado + 17, ["#F6A6C1", "#F2C46D", "#E2554A", "#B7A9F0"][k], 2, 2);
      }
      porta(portaX + 2, telhado + 6);
      px(ctx, portaX, H - 2, "#BDB5A3", 16, 2);
    }

    if (c.estilo === "loja") {
      const topo = 10;
      px(ctx, 2, topo, "#EADFCB", W - 4, H - topo);
      px(ctx, 0, topo - 6, "#4E9C9A", W, 7);
      px(ctx, 0, topo - 6, "#6FBDBA", W, 2);
      // placa com moedinha
      px(ctx, W / 2 - 14, 0, COR.madeiraEsc, 28, 9);
      px(ctx, W / 2 - 13, 1, COR.madeiraClara, 26, 7);
      elipse3(ctx, W / 2, 4.5, 3, 3, "#F2C46D", "#FFE6A3", "#C98E2C");
      // toldo listrado com recorte
      const toldoY = topo + 10;
      for (let x = 0; x < W; x++) {
        const cor = Math.floor(x / 6) % 2 ? "#FFFFFF" : "#E05A47";
        px(ctx, x, toldoY, cor, 1, 8);
        if (x % 6 < 4) px(ctx, x, toldoY + 8, cor, 1, 2);
      }
      px(ctx, 0, toldoY + 10, "rgba(0,0,0,0.12)", W, 2);
      // vitrine com produtos
      px(ctx, 6, toldoY + 14, "#FFFFFF", W - 32, 18);
      px(ctx, 7, toldoY + 15, vidro, W - 34, 16);
      for (let k = 0; k < 5; k++) elipse3(ctx, 12 + k * 10, toldoY + 26, 3, 3, ["#F2C46D", "#F6A6C1", "#8FD3A6", "#B7A9F0", "#8EC5F5"][k]);
      porta(portaX + 2, toldoY + 14, "#3D7DCA");
      px(ctx, 2, H - 3, "#B8A98F", W - 4, 3);
    }

    if (c.estilo === "templo") {
      const topo = 18;
      // frontão com troféu
      for (let y = 0; y < topo; y++) {
        const larg = Math.round((y / topo) * (W / 2));
        px(ctx, W / 2 - larg, y + 2, y < 2 ? "#E8C26A" : "#8C9BB0", larg * 2, 1);
      }
      px(ctx, 0, topo + 1, "#F2C46D", W, 3);
      px(ctx, W / 2 - 4, 9, "#F2C46D", 8, 5);
      px(ctx, W / 2 - 1, 14, "#C98E2C", 2, 3);
      px(ctx, W / 2 - 3, 17, "#C98E2C", 6, 1);
      px(ctx, W / 2 - 6, 10, "#F2C46D", 2, 3);
      px(ctx, W / 2 + 4, 10, "#F2C46D", 2, 3);
      // paredes e colunas
      px(ctx, 4, topo + 4, "#D8D2C4", W - 8, H - topo - 4);
      for (let k = 0; k < 5; k++) {
        const x = 8 + Math.round(k * ((W - 22) / 4));
        px(ctx, x, topo + 4, "#F4F1EA", 6, H - topo - 12);
        px(ctx, x + 4, topo + 4, "#CFC8B8", 2, H - topo - 12);
        px(ctx, x - 1, topo + 4, "#BDB5A3", 8, 2);
      }
      // escadaria
      for (let k = 0; k < 3; k++) px(ctx, k * 3, H - 8 + k * 3, k % 2 ? "#BDB5A3" : "#CFC8B8", W - k * 6, 3);
      px(ctx, portaX + 1, topo + 14, "#5C4A8A", 14, H - topo - 22);
      px(ctx, portaX + 3, topo + 16, "#7B68B8", 10, H - topo - 26);
    }

    if (c.estilo === "horta") {
      const topo = 22;
      px(ctx, 2, topo, "#8A5A3C", W - 4, H - topo - 2);
      for (let y = topo + 4; y < H - 4; y += 8) {
        px(ctx, 4, y, "#6E4530", W - 8, 2);
        for (let x = 8; x < W - 8; x += 9) {
          const k = Math.floor(ruido(x, y, 3) * 4);
          if (k === 0) { px(ctx, x, y - 3, "#5FAF55", 1, 3); px(ctx, x - 1, y - 4, "#8CD07A", 3, 1); }
          if (k === 1) { elipse3(ctx, x, y - 2, 3, 2.5, "#7FB069", "#A8D58F", "#4E8F40"); }
          if (k === 2) { px(ctx, x, y - 4, "#4E8F40", 1, 3); px(ctx, x - 1, y - 1, "#F08A3C", 3, 2); }
          if (k === 3) { px(ctx, x, y - 5, "#4E8F40", 1, 4); elipse3(ctx, x + 1, y - 2, 2, 2, "#E2554A", "#F58A7F"); }
        }
      }
      // cerca com portão aberto
      for (let x = 0; x < W; x += 6) {
        if (x >= portaX && x < portaX + TILE) continue;
        px(ctx, x, topo - 6, "#A0703F", 3, 8);
        px(ctx, x, topo - 7, "#C9976A", 3, 1);
      }
      px(ctx, 0, topo - 3, "#C9976A", portaX, 2);
      px(ctx, portaX + TILE, topo - 3, "#C9976A", W - portaX - TILE, 2);
      for (const lado of [0, W - 3]) for (let y = topo; y < H - 2; y += 6) px(ctx, lado, y, "#A0703F", 3, 5);
      px(ctx, 0, H - 4, "#C9976A", W, 2);
      // espantalho
      px(ctx, W - 16, topo + 2, COR.troncoEsc, 2, 16);
      px(ctx, W - 22, topo + 7, COR.troncoEsc, 14, 2);
      elipse3(ctx, W - 15, topo + 3, 3, 3, "#F2D7A5");
      px(ctx, W - 19, topo - 1, "#D9B26F", 9, 2);
      px(ctx, W - 18, topo + 9, "#3D7DCA", 7, 6);
    }

    if (c.estilo === "barraca") {
      const topo = 4;
      px(ctx, 3, topo + 10, COR.troncoEsc, 2, H - topo - 10);
      px(ctx, W - 5, topo + 10, COR.troncoEsc, 2, H - topo - 10);
      for (let x = 0; x < W; x++) {
        const cor = Math.floor(x / 8) % 2 ? "#F2C46D" : "#8FD3A6";
        px(ctx, x, topo, cor, 1, 10);
        if (x % 8 < 5) px(ctx, x, topo + 10, cor, 1, 3);
      }
      px(ctx, 0, topo, "rgba(255,255,255,0.35)", W, 2);
      // balcão com caixotes de fruta
      const by = H - 20;
      px(ctx, 2, by, COR.madeiraEsc, W - 4, 18);
      px(ctx, 3, by + 1, COR.madeira, W - 6, 16);
      for (let k = 0; k < Math.floor((W - 8) / 14); k++) {
        const x = 5 + k * 14;
        px(ctx, x, by - 6, COR.madeiraClara, 12, 7);
        const cor = ["#E2554A", "#F08A3C", "#F7D154", "#7FB069", "#B7A9F0"][k % 5];
        for (let f = 0; f < 4; f++) elipse3(ctx, x + 2 + f * 3, by - 7, 1.6, 1.6, cor);
      }
      px(ctx, W / 2 - 10, by + 6, "#FFFFFF", 20, 6);
      px(ctx, W / 2 - 8, by + 8, "#E05A47", 16, 2);
    }

    if (c.estilo === "banco") {
      const y = H - 12;
      px(ctx, 4, y, COR.madeiraEsc, W - 8, 3);
      px(ctx, 4, y - 6, COR.madeira, W - 8, 3);
      px(ctx, 4, y + 3, COR.madeira, W - 8, 4);
      px(ctx, 6, y + 7, COR.troncoEsc, 2, 5);
      px(ctx, W - 8, y + 7, COR.troncoEsc, 2, 5);
      // coração
      const cx = W / 2;
      px(ctx, cx - 1, 2, COR.troncoEsc, 2, y - 8);
      for (const [dx, dy, w] of [[-5, 0, 4], [1, 0, 4], [-6, 1, 12], [-6, 2, 12], [-5, 3, 10], [-4, 4, 8], [-3, 5, 6], [-2, 6, 4], [-1, 7, 2]] as const)
        px(ctx, cx + dx, 2 + dy, "#F0718F", w, 1);
      px(ctx, cx - 4, 3, "#FFC1D0", 2, 1);
    }

    if (c.estilo === "quadro") {
      px(ctx, 4, 8, COR.troncoEsc, 2, H - 8);
      px(ctx, W - 6, 8, COR.troncoEsc, 2, H - 8);
      px(ctx, 1, 4, COR.madeiraEsc, W - 2, 18);
      px(ctx, 2, 5, COR.madeira, W - 4, 16);
      const papeis = ["#FFFFFF", "#FFF1C4", "#E2F1FF", "#FFE3EE"];
      for (let k = 0; k < 4; k++) {
        const x = 4 + (k % 2) * 13;
        const y = 7 + Math.floor(k / 2) * 7;
        px(ctx, x, y, papeis[k], 10, 6);
        px(ctx, x + 1, y + 2, "#9A9A94", 7, 1);
        px(ctx, x + 4, y, "#E2554A");
      }
    }
  });
}


function elipse3(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, base: string, clara?: string, esc?: string) {
  if (!clara && !esc) return elipse(ctx, cx, cy, rx, ry, base);
  bola(ctx, cx, cy, rx, ry, [esc ?? escurecer(base, 0.3), base, clara ?? clarear(base, 0.35)]);
}

// ───────────────────────── personagens ─────────────────────────

export type Direcao = "baixo" | "cima" | "esq" | "dir";

/**
 * Mascote repaginado (Etapa 324): 22×22, corpo redondo com 5 tons e brilho,
 * barriga, olhões com reflexo, bochechas, bracinhos que balançam, pezinhos,
 * broto de duas folhas e contorno. 4 direções × 4 quadros + piscar.
 */
function spriteMascote(cores: { corpo: string; sombra: string; barriga: string }, dir: Direcao, quadro: number, piscando: boolean, dormindo: boolean) {
  const chave = `m:${cores.corpo}:${cores.sombra}:${dir}:${quadro}:${piscando ? 1 : 0}:${dormindo ? 1 : 0}`;
  return spriteContornado(
    chave,
    22,
    22,
    (ctx) => {
      const andando = quadro > 0;
      const bob = quadro === 1 || quadro === 3 ? -1 : 0;
      const corpo = [escurecer(cores.sombra, 0.45), escurecer(cores.sombra, 0.15), cores.sombra, misturar(cores.sombra, cores.corpo, 0.6), cores.corpo, clarear(cores.corpo, 0.3)];
      const cy = 13 + bob;
      // pés (alternando ao andar)
      const peE = andando && quadro === 1 ? -1 : 0;
      const peD = andando && quadro === 3 ? -1 : 0;
      if (dir === "esq" || dir === "dir") {
        const f = dir === "dir" ? 1 : -1;
        bola(ctx, 11 - 3 * f + (quadro === 1 ? 2 * f : quadro === 3 ? -1 * f : 0), 19 + peE, 3, 1.8, [escurecer(cores.sombra, 0.3), cores.sombra]);
        bola(ctx, 11 + 2 * f + (quadro === 3 ? 2 * f : quadro === 1 ? -1 * f : 0), 19 + peD, 3, 1.8, [escurecer(cores.sombra, 0.2), cores.sombra, misturar(cores.sombra, cores.corpo, 0.5)]);
      } else {
        bola(ctx, 8, 19 + peE, 2.6, 1.6, [escurecer(cores.sombra, 0.2), cores.sombra, misturar(cores.sombra, cores.corpo, 0.4)]);
        bola(ctx, 14, 19 + peD, 2.6, 1.6, [escurecer(cores.sombra, 0.2), cores.sombra, misturar(cores.sombra, cores.corpo, 0.4)]);
      }
      // bracinhos atrás do corpo quando de costas
      const balanco = andando ? (quadro === 1 ? -1 : quadro === 3 ? 1 : 0) : 0;
      const braco = (x: number, y: number) => bola(ctx, x, y, 2, 2.4, [cores.sombra, misturar(cores.sombra, cores.corpo, 0.5), cores.corpo]);
      if (dir === "cima") {
        braco(4, cy + 2 + balanco);
        braco(18, cy + 2 - balanco);
      }
      // corpo
      bola(ctx, 11, cy, 7.2, 6.3, corpo, 0.42);
      // barriga
      if (dir !== "cima") {
        const bx = dir === "esq" ? 8.5 : dir === "dir" ? 13.5 : 11;
        bola(ctx, bx, cy + 3, dir === "baixo" ? 3.6 : 2.8, 2.4, [misturar(cores.barriga, cores.sombra, 0.35), cores.barriga, clarear(cores.barriga, 0.5)], 0.4);
      }
      // brilho do corpo
      px(ctx, 7, cy - 4, clarear(cores.corpo, 0.7), 3, 1);
      px(ctx, 6, cy - 3, clarear(cores.corpo, 0.55), 2, 1);
      // bracinhos na frente
      if (dir === "baixo") {
        braco(4, cy + 2 + balanco);
        braco(18, cy + 2 - balanco);
      } else if (dir === "esq") braco(13 + balanco, cy + 3);
      else if (dir === "dir") braco(9 - balanco, cy + 3);
      // broto: caule e duas folhas
      const topo = cy - 6;
      px(ctx, 11, topo - 2, "#3E8540", 1, 3);
      bola(ctx, 8.5, topo - 3, 2.8, 1.6, ["#2F6B33", "#4E9C4A", "#7CC66A", "#9AD97F"]);
      bola(ctx, 13.5, topo - 4, 2.8, 1.6, ["#2F6B33", "#4E9C4A", "#7CC66A", "#9AD97F"]);
      px(ctx, 8, topo - 3, "#2F6B33", 2, 1);
      px(ctx, 13, topo - 4, "#2F6B33", 2, 1);
      if (dir === "cima") return;
      // rosto
      const olhos = dir === "esq" ? [6, 10] : dir === "dir" ? [12, 16] : [8, 14];
      const oy = cy - 2;
      for (const ox of olhos) {
        if (piscando || dormindo) {
          px(ctx, ox - 1, oy + 1, "#1C1C22", 3, 1);
          continue;
        }
        px(ctx, ox - 1, oy - 1, "#1C1C22", 3, 4);
        px(ctx, ox - 1, oy - 1, "#FFFFFF", 1, 2);
        px(ctx, ox + 1, oy + 2, "#3A3550");
      }
      const meio = (olhos[0] + olhos[1]) / 2;
      // bochechas
      px(ctx, olhos[0] - 2, oy + 3, "#F48FB1", 2, 1);
      px(ctx, olhos[1] + 1, oy + 3, "#F48FB1", 2, 1);
      // boquinha sorrindo
      px(ctx, meio - 1, oy + 4, "#5A2E3A", 3, 1);
      px(ctx, meio - 2, oy + 3, "#5A2E3A", 1, 1);
      px(ctx, meio + 2, oy + 3, "#5A2E3A", 1, 1);
    },
    undefined,
    0.9
  );
}

export function desenharMascote(
  ctx: Ctx,
  x: number,
  y: number,
  cores: { corpo: string; sombra: string; barriga: string },
  dir: Direcao,
  passo: number,
  andando: boolean,
  dormindo = false
) {
  const agora = typeof performance !== "undefined" ? performance.now() : 0;
  const piscando = !andando && agora % 3400 < 140;
  const respira = !andando && agora % 1600 < 800 ? 0 : 0;
  const quadro = andando ? (passo % 4) : 0;
  elipse(ctx, x + 8, y + 15, 7, 2, "rgba(15,35,15,0.30)");
  ctx.drawImage(spriteMascote(cores, dir, quadro, piscando, dormindo), x - 4, y - 7 + respira);
}

/** pessoa da ilha 16×24 com sombreado e contorno */
function spriteNpc(n: Npc, dir: Direcao, resp: number) {
  return spriteContornado(`npc:${n.id}:${dir}:${resp}`, 18, 26, (ctx) => {
    const roupa = [escurecer(n.roupa, 0.35), escurecer(n.roupa, 0.15), n.roupa, clarear(n.roupa, 0.25)];
    const pele = [escurecer(n.pele, 0.25), n.pele, clarear(n.pele, 0.2)];
    const cabelo = [escurecer(n.cabelo, 0.3), n.cabelo, clarear(n.cabelo, 0.3)];
    // pernas e sapatos
    px(ctx, 5, 18, "#3B3F46", 3, 6);
    px(ctx, 10, 18, "#3B3F46", 3, 6);
    px(ctx, 5, 18, "#4A4F57", 1, 6);
    px(ctx, 10, 18, "#4A4F57", 1, 6);
    px(ctx, 4, 23, "#2A1B12", 4, 2);
    px(ctx, 10, 23, "#2A1B12", 4, 2);
    // tronco com dobra de luz
    for (let y = 10 + resp; y < 19; y++)
      for (let x = 4; x < 14; x++) {
        const v = 0.75 - (y - 10) / 16 - (x - 4) / 22;
        const c = roupa[Math.max(0, Math.min(3, Math.floor(v * 4 + pontilhado(x, y) * 0.8)))];
        px(ctx, x, y, c);
      }
    px(ctx, 4, 17, escurecer(n.roupa, 0.45), 10, 1);
    // braços
    for (const bx of [2, 14]) {
      px(ctx, bx, 11 + resp, roupa[1], 2, 5);
      px(ctx, bx, 11 + resp, roupa[2], 1, 4);
      px(ctx, bx, 16 + resp, pele[1], 2, 2);
    }
    // cabeça
    const hy = 2 + resp;
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 10; x++) {
        if ((y === 0 || y === 7) && (x === 0 || x === 9)) continue;
        const v = 0.7 - y / 14 - x / 18;
        px(ctx, 4 + x, hy + y, pele[Math.max(0, Math.min(2, Math.floor(v * 3 + pontilhado(x, y) * 0.6)))]);
      }
    // cabelo
    px(ctx, 4, hy - 1, cabelo[1], 10, 3);
    px(ctx, 5, hy - 2, cabelo[1], 8, 1);
    px(ctx, 6, hy - 2, cabelo[2], 4, 1);
    px(ctx, 3, hy, cabelo[0], 1, 5);
    px(ctx, 14, hy, cabelo[0], 1, 5);
    if (dir === "cima") px(ctx, 4, hy, cabelo[1], 10, 7);
    else {
      const ox = dir === "esq" ? -1 : dir === "dir" ? 1 : 0;
      px(ctx, 6 + ox, hy + 3, "#1C1C22", 2, 2);
      px(ctx, 10 + ox, hy + 3, "#1C1C22", 2, 2);
      px(ctx, 6 + ox, hy + 3, "#FFFFFF");
      px(ctx, 10 + ox, hy + 3, "#FFFFFF");
      px(ctx, 8 + ox, hy + 6, "#B35D4A", 2, 1);
      px(ctx, 5 + ox, hy + 5, escurecer(n.pele, 0.1), 1, 1);
    }
    if (n.chapeu) {
      const ch = [escurecer(n.chapeu, 0.3), n.chapeu, clarear(n.chapeu, 0.3)];
      px(ctx, 1, hy, ch[1], 16, 2);
      px(ctx, 1, hy + 1, ch[0], 16, 1);
      px(ctx, 4, hy - 4, ch[1], 10, 4);
      px(ctx, 5, hy - 4, ch[2], 4, 1);
      px(ctx, 4, hy - 1, "#B5512E", 10, 1);
    }
  });
}

export function desenharNpc(ctx: Ctx, n: Npc, x: number, y: number, t: number, dir: Direcao) {
  const resp = Math.sin(t * 2.4 + n.x) > 0.6 ? 1 : 0;
  elipse(ctx, x + 8, y + 24, 6, 1.8, "rgba(15,35,15,0.30)");
  ctx.drawImage(spriteNpc(n, dir, resp), x - 2, y - 1);
}
