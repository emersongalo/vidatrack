// Etapa 218 — pausar hábitos (férias, doença, viagem) sem quebrar a sequência.
// Cada hábito guarda uma lista de pausas {inicio, fim} (datas YYYY-MM-DD, inclusivas).
import { diaBateComFrequencia } from "@/lib/agenda/dias";

export type Pausa = { inicio: string; fim: string };

const RE = /^\d{4}-\d{2}-\d{2}$/;

export function pausasDe(h: { pausas?: unknown } | null | undefined): Pausa[] {
  const bruto = h?.pausas;
  if (!Array.isArray(bruto)) return [];
  return bruto
    .filter((p: any) => p && RE.test(p.inicio) && RE.test(p.fim) && p.fim >= p.inicio)
    .map((p: any) => ({ inicio: p.inicio, fim: p.fim }));
}

export function diaEmPausa(pausas: Pausa[], dia: string): boolean {
  return pausas.some((p) => dia >= p.inicio && dia <= p.fim);
}

export function emPausa(h: { pausas?: unknown }, dia: string): boolean {
  return diaEmPausa(pausasDe(h), dia);
}

/** O hábito "vale" nesse dia? (frequência certa e não está pausado) */
export function habitoDevidoNoDia(
  h: { frequencia: string; dias_semana?: number[] | null; pausas?: unknown },
  dia: string
): boolean {
  return !emPausa(h, dia) && diaBateComFrequencia(h.frequencia, h.dias_semana ?? [], dia);
}

/** Pausa em andamento ou agendada (a que termina mais tarde a partir de hoje). */
export function pausaAtualOuFutura(h: { pausas?: unknown }, hoje: string): Pausa | null {
  return pausasDe(h)
    .filter((p) => p.fim >= hoje)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))[0] ?? null;
}

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Junta pausas que se encostam/sobrepõem e guarda no máximo as 20 mais recentes. */
export function adicionarPausa(pausas: Pausa[], inicio: string, fim: string): Pausa[] {
  const lista = [...pausas, { inicio, fim }].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const saida: Pausa[] = [];
  for (const p of lista) {
    const ult = saida[saida.length - 1];
    if (ult && p.inicio <= somarDias(ult.fim, 1)) {
      if (p.fim > ult.fim) ult.fim = p.fim;
    } else saida.push({ ...p });
  }
  return saida.slice(-20);
}

/** "Retomar agora": a pausa em andamento termina ontem; as futuras somem. */
export function encerrarPausas(pausas: Pausa[], hoje: string): Pausa[] {
  const ontem = somarDias(hoje, -1);
  return pausas
    .filter((p) => p.inicio < hoje)
    .map((p) => (p.fim >= hoje ? { inicio: p.inicio, fim: ontem } : p))
    .filter((p) => p.fim >= p.inicio);
}
