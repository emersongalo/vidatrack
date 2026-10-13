// Etapa 315 — a Feirinha do Mundo: todo dia um vendedor traz 3 itens pro
// mascote com desconto (sempre os mesmos pro mesmo dia e pessoa). Só
// entram itens que a pessoa ainda não tem e que a fase já libera.
import { faseDoMascote, ITENS, moedasDisponiveis, type DadosMascote, type Item } from "@/lib/mascote/mascote";

export const DESCONTO_FEIRA = 0.3;
export const ITENS_NA_FEIRA = 3;

function semente(texto: string) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const precoNaFeira = (item: Item) => Math.max(1, Math.round(item.preco * (1 - DESCONTO_FEIRA)));

export type Oferta = { item: Item; preco: number; comprado: boolean };

export function ofertasDoDia(m: DadosMascote | null, feitos: number, hoje: string, quem = ""): Oferta[] {
  const fase = faseDoMascote(feitos).nivel;
  // a lista do dia não muda depois de comprar: sorteia sobre os que não tinha de manhã
  const compradosHoje = new Set(m?.feira?.[hoje] ?? []);
  const candidatos = ITENS.filter((i) => !i.evento && !i.exclusivo && i.nivel <= Math.max(1, fase) && (!m?.inventario.includes(i.id) || compradosHoje.has(i.id)));
  let s = semente(`feira|${hoje}|${quem || m?.nome || ""}`) || 1;
  const r = [...candidatos];
  for (let i = r.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const j = s % (i + 1);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r.slice(0, ITENS_NA_FEIRA).map((item) => ({ item, preco: precoNaFeira(item), comprado: !!m?.inventario.includes(item.id) }));
}

export function comprarNaFeira(
  m: DadosMascote,
  feitos: number,
  itemId: string,
  hoje: string,
  quem = ""
): { ok: true; mascote: DadosMascote } | { ok: false; motivo: string } {
  const oferta = ofertasDoDia(m, feitos, hoje, quem).find((o) => o.item.id === itemId);
  if (!oferta) return { ok: false, motivo: "Esse item não está na feira hoje" };
  if (oferta.comprado) return { ok: false, motivo: "Já é seu" };
  const saldo = moedasDisponiveis(feitos, m.gastos, m.bonus);
  if (saldo < oferta.preco) return { ok: false, motivo: `Faltam ${oferta.preco - saldo} 🪙` };
  const feira = { [hoje]: [...(m.feira?.[hoje] ?? []), itemId] }; // guarda só o dia de hoje
  return {
    ok: true,
    mascote: {
      ...m,
      gastos: m.gastos + oferta.preco,
      inventario: [...m.inventario, itemId],
      equipados: { ...m.equipados, [oferta.item.slot]: itemId },
      feira,
    },
  };
}
