"use client";

// Etapa 323 — a ilha em RPG: o mascote anda pelo mapa (joystick, setas
// ou tocando onde quer ir), entra nos lugares e conversa com as pessoas
// da ilha. Desenho em pixel art feito por código num <canvas>.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  alvoDoToque,
  caminho,
  ehSolido,
  gerarIlha,
  interacaoPerto,
  pontoDoAlvo,
  TILE,
  type Construcao,
  type Interacao,
  type LugarIlha,
  type Npc,
} from "@/lib/mascote/rpg/ilhaRpg";
import { desenharChao, desenharFonte, desenharMascote, desenharNpc, spriteConstrucao, spriteDecoracao, type Direcao } from "@/lib/mascote/rpg/pixelArte";
import { guardarSom, pararMusica, somLigado, tocar, tocarMusica } from "@/lib/mascote/rpg/som";
import { semente } from "@/lib/mascote/rpg/ilhaRpg";
import { carregarPacote, desenharBau, desenharBichoSolto, desenharNpcPacote, moverBicho, type BichoSolto, montarChao, ROSTO_NPC, spriteConstrucaoPacote, spriteDecoracaoPacote, type Pacote } from "@/lib/mascote/rpg/pacote";
import { vibrar } from "@/lib/app/vibrar";

export type FalaNpc = { falas: string[]; opcoes?: { rotulo: string; href: string }[] };
export type PeriodoIlha = "manha" | "tarde" | "entardecer" | "noite";

type Dialogo = { nome: string; falas: string[]; i: number; opcoes?: { rotulo: string; href: string }[]; rosto?: string };

const VELOCIDADE = 3.6; // quadrinhos por segundo

const TINTA: Record<PeriodoIlha, string | null> = {
  manha: "rgba(255,190,120,0.10)",
  tarde: null,
  entardecer: "rgba(255,110,60,0.20)",
  noite: "rgba(12,22,64,0.45)",
};

export function JogoIlha({
  cores,
  nomeMascote,
  periodo,
  falas,
  selos,
  inicio,
  aoEntrar,
  aoNavegar,
  bauAberto = false,
  aoBau,
}: {
  cores: { corpo: string; sombra: string; barriga: string };
  nomeMascote: string;
  periodo: PeriodoIlha;
  falas: Partial<Record<Npc["id"], FalaNpc>>;
  selos?: Partial<Record<LugarIlha, string>>;
  inicio?: { x: number; y: number } | null;
  aoEntrar: (lugar: LugarIlha, porta: { x: number; y: number }) => void;
  aoNavegar: (href: string) => void;
  /** Etapa 326 — baú do dia */
  bauAberto?: boolean;
  aoBau?: () => Promise<{ falas: string[]; moedas: number }>;
}) {
  const mapa = useMemo(() => gerarIlha(), []);
  const caixa = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const [perto, setPerto] = useState<Interacao | null>(null);
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [digitado, setDigitado] = useState(0);
  const [dica, setDica] = useState(true);
  // Etapa 325 — arte do pacote "Ninja Adventure" (CC0); se não carregar, usa a desenhada por código
  const [pacote, setPacote] = useState<Pacote | null | "falhou">(null);
  useEffect(() => {
    let vivo = true;
    carregarPacote()
      .then((p) => vivo && setPacote(p))
      .catch(() => vivo && setPacote("falhou"));
    return () => {
      vivo = false;
    };
  }, []);

  // estado do jogo fora do React (muda 60x por segundo)
  const jogo = useRef({
    x: (inicio?.x ?? mapa.inicio.x) + 0.5,
    y: (inicio?.y ?? mapa.inicio.y) + 0.8,
    dir: "baixo" as Direcao,
    passo: 0,
    tempoPasso: 0,
    andando: false,
    teclas: new Set<string>(),
    stick: { x: 0, y: 0 },
    rota: [] as { x: number; y: number }[],
    alvo: null as Interacao | null,
    perto: null as Interacao | null,
    pausado: false,
    escala: 3,
    cam: { x: 0, y: 0 },
  });

  const props = useRef({ cores, periodo, selos, falas, aoEntrar, aoNavegar, bauAberto, aoBau });
  props.current = { cores, periodo, selos, falas, aoEntrar, aoNavegar, bauAberto, aoBau };
  // som (começa desligado)
  const [som, setSom] = useState(false);
  useEffect(() => {
    setSom(somLigado());
    return () => pararMusica();
  }, []);
  useEffect(() => {
    if (som) tocarMusica(periodo === "noite");
    else pararMusica();
  }, [som, periodo]);
  const dialogoRef = useRef(dialogo);
  dialogoRef.current = dialogo;
  const digitadoRef = useRef(digitado);
  digitadoRef.current = digitado;
  jogo.current.pausado = !!dialogo;

  function interagir(i: Interacao) {
    vibrar(12);
    const g = jogo.current;
    g.rota = [];
    g.alvo = null;
    if (i.tipo === "lugar") {
      tocar("entrar");
      return props.current.aoEntrar(i.construcao.id, i.construcao.porta);
    }
    if (i.tipo === "placa") return abrirDialogo({ nome: "Placa", falas: [i.decoracao.texto ?? "…"], i: 0 });
    if (i.tipo === "bau") {
      const abrir = props.current.aoBau;
      if (!abrir) return;
      void abrir().then((r) => {
        if (r.moedas > 0) {
          tocar("bau");
          setTimeout(() => tocar("moeda"), 350);
          vibrar([20, 40, 20]);
        }
        abrirDialogo({ nome: "Baú", falas: r.falas, i: 0 });
      });
      return;
    }
    tocar("falar");
    const f = props.current.falas[i.npc.id];
    // vira pra pessoa
    const dx = i.npc.x + 0.5 - g.x;
    const dy = i.npc.y + 0.5 - g.y;
    g.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "dir" : "esq") : dy > 0 ? "baixo" : "cima";
    abrirDialogo({ nome: i.npc.nome, falas: f?.falas?.length ? f.falas : ["Que dia bonito na ilha!"], opcoes: f?.opcoes, i: 0, rosto: ROSTO_NPC[i.npc.id] });
  }

  function abrirDialogo(d: Dialogo) {
    setDigitado(0);
    setDialogo(d);
  }

  function avancarDialogo() {
    const d = dialogoRef.current;
    if (!d) return;
    const texto = d.falas[d.i];
    if (digitadoRef.current < texto.length) return setDigitado(texto.length);
    if (d.i < d.falas.length - 1) {
      setDigitado(0);
      return setDialogo({ ...d, i: d.i + 1 });
    }
    if (!d.opcoes?.length) setDialogo(null);
  }

  // máquina de escrever
  useEffect(() => {
    if (!dialogo) return;
    const texto = dialogo.falas[dialogo.i];
    if (digitado >= texto.length) return;
    const t = setTimeout(() => setDigitado((n) => Math.min(texto.length, n + 2)), 22);
    return () => clearTimeout(t);
  }, [dialogo, digitado]);

  // teclado
  useEffect(() => {
    const g = jogo.current;
    const baixo = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
        g.teclas.add(k);
        g.rota = [];
        g.alvo = null;
        setDica(false);
        e.preventDefault();
      }
      if (k === "enter" || k === " " || k === "e") {
        e.preventDefault();
        if (dialogoRef.current) avancarDialogo();
        else if (g.perto) interagir(g.perto);
      }
      if (k === "escape") setDialogo(null);
    };
    const cima = (e: KeyboardEvent) => g.teclas.delete(e.key.toLowerCase());
    window.addEventListener("keydown", baixo);
    window.addEventListener("keyup", cima);
    return () => {
      window.removeEventListener("keydown", baixo);
      window.removeEventListener("keyup", cima);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // laço do jogo
  useEffect(() => {
    if (pacote === null) return; // ainda carregando as imagens
    const pac = pacote === "falhou" ? null : pacote;
    const canvas = tela.current!;
    const ctx = canvas.getContext("2d")!;
    const g = jogo.current;
    const chao = pac ? montarChao(mapa, pac, 4, mapa.decoracoes, mapa.construcoes.find((c) => c.estilo === "horta")) : desenharChao(mapa, 4, mapa.decoracoes);
    const solidos = mapa.decoracoes.filter((d) => d.tipo !== "flor" && d.tipo !== "concha");
    // bichinhos: borboletas de dia, vagalumes à noite
    const bichos = Array.from({ length: 10 }, (_, i) => {
      const flor = mapa.decoracoes.filter((d) => d.tipo === "flor")[i * 3] ?? mapa.inicio;
      return { x: flor.x + 0.5, y: flor.y + 0.5, fase: i * 1.7, cor: ["#FFFFFF", "#F6A6C1", "#F2C46D", "#B7A9F0"][i % 4] };
    });
    // Etapa 326 — bichinhos soltos (cachorro, lagartinho, cogumelo)
    const sorteio = semente(Date.now() % 100000);
    const livreBicho = (x: number, y: number) => !ehSolido(mapa, Math.floor(x), Math.floor(y - 0.2)) && mapa.chao[Math.floor(y - 0.2) * mapa.w + Math.floor(x)] === "grama";
    const soltos: BichoSolto[] = pac
      ? [[14, 15], [30, 16], [17, 27], [12, 17], [33, 26]].map(([x, y], k) => ({
          img: pac.bichos[k % pac.bichos.length],
          x: x + 0.5,
          y: y + 0.8,
          ax: x + 0.5,
          ay: y + 0.8,
          dir: "baixo" as Direcao,
          espera: k,
          passo: 0,
          cachorro: k % pac.bichos.length === 0,
        })).filter((b) => livreBicho(b.x, b.y))
      : [];
    let ultimo = performance.now();
    let raf = 0;
    let largura = 0;
    let altura = 0;
    let dpr = 1;

    const ajustar = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      largura = r.width;
      altura = r.height;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      g.escala = Math.max(2, Math.min(4, Math.floor(r.width / 125)));
    };
    ajustar();
    const obs = new ResizeObserver(ajustar);
    obs.observe(canvas);

    const livre = (x: number, y: number) => {
      const m = 0.28;
      for (const [cx, cy] of [[x - m, y - 0.3], [x + m, y - 0.3], [x - m, y - 0.02], [x + m, y - 0.02]])
        if (ehSolido(mapa, Math.floor(cx), Math.floor(cy))) return false;
      return true;
    };

    const atualizar = (dt: number) => {
      for (const b of soltos) moverBicho(b, livreBicho, dt, sorteio);
      let vx = 0;
      let vy = 0;
      if (!g.pausado) {
        const t = g.teclas;
        if (t.has("arrowleft") || t.has("a")) vx -= 1;
        if (t.has("arrowright") || t.has("d")) vx += 1;
        if (t.has("arrowup") || t.has("w")) vy -= 1;
        if (t.has("arrowdown") || t.has("s")) vy += 1;
        if (Math.hypot(g.stick.x, g.stick.y) > 0.2) {
          vx = g.stick.x;
          vy = g.stick.y;
        }
        // andando por uma rota (tocou num lugar)
        if (vx === 0 && vy === 0 && g.rota.length) {
          const prox = g.rota[0];
          const ax = prox.x + 0.5 - g.x;
          const ay = prox.y + 0.75 - g.y;
          const d = Math.hypot(ax, ay);
          if (d < 0.08) {
            g.rota.shift();
            if (!g.rota.length && g.alvo) {
              const a = g.alvo;
              g.alvo = null;
              interagir(a);
            }
          } else {
            vx = ax / d;
            vy = ay / d;
            if (d < VELOCIDADE * dt) {
              vx *= d / (VELOCIDADE * dt);
              vy *= d / (VELOCIDADE * dt);
            }
          }
        }
      }
      const tam = Math.hypot(vx, vy);
      if (tam > 1) {
        vx /= tam;
        vy /= tam;
      }
      g.andando = tam > 0.05;
      if (g.andando) {
        g.dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? "dir" : "esq") : vy > 0 ? "baixo" : "cima";
        const nx = g.x + vx * VELOCIDADE * dt;
        const ny = g.y + vy * VELOCIDADE * dt;
        if (livre(nx, g.y)) g.x = nx;
        if (livre(g.x, ny)) g.y = ny;
        g.tempoPasso += dt;
        if (g.tempoPasso > 0.14) {
          g.tempoPasso = 0;
          g.passo++;
        }
      }
      const p = interacaoPerto(mapa, g.x, g.y - 0.3);
      const chave = (i: Interacao | null) => (!i ? "" : i.tipo === "lugar" ? i.construcao.id : i.tipo === "npc" ? i.npc.id : `placa${i.decoracao.x}`);
      if (chave(p) !== chave(g.perto)) {
        g.perto = p;
        setPerto(p);
      }
    };

    const desenhar = (t: number) => {
      const S = g.escala * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#3A8BC8";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const vw = largura / g.escala;
      const vh = altura / g.escala;
      const mw = mapa.w * TILE;
      const mh = mapa.h * TILE;
      let cx = g.x * TILE - vw / 2;
      let cy = (g.y - 0.5) * TILE - vh / 2;
      cx = Math.round(Math.max(0, Math.min(mw - vw, cx)));
      cy = Math.round(Math.max(0, Math.min(mh - vh, cy)));
      g.cam = { x: cx, y: cy };
      ctx.setTransform(S, 0, 0, S, -cx * S, -cy * S);
      ctx.drawImage(chao[Math.floor(t / 420) % chao.length], 0, 0);

      // tudo que tem altura, do fundo pra frente
      const vis = (x: number, y: number) => x * TILE > cx - 48 && x * TILE < cx + vw + 48 && y * TILE > cy - 48 && y * TILE < cy + vh + 64;
      const fila: { base: number; d: () => void }[] = [];
      const ehNoite = props.current.periodo === "noite";
      for (const d of solidos) {
        if (!vis(d.x, d.y)) continue;
        if (d.tipo === "fonte" && !pac) {
          fila.push({ base: (d.y + 2) * TILE, d: () => desenharFonte(ctx, d.x * TILE, d.y * TILE, t / 1000) });
          continue;
        }
        if (d.tipo === "bau") {
          if (pac) fila.push({ base: (d.y + 1) * TILE - 1, d: () => desenharBau(ctx, pac, d.x * TILE, d.y * TILE, !!props.current.bauAberto, t) });
          continue;
        }
        const s = pac ? spriteDecoracaoPacote(d, pac) : spriteDecoracao(d);
        const fundo = d.tipo === "fonte" ? 2 : 1;
        if (s) fila.push({ base: (d.y + fundo) * TILE - 1, d: () => ctx.drawImage(s.img, d.x * TILE + s.dx, d.y * TILE + s.dy) });
      }
      for (const c of mapa.construcoes) {
        if (pac) {
          const s = spriteConstrucaoPacote(c, pac);
          if (s) fila.push({ base: (c.y + c.h) * TILE - 1, d: () => ctx.drawImage(s.img, c.x * TILE + s.dx, c.y * TILE + s.dy) });
          continue;
        }
        const img = spriteConstrucao(c, ehNoite);
        if (!img) continue;
        fila.push({ base: (c.y + c.h) * TILE - 1, d: () => ctx.drawImage(img, c.x * TILE - 1, (c.y - 1) * TILE - 1) });
      }
      for (const n of mapa.npcs) {
        if (!vis(n.x, n.y)) continue;
        const dx = g.x - (n.x + 0.5);
        const dy = g.y - (n.y + 0.5);
        const virar: Direcao = Math.hypot(dx, dy) < 3 ? (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "dir" : "esq") : dy > 0 ? "baixo" : "cima") : "baixo";
        fila.push({
          base: (n.y + 1) * TILE - 2,
          d: () => (pac ? desenharNpcPacote(ctx, pac, n, n.x * TILE, n.y * TILE - 3, virar, t / 1000) : desenharNpc(ctx, n, n.x * TILE, n.y * TILE - 10, t / 1000, virar)),
        });
      }
      fila.push({
        base: g.y * TILE,
        d: () => desenharMascote(ctx, Math.round(g.x * TILE - 8), Math.round(g.y * TILE - 15), props.current.cores, g.dir, g.passo, g.andando),
      });
      for (const b of soltos) if (vis(b.x, b.y)) fila.push({ base: b.y * TILE - 1, d: () => desenharBichoSolto(ctx, b) });
      fila.sort((a, b) => a.base - b.base);
      for (const f of fila) f.d();

      // borboletas / vagalumes
      for (const b of bichos) {
        const s = t / 1000 + b.fase;
        const bx = (b.x + Math.sin(s * 0.7) * 1.6 + Math.sin(s * 2.1) * 0.3) * TILE;
        const by = (b.y + Math.cos(s * 0.5) * 1.2) * TILE - 6;
        if (ehNoite) {
          ctx.fillStyle = `rgba(255,240,150,${0.5 + 0.5 * Math.sin(s * 3)})`;
          ctx.fillRect(Math.round(bx), Math.round(by), 1, 1);
        } else {
          const asa = Math.sin(s * 18) > 0 ? 2 : 1;
          ctx.fillStyle = b.cor;
          ctx.fillRect(Math.round(bx - asa), Math.round(by), asa, 2);
          ctx.fillRect(Math.round(bx + 1), Math.round(by), asa, 2);
          ctx.fillStyle = "#3B3F46";
          ctx.fillRect(Math.round(bx), Math.round(by), 1, 2);
        }
      }

      // luz do dia e da noite
      const tinta = TINTA[props.current.periodo];
      if (tinta) {
        ctx.fillStyle = tinta;
        ctx.fillRect(cx, cy, vw, vh);
      }
      if (ehNoite || props.current.periodo === "entardecer") {
        ctx.globalCompositeOperation = "lighter";
        const luz = (x: number, y: number, r: number, a: number) => {
          const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
          gr.addColorStop(0, `rgba(255,200,110,${a})`);
          gr.addColorStop(1, "rgba(255,200,110,0)");
          ctx.fillStyle = gr;
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
        };
        const forte = ehNoite ? 0.35 : 0.15;
        for (const d of mapa.decoracoes) if (d.tipo === "lampiao" && vis(d.x, d.y)) luz(d.x * TILE + 8, d.y * TILE - 6, 30, forte);
        for (const c of mapa.construcoes) if (c.estilo === "casa" || c.estilo === "loja") luz((c.x + c.w / 2) * TILE, (c.y + c.h * 0.7) * TILE, 44, forte * 0.8);
        luz(g.x * TILE, g.y * TILE - 6, 22, ehNoite ? 0.12 : 0);
        ctx.globalCompositeOperation = "source-over";
      }

      // nomes e selos (em tamanho de tela, nítidos)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const c of mapa.construcoes) {
        const sx = ((c.estilo === "nenhum" ? c.porta.x + 0.5 : c.x + c.w / 2) * TILE - cx) * g.escala;
        const sy = ((c.estilo === "nenhum" ? c.porta.y - 0.6 : c.y - 1) * TILE - cy) * g.escala - 4;
        if (sx < -80 || sx > largura + 80 || sy < -20 || sy > altura + 20) continue;
        const dist = Math.hypot(g.x - (c.porta.x + 0.5), g.y - (c.porta.y + 0.5));
        if (dist < 7) {
          const txt = `${c.emoji} ${c.nome}`;
          ctx.font = "600 12px var(--font-inter), system-ui, sans-serif";
          const w = ctx.measureText(txt).width + 14;
          ctx.globalAlpha = Math.min(1, (7 - dist) / 2);
          ctx.fillStyle = "rgba(15,16,19,0.78)";
          ctx.beginPath();
          ctx.roundRect(sx - w / 2, sy - 10, w, 20, 10);
          ctx.fill();
          ctx.fillStyle = "#F2F0EA";
          ctx.fillText(txt, sx, sy + 0.5);
          ctx.globalAlpha = 1;
        }
        const selo = props.current.selos?.[c.id];
        if (selo) {
          const pulo = Math.abs(Math.sin(t / 260)) * 5;
          ctx.font = "700 13px system-ui, sans-serif";
          ctx.fillStyle = "#F2C46D";
          ctx.beginPath();
          ctx.arc(sx, sy - 22 - pulo, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#1C1C22";
          ctx.fillText(selo, sx, sy - 21.5 - pulo);
        }
      }
      // nome do mascote pequeno acima dele quando parado
      if (!g.andando) {
        ctx.font = "600 11px var(--font-inter), system-ui, sans-serif";
        ctx.fillStyle = "rgba(242,240,234,0.85)";
        ctx.fillText(nomeMascote, (g.x * TILE - cx) * g.escala, ((g.y - 1.75) * TILE - cy) * g.escala);
      }
      // marquinha do destino
      if (g.rota.length) {
        const fim = g.rota[g.rota.length - 1];
        const s = 1 + Math.sin(t / 150) * 0.15;
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(((fim.x + 0.5) * TILE - cx) * g.escala, ((fim.y + 0.8) * TILE - cy) * g.escala, 9 * s, 4.5 * s, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const laco = (agora: number) => {
      const dt = Math.min(0.05, (agora - ultimo) / 1000);
      ultimo = agora;
      atualizar(dt);
      desenhar(agora);
      raf = requestAnimationFrame(laco);
    };
    raf = requestAnimationFrame(laco);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa, pacote]);

  // tocar no mapa: anda até lá (e entra/conversa se for um lugar ou pessoa)
  const toque = useRef<{ x: number; y: number; t: number } | null>(null);
  function tocou(ev: React.PointerEvent<HTMLCanvasElement>) {
    const ini = toque.current;
    toque.current = null;
    if (!ini || Math.hypot(ev.clientX - ini.x, ev.clientY - ini.y) > 12 || dialogoRef.current) return;
    const g = jogo.current;
    const r = ev.currentTarget.getBoundingClientRect();
    const wx = (ev.clientX - r.left) / g.escala + g.cam.x;
    const wy = (ev.clientY - r.top) / g.escala + g.cam.y;
    const tx = Math.floor(wx / TILE);
    const ty = Math.floor(wy / TILE);
    const alvo = alvoDoToque(mapa, tx, ty);
    const destino = alvo ? pontoDoAlvo(mapa, alvo) : { x: tx, y: ty };
    const de = { x: Math.floor(g.x), y: Math.floor(g.y - 0.2) };
    if (alvo && g.perto && JSON.stringify(g.perto) === JSON.stringify(alvo)) return interagir(alvo);
    const rota = caminho(mapa, de, destino);
    if (!rota) return;
    setDica(false);
    g.rota = rota;
    g.alvo = alvo;
    if (!rota.length && alvo) interagir(alvo);
  }

  // joystick
  const [stick, setStick] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null);
  function stickMover(ev: React.PointerEvent<HTMLDivElement>, inicio = false) {
    const r = ev.currentTarget.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = ev.clientX - cx;
    let dy = ev.clientY - cy;
    const max = r.width / 2 - 14;
    const d = Math.hypot(dx, dy);
    if (d > max) {
      dx = (dx / d) * max;
      dy = (dy / d) * max;
    }
    const g = jogo.current;
    g.stick = { x: dx / max, y: dy / max };
    g.rota = [];
    g.alvo = null;
    if (inicio) setDica(false);
    setStick({ ox: 0, oy: 0, x: dx, y: dy });
  }
  function stickSoltar() {
    jogo.current.stick = { x: 0, y: 0 };
    setStick(null);
  }

  const textoPerto =
    perto?.tipo === "lugar"
      ? `Entrar: ${perto.construcao.emoji} ${perto.construcao.nome}`
      : perto?.tipo === "npc"
        ? `Conversar com ${perto.npc.nome}`
        : perto?.tipo === "placa"
          ? "Ler a placa"
          : perto?.tipo === "bau"
            ? bauAberto
              ? "Baú (já aberto hoje)"
              : "Abrir o baú"
            : null;
  const falaAtual = dialogo ? dialogo.falas[dialogo.i] : "";
  const fimDaFala = dialogo ? digitado >= falaAtual.length && dialogo.i === dialogo.falas.length - 1 : false;

  return (
    <div ref={caixa} className="relative w-full h-full select-none overflow-hidden bg-[#3A8BC8]" style={{ touchAction: "none" }}>
      <canvas
        ref={tela}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: "pixelated" }}
        onPointerDown={(e) => (toque.current = { x: e.clientX, y: e.clientY, t: Date.now() })}
        onPointerUp={tocou}
      />

      {/* som da ilha */}
      <button
        type="button"
        onClick={() => {
          const novo = !som;
          guardarSom(novo);
          setSom(novo);
        }}
        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/55 text-white text-lg flex items-center justify-center active:scale-90"
        aria-label={som ? "Desligar som" : "Ligar som"}
      >
        {som ? "🔊" : "🔇"}
      </button>

      {pacote === null && (
        <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">Carregando a ilha…</div>
      )}

      {dica && !dialogo && (
        <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none">
          <span className="rounded-full bg-black/60 text-white text-xs px-3 py-1.5 animate-entrar">Use o controle ou toque onde quer ir</span>
        </div>
      )}

      {/* joystick */}
      {!dialogo && (
        <div
          className="absolute left-4 bottom-4 w-28 h-28 rounded-full bg-black/25 border-2 border-white/25 backdrop-blur-[2px]"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            stickMover(e, true);
          }}
          onPointerMove={(e) => stick && stickMover(e)}
          onPointerUp={stickSoltar}
          onPointerCancel={stickSoltar}
          aria-label="Controle de movimento"
        >
          <div
            className="absolute left-1/2 top-1/2 w-11 h-11 -ml-[22px] -mt-[22px] rounded-full bg-white/80 shadow-lg"
            style={{ transform: `translate(${stick?.x ?? 0}px, ${stick?.y ?? 0}px)` }}
          />
        </div>
      )}

      {/* botão de ação */}
      {!dialogo && (
        <div className="absolute right-4 bottom-4 flex flex-col items-end gap-2">
          {textoPerto && (
            <span className="rounded-full bg-black/70 text-white text-xs font-semibold px-3 py-1.5 max-w-[11rem] truncate animate-entrar">{textoPerto}</span>
          )}
          <button
            type="button"
            disabled={!perto}
            onClick={() => perto && interagir(perto)}
            className="w-16 h-16 rounded-full font-black text-xl border-4 transition active:scale-90 disabled:opacity-35 bg-[#F2C46D] text-[#3A2A10] border-[#FFE6A3] shadow-lg shadow-black/40"
            aria-label={textoPerto ?? "Ação"}
          >
            A
          </button>
        </div>
      )}

      {/* caixa de diálogo */}
      {dialogo && (
        <div className="absolute inset-x-3 bottom-3" onClick={avancarDialogo}>
          <div
            className="relative rounded-xl border-[3px] border-[#F2C46D] px-4 pt-5 pb-4 min-h-[7.5rem] shadow-2xl shadow-black/60"
            style={{ background: "linear-gradient(180deg, #3A2A55 0%, #241A36 100%)", fontFamily: "var(--font-plex-mono), ui-monospace, monospace" }}
          >
            <span className="absolute -top-3.5 left-3 rounded-md bg-[#F2C46D] text-[#3A2A10] text-xs font-bold px-2.5 py-0.5">{dialogo.nome}</span>
            <div className="flex gap-3">
              {dialogo.rosto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dialogo.rosto} alt="" width={76} height={76} className="shrink-0 w-[76px] h-[76px] rounded-md border-2 border-[#F2C46D]" style={{ imageRendering: "pixelated" }} />
              )}
              <p className="text-[15px] leading-snug text-[#F4F1EA]">{falaAtual.slice(0, digitado)}</p>
            </div>
            {fimDaFala && dialogo.opcoes?.length ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {dialogo.opcoes.map((o) => (
                  <button
                    key={o.href}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDialogo(null);
                      props.current.aoNavegar(o.href);
                    }}
                    className="rounded-lg bg-[#F2C46D] text-[#3A2A10] text-sm font-bold px-3 py-1.5 active:scale-95"
                  >
                    {o.rotulo}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDialogo(null);
                  }}
                  className="rounded-lg border border-white/30 text-white/80 text-sm px-3 py-1.5"
                >
                  Agora não
                </button>
              </div>
            ) : (
              digitado >= falaAtual.length && <span className="absolute right-3 bottom-2 text-[#F2C46D] text-xs animate-pulse">▼</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export type { Construcao };
