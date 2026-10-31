// Etapa 368 — o mês em quadradinhos: quanto entrou e saiu em cada dia e
// se ainda tem algo pra pagar/receber. Função pura (testada).
import { aguardandoConfirmacao } from "@/lib/financas/confirmacao";

export type DiaResumo = { entrada: number; saida: number; pendente: boolean; itens: any[] };

export function resumoDoMes(lancamentos: any[], anoMesISO: string, hojeISO: string) {
  const dias = new Map<number, DiaResumo>();
  let entrada = 0;
  let saida = 0;
  for (const t of lancamentos ?? []) {
    if (!t?.data || !String(t.data).startsWith(anoMesISO) || t.transferencia_grupo) continue;
    const dia = Number(String(t.data).slice(8, 10));
    const r = dias.get(dia) ?? { entrada: 0, saida: 0, pendente: false, itens: [] };
    const v = Number(t.valor) || 0;
    if (t.tipo === "receita") {
      r.entrada += v;
      entrada += v;
    } else {
      r.saida += v;
      saida += v;
    }
    if (!t.pago_em && (t.prevista || t.data > hojeISO || aguardandoConfirmacao(t, hojeISO))) r.pendente = true;
    r.itens.push(t);
    dias.set(dia, r);
  }
  let maior = 0;
  dias.forEach((r) => {
    maior = Math.max(maior, Math.abs(r.entrada - r.saida));
  });
  return { dias, entrada, saida, maior };
}

/** 0 = sem movimento; 1..3 = intensidade do saldo do dia */
export function nivelDoDia(r: DiaResumo | undefined, maior: number): 0 | 1 | 2 | 3 {
  if (!r || (!r.entrada && !r.saida) || maior <= 0) return 0;
  const p = Math.abs(r.entrada - r.saida) / maior;
  return p > 0.6 ? 3 : p > 0.25 ? 2 : 1;
}
