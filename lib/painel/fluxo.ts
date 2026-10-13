// Etapa 317 — "Entradas e saídas" no Início: tudo que ainda vai entrar e
// sair de dinheiro (o que venceu e ninguém confirmou, os agendados, as
// contas fixas que ainda não viraram lançamento e as faturas), com o
// saldo de como fica se tudo acontecer. Calculado do retrato local.
import { eventosFinanceiros } from "@/lib/financas/calendario";
import { aguardandoConfirmacao } from "@/lib/financas/confirmacao";
import { ehContaComum } from "@/lib/financas/previsao";

export type OrigemFluxo = "pendente" | "agendado" | "fixa" | "fatura";

export type ItemFluxo = {
  chave: string;
  /** id do lançamento (dá pra marcar Paguei/Recebi direto) */
  transacaoId: string | null;
  data: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  origem: OrigemFluxo;
  conta: string | null;
  atrasado: boolean;
  href: string;
};

export type Fluxo = {
  itens: ItemFluxo[];
  aEntrar: number;
  aSair: number;
  saldoHoje: number;
  saldoDepois: number;
  ate: string;
};

export function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
export function fimDoMes(iso: string) {
  const [a, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
}

export type PeriodoFluxo = "7d" | "mes" | "30d";
export function ateDoPeriodo(p: PeriodoFluxo, hoje: string) {
  if (p === "7d") return somarDias(hoje, 7);
  if (p === "30d") return somarDias(hoje, 30);
  const fim = fimDoMes(hoje);
  // no fim do mês, "este mês" mostra pelo menos a próxima semana
  return fim < somarDias(hoje, 3) ? somarDias(hoje, 7) : fim;
}

export function fluxoFinanceiro(s: any, hoje: string, ate: string): Fluxo {
  const contas = (s?.financas?.contas ?? []) as any[];
  const transacoes = (s?.financas?.transacoes ?? []) as any[];
  const recorrencias = (s?.financas?.recorrencias ?? []) as any[];
  const comuns = new Map(contas.filter((c) => ehContaComum(c) && !c.arquivado).map((c) => [c.id as string, c]));
  const itens: ItemFluxo[] = [];

  // lançamentos: o que venceu sem confirmar e o que está agendado
  for (const t of transacoes) {
    if (t.pago_em || t.transferencia_grupo || !comuns.has(t.conta_id)) continue;
    const conta = comuns.get(t.conta_id);
    const pendente = aguardandoConfirmacao({ ...t, conta_tipo: t.conta_tipo ?? conta?.tipo }, hoje);
    const agendado = t.data > hoje && t.data <= ate;
    if (!pendente && !agendado) continue;
    itens.push({
      chave: `t:${t.id}`,
      transacaoId: t.id,
      data: t.data,
      descricao: t.descricao || (t.tipo === "receita" ? "Receita" : "Despesa"),
      valor: Number(t.valor),
      tipo: t.tipo === "receita" ? "receita" : "despesa",
      origem: pendente ? "pendente" : "agendado",
      conta: conta?.nome ?? null,
      atrasado: pendente && t.data < hoje,
      href: `/financas/${t.id}/editar`,
    });
  }

  // contas fixas ainda não lançadas e faturas
  try {
    const eventos = eventosFinanceiros({ contas, transacoes, recorrencias, hojeISO: hoje }, somarDias(hoje, 1), ate);
    for (const e of eventos) {
      if (e.origem !== "recorrente" && e.origem !== "fatura") continue;
      const cartao = e.origem === "fatura" ? contas.find((c) => `Fatura ${c.nome}` === e.descricao) : null;
      itens.push({
        chave: `${e.origem}:${e.data}:${e.descricao}`,
        transacaoId: null,
        data: e.data,
        descricao: e.descricao,
        valor: e.valor,
        tipo: e.tipo,
        origem: e.origem === "fatura" ? "fatura" : "fixa",
        conta: null,
        atrasado: false,
        href: cartao ? `/financas/contas/${cartao.id}/fatura` : "/financas/recorrentes",
      });
    }
  } catch {
    /* dado estranho: segue com os lançamentos */
  }

  itens.sort((a, b) => a.data.localeCompare(b.data) || (a.tipo === "receita" ? -1 : 1));
  const aEntrar = itens.filter((i) => i.tipo === "receita").reduce((s2, i) => s2 + i.valor, 0);
  const aSair = itens.filter((i) => i.tipo === "despesa").reduce((s2, i) => s2 + i.valor, 0);
  const saldoHoje = [...comuns.values()].reduce((s2, c) => s2 + (Number(c.saldo) || 0), 0);
  const r2 = (v: number) => Math.round(v * 100) / 100;
  return { itens, aEntrar: r2(aEntrar), aSair: r2(aSair), saldoHoje: r2(saldoHoje), saldoDepois: r2(saldoHoje + aEntrar - aSair), ate };
}
