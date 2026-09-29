// Etapa 221 — simulador "e se…": quanto tempo até a meta guardando o
// que sobra hoje, e quanto antes chega cortando um gasto.
import { resumoDozeMeses } from "@/lib/financas/dozeMeses";
import { gastoCategoriaNoMes, mesAnterior } from "@/lib/financas/envelopes";

type Conta = { id: string; tipo: string };
type Transacao = { conta_id: string; categoria_id?: string | null; tipo: string; valor: number | string; data: string; transferencia_grupo?: string | null; pago_em?: string | null };

const r2 = (v: number) => Math.round(v * 100) / 100;

/** Média do que sobrou nos últimos 3 meses fechados (nunca negativa). */
export function sobraMediaMensal(contas: Conta[], transacoes: Transacao[], hojeISO: string): number {
  const meses = resumoDozeMeses(contas, transacoes, hojeISO, 4).slice(0, 3); // tira o mês atual (incompleto)
  const comMovimento = meses.filter((m) => m.receitas > 0 || m.despesas > 0);
  if (!comMovimento.length) return 0;
  return Math.max(0, r2(comMovimento.reduce((s, m) => s + m.sobra, 0) / comMovimento.length));
}

/** Média gasta numa categoria nos últimos 3 meses fechados. */
export function gastoMedioCategoria(categoriaId: string, contas: Conta[], transacoes: Transacao[], hojeISO: string): number {
  let mes = hojeISO.slice(0, 7);
  let total = 0;
  for (let i = 0; i < 3; i++) {
    mes = mesAnterior(mes);
    total += gastoCategoriaNoMes(categoriaId, contas, transacoes, mes, hojeISO);
  }
  return r2(total / 3);
}

function somarMeses(hojeISO: string, n: number): string {
  const [a, m] = hojeISO.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + n, 1)).toISOString().slice(0, 7);
}

export type Simulacao = {
  falta: number;
  mesesHoje: number | null;
  mesesComCorte: number | null;
  mesHoje: string | null;
  mesComCorte: string | null;
  ganhoEm12Meses: number;
};

/** meses = null quando, guardando esse valor, nunca chega (aporte <= 0). */
export function simular(entrada: { alvo: number; atual: number; aporteMensal: number; corteMensal: number; hojeISO: string }): Simulacao {
  const falta = Math.max(0, r2(entrada.alvo - entrada.atual));
  const calc = (aporte: number) => (falta === 0 ? 0 : aporte > 0 ? Math.ceil(falta / aporte) : null);
  const mesesHoje = calc(entrada.aporteMensal);
  const mesesComCorte = calc(entrada.aporteMensal + Math.max(0, entrada.corteMensal));
  return {
    falta,
    mesesHoje,
    mesesComCorte,
    mesHoje: mesesHoje === null ? null : somarMeses(entrada.hojeISO, mesesHoje),
    mesComCorte: mesesComCorte === null ? null : somarMeses(entrada.hojeISO, mesesComCorte),
    ganhoEm12Meses: r2(Math.max(0, entrada.corteMensal) * 12),
  };
}
