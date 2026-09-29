// Etapa 220 — calendário financeiro: o que entrou/saiu em cada dia e,
// daqui pra frente, o que vai entrar/sair (agendados, contas fixas,
// faturas) com o saldo previsto dia a dia.
import { calcularPeriodoFatura, periodoFaturaAdjacente } from "@/lib/financas/fatura";
import { ehContaComum, resumoFatura } from "@/lib/financas/previsao";

export type EventoFinanceiro = {
  data: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  origem: "lancado" | "agendado" | "recorrente" | "fatura" | "cartao";
  afetaSaldo: boolean;
};

type Conta = { id: string; nome: string; tipo: string; saldo?: number | string; dia_fechamento?: number | null; dia_vencimento?: number | null };
type Transacao = {
  conta_id: string;
  tipo: string;
  valor: number | string;
  data: string;
  descricao?: string | null;
  pago_em?: string | null;
  recorrencia_id?: string | null;
  transferencia_grupo?: string | null;
};
type Recorrencia = { id: string; conta_id: string; tipo: string; valor: number | string; dia_mes: number; data_fim: string | null; data_inicio?: string | null; ativo: boolean; descricao: string | null };

function ultimoDia(a: number, m: number) {
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
}
function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

export function eventosFinanceiros(
  entrada: { contas: Conta[]; transacoes: Transacao[]; recorrencias: Recorrencia[]; hojeISO: string },
  inicio: string,
  fim: string
): EventoFinanceiro[] {
  const { contas, transacoes, recorrencias, hojeISO } = entrada;
  const comuns = new Set(contas.filter(ehContaComum).map((c) => c.id));
  const cartoes = new Set(contas.filter((c) => c.tipo === "cartao").map((c) => c.id));
  const eventos: EventoFinanceiro[] = [];

  // transferência entre duas contas comuns não muda o saldo total: esconde
  const pernasPorGrupo = new Map<string, Transacao[]>();
  for (const t of transacoes) if (t.transferencia_grupo) {
    if (!pernasPorGrupo.has(t.transferencia_grupo)) pernasPorGrupo.set(t.transferencia_grupo, []);
    pernasPorGrupo.get(t.transferencia_grupo)!.push(t);
  }

  for (const t of transacoes) {
    if (t.data < inicio || t.data > fim) continue;
    if (!comuns.has(t.conta_id) && !cartoes.has(t.conta_id)) continue;
    if (t.transferencia_grupo) {
      const pernas = pernasPorGrupo.get(t.transferencia_grupo) ?? [];
      if (pernas.every((p) => comuns.has(p.conta_id))) continue;
      if (!comuns.has(t.conta_id)) continue; // mostra só o lado do banco (ex: pagamento de fatura)
    }
    const futuro = t.data > hojeISO && !t.pago_em;
    const noCartao = cartoes.has(t.conta_id);
    eventos.push({
      data: t.data,
      descricao: t.descricao || (t.transferencia_grupo ? "Transferência" : t.tipo === "receita" ? "Receita" : "Despesa"),
      valor: Number(t.valor),
      tipo: t.tipo === "receita" ? "receita" : "despesa",
      origem: noCartao ? "cartao" : futuro ? "agendado" : "lancado",
      afetaSaldo: comuns.has(t.conta_id) && futuro,
    });
  }

  // contas fixas que ainda não viraram lançamento, mês a mês
  const [a1, m1] = inicio.split("-").map(Number);
  const [a2, m2] = fim.split("-").map(Number);
  for (let a = a1, m = m1; a < a2 || (a === a2 && m <= m2); m === 12 ? ((a += 1), (m = 1)) : (m += 1)) {
    const prefixo = `${a}-${String(m).padStart(2, "0")}`;
    const lancadas = new Set(transacoes.filter((t) => t.recorrencia_id && t.data.startsWith(prefixo)).map((t) => t.recorrencia_id));
    for (const r of recorrencias) {
      if (!r.ativo || !comuns.has(r.conta_id) || lancadas.has(r.id)) continue;
      const data = `${prefixo}-${String(Math.min(r.dia_mes, ultimoDia(a, m))).padStart(2, "0")}`;
      if (data <= hojeISO || data < inicio || data > fim) continue;
      if (r.data_fim && data > r.data_fim) continue;
      if (r.data_inicio && data < r.data_inicio) continue;
      eventos.push({
        data,
        descricao: r.descricao || "Conta fixa",
        valor: Number(r.valor),
        tipo: r.tipo === "receita" ? "receita" : "despesa",
        origem: "recorrente",
        afetaSaldo: true,
      });
    }
  }

  // faturas de cartão que vencem no intervalo
  for (const c of contas) {
    if (c.tipo !== "cartao" || !c.dia_fechamento || !c.dia_vencimento) continue;
    let periodo = calcularPeriodoFatura(c.dia_fechamento, somarDias(inicio, -45));
    for (let n = 0; n < 30; n++) {
      const r = resumoFatura(c as any, transacoes as any, periodo);
      if (r.vencimento && r.vencimento > fim) break;
      if (r.vencimento && r.vencimento >= inicio && r.vencimento > hojeISO && r.aPagar > 0) {
        eventos.push({ data: r.vencimento, descricao: `Fatura ${c.nome}`, valor: r.aPagar, tipo: "despesa", origem: "fatura", afetaSaldo: true });
      }
      periodo = periodoFaturaAdjacente(c.dia_fechamento, periodo.fim, 1);
    }
  }

  return eventos.sort((x, y) => x.data.localeCompare(y.data) || (x.tipo === "receita" ? -1 : 1));
}

/** Saldo previsto no fim de cada dia, de hoje até `fim` (só contas comuns). */
export function saldoPrevistoPorDia(saldoHoje: number, eventos: EventoFinanceiro[], hojeISO: string, fim: string): Map<string, number> {
  const porDia = new Map<string, number>();
  for (const e of eventos) {
    if (!e.afetaSaldo || e.data <= hojeISO) continue;
    const sinal = e.tipo === "receita" ? 1 : -1;
    porDia.set(e.data, (porDia.get(e.data) ?? 0) + sinal * e.valor);
  }
  const saida = new Map<string, number>();
  let saldo = saldoHoje;
  saida.set(hojeISO, Math.round(saldo * 100) / 100);
  for (let d = somarDias(hojeISO, 1), n = 0; d <= fim && n < 800; d = somarDias(d, 1), n++) {
    saldo += porDia.get(d) ?? 0;
    saida.set(d, Math.round(saldo * 100) / 100);
  }
  return saida;
}
