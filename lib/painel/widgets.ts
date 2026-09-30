// Etapa 235 — contas dos "widgets" do Início. Tudo calculado do retrato
// local (nada novo no banco). Regras iguais às do resto do app: sem
// transferência, sem conta de investimento e sem lançamento futuro que
// ainda não foi pago.
import { calcularStreak } from "@/lib/habitos/streak";
import { habitoDevidoNoDia, pausasDe } from "@/lib/habitos/pausa";
import { ehContaComum } from "@/lib/financas/previsao";

type Conta = { id: string; tipo: string; saldo?: number | string };
type Transacao = {
  conta_id: string;
  tipo: string;
  valor: number | string;
  data: string;
  categoria_id?: string | null;
  transferencia_grupo?: string | null;
  pago_em?: string | null;
};

export function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
const r2 = (v: number) => Math.round(v * 100) / 100;

function contaNoGasto(t: Transacao, investimento: Set<string>, hoje: string) {
  return t.tipo === "despesa" && !t.transferencia_grupo && !investimento.has(t.conta_id) && (t.data <= hoje || !!t.pago_em);
}

/** Saldo das contas comuns + receitas e despesas do mês */
export function resumoSaldo(contas: Conta[], transacoes: Transacao[], hoje: string) {
  const investimento = new Set(contas.filter((c) => c.tipo === "investimento").map((c) => c.id));
  const mes = hoje.slice(0, 7);
  let receitas = 0;
  let despesas = 0;
  for (const t of transacoes) {
    if (!t.data.startsWith(mes) || t.transferencia_grupo || investimento.has(t.conta_id)) continue;
    if (t.data > hoje && !t.pago_em) continue;
    if (t.tipo === "receita") receitas += Number(t.valor);
    else if (t.tipo === "despesa") despesas += Number(t.valor);
  }
  const saldo = contas.filter(ehContaComum).reduce((s, c) => s + Number(c.saldo ?? 0), 0);
  return { saldo: r2(saldo), receitas: r2(receitas), despesas: r2(despesas) };
}

/** Gasto de cada um dos últimos 7 dias (mais antigo → hoje) e comparação com os 7 anteriores */
export function gastosDaSemana(contas: Conta[], transacoes: Transacao[], hoje: string) {
  const investimento = new Set(contas.filter((c) => c.tipo === "investimento").map((c) => c.id));
  const inicio = somarDias(hoje, -6);
  const inicioAnterior = somarDias(hoje, -13);
  const porDia = new Map<string, number>();
  let anterior = 0;
  for (const t of transacoes) {
    if (!contaNoGasto(t, investimento, hoje)) continue;
    if (t.data >= inicio && t.data <= hoje) porDia.set(t.data, (porDia.get(t.data) ?? 0) + Number(t.valor));
    else if (t.data >= inicioAnterior && t.data < inicio) anterior += Number(t.valor);
  }
  const dias = Array.from({ length: 7 }, (_, i) => {
    const dia = somarDias(inicio, i);
    return { dia, total: r2(porDia.get(dia) ?? 0) };
  });
  const total = r2(dias.reduce((s, d) => s + d.total, 0));
  const variacaoPct = anterior > 0 ? Math.round(((total - anterior) / anterior) * 100) : null;
  return { dias, total, anterior: r2(anterior), variacaoPct };
}

/** Categorias com mais gasto no mês */
export function categoriasDoMes(
  contas: Conta[],
  transacoes: Transacao[],
  categorias: { id: string; nome: string; icone?: string | null; cor?: string | null }[],
  hoje: string,
  quantas = 4
) {
  const investimento = new Set(contas.filter((c) => c.tipo === "investimento").map((c) => c.id));
  const mes = hoje.slice(0, 7);
  const soma = new Map<string, number>();
  let total = 0;
  for (const t of transacoes) {
    if (!t.data.startsWith(mes) || !contaNoGasto(t, investimento, hoje)) continue;
    const k = t.categoria_id ?? "sem";
    soma.set(k, (soma.get(k) ?? 0) + Number(t.valor));
    total += Number(t.valor);
  }
  const mapa = new Map(categorias.map((c) => [c.id, c]));
  const lista = [...soma.entries()]
    .map(([id, valor]) => ({
      id,
      nome: id === "sem" ? "Sem categoria" : mapa.get(id)?.nome ?? "Categoria",
      icone: mapa.get(id)?.icone ?? null,
      cor: mapa.get(id)?.cor ?? "neutro",
      valor: r2(valor),
      pct: total > 0 ? Math.round((valor / total) * 100) : 0,
    }))
    .sort((a, b) => b.valor - a.valor);
  return { total: r2(total), itens: lista.slice(0, quantas) };
}

type Habito = { id: string; nome: string; icone?: string; cor?: string; meta_diaria?: number | null; eh_negativo?: boolean; frequencia: string; dias_semana?: number[] | null; pausas?: unknown };
type Checkin = { habito_id: string; data: string; quantidade?: number | null };

function diasFeitos(h: Habito, checkins: Checkin[]) {
  const meta = Math.max(1, Number(h.meta_diaria) || 1);
  const soma = new Map<string, number>();
  for (const c of checkins) if (c.habito_id === h.id) soma.set(c.data, (soma.get(c.data) ?? 0) + Number(c.quantidade ?? 1));
  return [...soma.entries()].filter(([, q]) => q >= meta).map(([d]) => d);
}

/** Hábitos com as maiores sequências agora */
export function maioresSequencias(habitos: Habito[], checkins: Checkin[], hoje: string, quantos = 3) {
  return habitos
    .filter((h) => !h.eh_negativo)
    .map((h) => ({ id: h.id, nome: h.nome, icone: h.icone ?? "", cor: h.cor ?? "habito", sequencia: calcularStreak(diasFeitos(h, checkins), pausasDe(h), hoje) }))
    .filter((h) => h.sequencia > 0)
    .sort((a, b) => b.sequencia - a.sequencia)
    .slice(0, quantos);
}

/** % dos hábitos feitos em cada um dos últimos 7 dias */
export function semanaDosHabitos(habitos: Habito[], checkins: Checkin[], hoje: string) {
  const validos = habitos.filter((h) => !h.eh_negativo);
  const feitos = new Map(validos.map((h) => [h.id, new Set(diasFeitos(h, checkins))]));
  return Array.from({ length: 7 }, (_, i) => {
    const dia = somarDias(hoje, i - 6);
    const devidos = validos.filter((h) => habitoDevidoNoDia(h, dia));
    const ok = devidos.filter((h) => feitos.get(h.id)!.has(dia)).length;
    return { dia, feitos: ok, devidos: devidos.length, pct: devidos.length ? Math.round((ok / devidos.length) * 100) : null };
  });
}
