// Etapa 316 — eventos da estação (todo ano nas mesmas datas): a ilha ganha
// decoração, a lojinha ganha itens do evento e quem fizer a meta de
// hábitos durante o evento ganha um prêmio exclusivo.
import type { DadosMascote } from "@/lib/mascote/mascote";

export type Evento = {
  id: "halloween" | "natal";
  nome: string;
  emoji: string;
  /** MM-DD (o fim pode cair no ano seguinte) */
  inicio: string;
  fim: string;
  meta: number;
  /** item exclusivo que só sai como prêmio */
  premio: string;
  texto: string;
};

export const EVENTOS: Evento[] = [
  { id: "halloween", nome: "Halloween na ilha", emoji: "🎃", inicio: "10-20", fim: "11-02", meta: 25, premio: "abobora", texto: "Abóboras, morcegos e itens assustadores na lojinha." },
  { id: "natal", nome: "Natal na ilha", emoji: "🎄", inicio: "12-10", fim: "01-06", meta: 30, premio: "rena", texto: "Pinheiros com luzinhas, presentes e neve na ilha." },
];

export type EventoAtivo = Evento & { chave: string; de: string; ate: string; diasRestantes: number };

const somar = (iso: string, n: number) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
};
const dias = (de: string, ate: string) => Math.round((Date.parse(ate + "T12:00:00Z") - Date.parse(de + "T12:00:00Z")) / 86400000);

/** O evento que está rolando hoje (ou null). A chave leva o ano em que começou. */
export function eventoDoDia(hoje: string): EventoAtivo | null {
  const ano = Number(hoje.slice(0, 4));
  for (const e of EVENTOS) {
    for (const a of [ano, ano - 1]) {
      const de = `${a}-${e.inicio}`;
      const ate = e.fim < e.inicio ? `${a + 1}-${e.fim}` : `${a}-${e.fim}`;
      if (hoje >= de && hoje <= ate) return { ...e, chave: `${e.id}-${a}`, de, ate, diasRestantes: dias(hoje, ate) };
    }
  }
  return null;
}

/** Próximo evento (pra mostrar "em breve"). */
export function proximoEvento(hoje: string): { evento: Evento; de: string; faltam: number } | null {
  const ano = Number(hoje.slice(0, 4));
  let melhor: { evento: Evento; de: string; faltam: number } | null = null;
  for (const e of EVENTOS)
    for (const a of [ano, ano + 1]) {
      const de = `${a}-${e.inicio}`;
      if (de <= hoje) continue;
      const f = dias(hoje, de);
      if (!melhor || f < melhor.faltam) melhor = { evento: e, de, faltam: f };
    }
  return melhor;
}

/** Hábitos feitos (meta do dia batida, hábitos de fazer) entre o início do evento e hoje. */
export function progressoDoEvento(s: any, ev: EventoAtivo, hoje: string): number {
  const habitos = new Map(((s?.habitos ?? []) as any[]).filter((h) => !h.eh_negativo).map((h) => [h.id, Math.max(1, Number(h.meta_diaria) || 1)]));
  const soma = new Map<string, number>();
  for (const c of (s?.habitoCheckins ?? []) as any[]) {
    if (!habitos.has(c.habito_id) || c.data < ev.de || c.data > hoje) continue;
    const k = `${c.habito_id}|${c.data}`;
    soma.set(k, (soma.get(k) ?? 0) + Number(c.quantidade ?? 1));
  }
  let n = 0;
  for (const [k, q] of soma) if (q >= (habitos.get(k.split("|")[0]) ?? 1)) n++;
  return n;
}

export function premioResgatado(m: DadosMascote | null, ev: EventoAtivo) {
  return !!m?.eventos?.includes(ev.chave);
}

export function resgatarPremioEvento(m: DadosMascote, ev: EventoAtivo, feitosNoEvento: number): DadosMascote | null {
  if (premioResgatado(m, ev) || feitosNoEvento < ev.meta) return null;
  const inventario = m.inventario.includes(ev.premio) ? m.inventario : [...m.inventario, ev.premio];
  return { ...m, inventario, eventos: [...(m.eventos ?? []), ev.chave].slice(-20) };
}

/** Item de evento só aparece na loja durante o evento (ou se já é seu); prêmio nunca é vendido. */
export function itemNaLoja(item: { id: string; evento?: string; exclusivo?: boolean }, m: DadosMascote | null, hoje: string) {
  if (m?.inventario.includes(item.id)) return true;
  if (item.exclusivo) return false;
  if (!item.evento) return true;
  return eventoDoDia(hoje)?.id === item.evento;
}

export { somar as somarDiasEvento };
