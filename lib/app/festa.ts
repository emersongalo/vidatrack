/**
 * Etapa 273 — efeitos de comemoração leves, sem biblioteca:
 *  - explodirEm: estouro de confetes saindo de um botão (ao marcar feito)
 *  - textoFlutuante: "+1", "Boa!" subindo e sumindo
 *  - chuvaDeConfete: confete caindo na tela toda (dia completo, conquista)
 *
 * Tudo é criado direto no <body>, com a Web Animations API, e se apaga
 * sozinho. Quem pediu "reduzir movimento" no aparelho não vê nada disso.
 */

const CORES_PADRAO = ["#7FB894", "#D9A24C", "#9C8FD9", "#E5567A", "#4C8FCC", "#3FB8BD", "#F5E6B8"];

const FRASES = [
  "Boa!",
  "Mandou bem!",
  "Mais um ✓",
  "Isso aí!",
  "Arrasou!",
  "Feito! 💪",
  "Show!",
  "Bora! 🔥",
  "Uhuul!",
  "Top! ✨",
];

export function movimentoReduzido(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function frasePositiva(): string {
  return FRASES[Math.floor(Math.random() * FRASES.length)];
}

function pontoDe(alvo: Element | { x: number; y: number }): { x: number; y: number } {
  if ("getBoundingClientRect" in alvo) {
    const r = alvo.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return alvo;
}

function camada(): HTMLDivElement {
  const div = document.createElement("div");
  div.setAttribute("aria-hidden", "true");
  div.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;";
  document.body.appendChild(div);
  return div;
}

/** Clareia/mistura uma cor hex com branco (pra ter variação no confete). */
function variacoes(cor?: string): string[] {
  if (!cor || !/^#[0-9a-f]{6}$/i.test(cor)) return CORES_PADRAO;
  const n = parseInt(cor.slice(1), 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  const misturar = (t: number) =>
    `rgb(${Math.round(r + (255 - r) * t)}, ${Math.round(g + (255 - g) * t)}, ${Math.round(b + (255 - b) * t)})`;
  return [cor, misturar(0.25), misturar(0.5), "#F5E6B8", cor];
}

export function explodirEm(
  alvo: Element | { x: number; y: number } | null | undefined,
  opcoes: { cor?: string; quantidade?: number; emojis?: string[] } = {}
) {
  if (typeof window === "undefined" || !alvo || movimentoReduzido()) return;
  try {
    const { x, y } = pontoDe(alvo);
    const cores = variacoes(opcoes.cor);
    const qtd = opcoes.quantidade ?? 16;
    const box = camada();

    // anel que se expande
    const anel = document.createElement("span");
    anel.style.cssText = `position:absolute;left:${x - 22}px;top:${y - 22}px;width:44px;height:44px;border-radius:9999px;border:3px solid ${cores[0]};`;
    box.appendChild(anel);
    anel.animate(
      [
        { transform: "scale(0.6)", opacity: 0.9 },
        { transform: "scale(2.2)", opacity: 0 },
      ],
      { duration: 550, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" }
    );

    for (let i = 0; i < qtd; i++) {
      const p = document.createElement("span");
      const emoji = opcoes.emojis?.length && i % 4 === 0 ? opcoes.emojis[i % opcoes.emojis.length] : null;
      const tamanho = 5 + Math.random() * 6;
      if (emoji) {
        p.textContent = emoji;
        p.style.cssText = `position:absolute;left:${x}px;top:${y}px;font-size:16px;line-height:1;transform:translate(-50%,-50%);`;
      } else {
        const redondo = Math.random() > 0.5;
        p.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${tamanho}px;height:${
          redondo ? tamanho : tamanho * 0.45
        }px;background:${cores[i % cores.length]};border-radius:${redondo ? "9999px" : "2px"};`;
      }
      box.appendChild(p);
      const angulo = (Math.PI * 2 * i) / qtd + (Math.random() - 0.5) * 0.6;
      const dist = 38 + Math.random() * 46;
      const dx = Math.cos(angulo) * dist;
      const dy = Math.sin(angulo) * dist;
      const giro = (Math.random() - 0.5) * 540;
      p.animate(
        [
          { transform: `translate(-50%,-50%) translate(0,0) rotate(0deg) scale(1)`, opacity: 1 },
          { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) rotate(${giro / 2}deg) scale(1)`, opacity: 1, offset: 0.55 },
          { transform: `translate(-50%,-50%) translate(${dx * 1.15}px,${dy + 40}px) rotate(${giro}deg) scale(0.6)`, opacity: 0 },
        ],
        { duration: 750 + Math.random() * 300, easing: "cubic-bezier(.15,.7,.35,1)", fill: "forwards" }
      );
    }
    setTimeout(() => box.remove(), 1200);
  } catch {
    /* efeito é só enfeite */
  }
}

export function textoFlutuante(
  alvo: Element | { x: number; y: number } | null | undefined,
  texto: string,
  cor = "#7FB894"
) {
  if (typeof window === "undefined" || !alvo || movimentoReduzido()) return;
  try {
    const { x, y } = pontoDe(alvo);
    const box = camada();
    const t = document.createElement("span");
    t.textContent = texto;
    t.style.cssText = `position:absolute;left:${x}px;top:${y - 26}px;transform:translate(-50%,0);font-weight:700;font-size:15px;color:${cor};white-space:nowrap;text-shadow:0 1px 6px rgba(0,0,0,.45);`;
    box.appendChild(t);
    t.animate(
      [
        { transform: "translate(-50%, 8px) scale(0.7)", opacity: 0 },
        { transform: "translate(-50%, -6px) scale(1.08)", opacity: 1, offset: 0.25 },
        { transform: "translate(-50%, -14px) scale(1)", opacity: 1, offset: 0.7 },
        { transform: "translate(-50%, -34px) scale(0.95)", opacity: 0 },
      ],
      { duration: 1100, easing: "ease-out", fill: "forwards" }
    );
    setTimeout(() => box.remove(), 1200);
  } catch {
    /* enfeite */
  }
}

export function chuvaDeConfete(opcoes: { duracao?: number; quantidade?: number; cores?: string[] } = {}) {
  if (typeof window === "undefined" || movimentoReduzido()) return;
  try {
    const box = camada();
    const cores = opcoes.cores ?? CORES_PADRAO;
    const qtd = opcoes.quantidade ?? 70;
    const duracao = opcoes.duracao ?? 2600;
    const largura = window.innerWidth;
    const altura = window.innerHeight;
    for (let i = 0; i < qtd; i++) {
      const p = document.createElement("span");
      const w = 6 + Math.random() * 6;
      const h = Math.random() > 0.3 ? w * 0.45 : w;
      const x = Math.random() * largura;
      p.style.cssText = `position:absolute;left:${x}px;top:-20px;width:${w}px;height:${h}px;background:${
        cores[i % cores.length]
      };border-radius:${h === w ? "9999px" : "2px"};`;
      box.appendChild(p);
      const deriva = (Math.random() - 0.5) * 160;
      const giro = 360 + Math.random() * 720;
      p.animate(
        [
          { transform: "translate(0,0) rotate(0deg) rotateX(0deg)", opacity: 1 },
          { transform: `translate(${deriva / 2}px, ${altura * 0.55}px) rotate(${giro / 2}deg) rotateX(360deg)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${deriva}px, ${altura + 40}px) rotate(${giro}deg) rotateX(720deg)`, opacity: 0.2 },
        ],
        { duration: duracao * (0.7 + Math.random() * 0.5), delay: Math.random() * 500, easing: "cubic-bezier(.25,.6,.4,1)", fill: "both" }
      );
    }
    setTimeout(() => box.remove(), duracao * 1.3 + 600);
  } catch {
    /* enfeite */
  }
}
