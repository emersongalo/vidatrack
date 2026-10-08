/**
 * Etapa 276 — "Desfazer" no lugar do "Tem certeza?".
 *
 * Dois jeitos:
 *  - executarDepois: a ação só roda depois de alguns segundos. Se tocar em
 *    "Desfazer" antes, ela nunca acontece (usado pra excluir de vez).
 *  - desfazer: a ação já rodou e é reversível (arquivar). "Desfazer" chama
 *    a volta (restaurar).
 *
 * Um aviso por vez aparece embaixo da tela (componente AvisoDesfazer).
 * Se o app for fechado/escondido com algo esperando, executa na hora —
 * pra nunca "esquecer" uma exclusão que a pessoa confirmou.
 */

export const EVENTO_DESFAZER = "vt-desfazer";
const DURACAO = 5000;

export type ItemDesfazer = {
  id: number;
  texto: string;
  ate: number;
};

type Interno = ItemDesfazer & {
  executarDepois?: () => Promise<unknown> | unknown;
  desfazer?: () => Promise<unknown> | unknown;
  aoDesfazer?: () => void;
  aoTerminar?: () => void;
  timer: ReturnType<typeof setTimeout> | null;
};

let seq = 0;
const pendentes = new Map<number, Interno>();

function avisar() {
  if (typeof window === "undefined") return;
  const lista: ItemDesfazer[] = [...pendentes.values()].map(({ id, texto, ate }) => ({ id, texto, ate }));
  window.dispatchEvent(new CustomEvent<ItemDesfazer[]>(EVENTO_DESFAZER, { detail: lista }));
}

async function concluir(id: number) {
  const p = pendentes.get(id);
  if (!p) return;
  pendentes.delete(id);
  if (p.timer) clearTimeout(p.timer);
  avisar();
  try {
    if (p.executarDepois) await p.executarDepois();
  } finally {
    p.aoTerminar?.();
  }
}

export function comDesfazer(opcoes: {
  texto: string;
  executarDepois?: () => Promise<unknown> | unknown;
  desfazer?: () => Promise<unknown> | unknown;
  /** some da tela na hora; isso aqui traz de volta se desfizer */
  aoDesfazer?: () => void;
  /** depois que a ação de fato rodou (ex: recarregar a lista) */
  aoTerminar?: () => void;
  duracao?: number;
}): number {
  const id = ++seq;
  const duracao = opcoes.duracao ?? DURACAO;
  const item: Interno = {
    id,
    texto: opcoes.texto,
    ate: Date.now() + duracao,
    executarDepois: opcoes.executarDepois,
    desfazer: opcoes.desfazer,
    aoDesfazer: opcoes.aoDesfazer,
    aoTerminar: opcoes.aoTerminar,
    timer: null,
  };
  item.timer = setTimeout(() => void concluir(id), duracao);
  pendentes.set(id, item);
  avisar();
  return id;
}

export async function desfazerAgora(id: number) {
  const p = pendentes.get(id);
  if (!p) return;
  pendentes.delete(id);
  if (p.timer) clearTimeout(p.timer);
  avisar();
  p.aoDesfazer?.();
  if (p.desfazer) {
    await p.desfazer();
    p.aoTerminar?.();
  }
}

/** Executa tudo que estava esperando (app indo pro fundo / fechando). */
export function executarPendentes() {
  for (const id of [...pendentes.keys()]) void concluir(id);
}

export function listaPendentes(): ItemDesfazer[] {
  return [...pendentes.values()].map(({ id, texto, ate }) => ({ id, texto, ate }));
}
