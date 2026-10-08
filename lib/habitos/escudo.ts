// Etapa 276 — escudo da sequência: 1 "folga coringa" por semana.
// Esqueceu de marcar ontem? Usa o escudo e o dia vira folga (uma pausa de
// 1 dia marcada com escudo: true), então a sequência não quebra.
// Não precisa de coluna nova: usa a lista de pausas que o hábito já tem.
import { calcularStreak } from "@/lib/habitos/streak";
import { habitoDevidoNoDia, pausasDe } from "@/lib/habitos/pausa";

export const ESCUDOS_POR_SEMANA = 1;
/** a sequência precisa ter pelo menos isso pra valer a pena proteger */
export const SEQUENCIA_MINIMA = 2;

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

type Checkin = { habito_id: string; data: string; quantidade?: number | null };

export function escudosUsadosNaSemana(habito: { pausas?: unknown }, hoje: string): number {
  const bruto = Array.isArray(habito.pausas) ? (habito.pausas as any[]) : [];
  const inicio = somarDias(hoje, -6);
  return bruto.filter((p) => p?.escudo && typeof p.inicio === "string" && p.inicio >= inicio && p.inicio <= hoje).length;
}

export type OfertaEscudo = { dia: string; sequencia: number; restantes: number };

/** Dá pra usar o escudo agora? Devolve o dia que seria salvo e a sequência protegida. */
export function ofertaDeEscudo(habito: any, checkins: Checkin[], hoje: string): OfertaEscudo | null {
  if (!habito || habito.eh_negativo || habito.arquivado) return null;
  const ontem = somarDias(hoje, -1);
  const criado = String(habito.criado_em ?? "").slice(0, 10);
  if (criado && criado > ontem) return null;
  if (!habitoDevidoNoDia(habito, ontem)) return null; // ontem já era folga/pausa

  const meta = Math.max(1, Number(habito.meta_diaria) || 1);
  const qtd = new Map<string, number>();
  for (const c of checkins) if (c.habito_id === habito.id) qtd.set(c.data, (qtd.get(c.data) ?? 0) + Number(c.quantidade ?? 1));
  if ((qtd.get(ontem) ?? 0) >= meta) return null; // ontem foi feito

  const restantes = ESCUDOS_POR_SEMANA - escudosUsadosNaSemana(habito, hoje);
  if (restantes <= 0) return null;

  const feitos = [...qtd.entries()].filter(([, q]) => q >= meta).map(([d]) => d);
  const sequencia = calcularStreak(feitos, pausasDe(habito), somarDias(hoje, -2));
  if (sequencia < SEQUENCIA_MINIMA) return null;
  return { dia: ontem, sequencia, restantes };
}

/** Nova lista de pausas com o escudo no dia informado (mantém as pausas que já existiam). */
export function pausasComEscudo(habito: { pausas?: unknown }, dia: string): unknown[] {
  const bruto = Array.isArray(habito.pausas) ? [...(habito.pausas as any[])] : [];
  return [...bruto, { inicio: dia, fim: dia, escudo: true }].slice(-30);
}
