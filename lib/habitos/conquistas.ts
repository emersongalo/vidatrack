// Etapa 214 — conquistas calculadas na hora do retrato local (nada no banco).
// Etapa 221 — lógica saiu da tela pra cá (com teste), a sequência passou
// a respeitar as pausas e entraram selos novos.
import { calcularMelhorStreak } from "@/lib/habitos/streak";
import { habitoDevidoNoDia, pausasDe } from "@/lib/habitos/pausa";
import { gastoDoMes } from "@/lib/financas/teto";

export type Conquista = { id: string; emoji: string; titulo: string; texto: string; atual: number; alvo: number };
export const CHAVE_CONQUISTAS_VISTAS = "vidatrack-conquistas-vistas";

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
function ultimoDiaDoMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return `${mes}-${String(new Date(Date.UTC(a, m, 0)).getUTCDate()).padStart(2, "0")}`;
}

/** Maior número de dias seguidos (nos últimos 120) em que todos os hábitos do dia foram feitos. */
function melhorSequenciaDiasPerfeitos(habitos: any[], feito: (id: string, dia: string) => boolean, hoje: string): number {
  let melhor = 0;
  let atual = 0;
  for (let i = 120; i >= 1; i--) {
    const dia = somarDias(hoje, -i);
    const devidos = habitos.filter((h) => String(h.criado_em ?? "").slice(0, 10) <= dia && habitoDevidoNoDia(h, dia));
    if (!devidos.length) continue; // dia sem hábito não quebra nem conta
    if (devidos.every((h) => feito(h.id, dia))) melhor = Math.max(melhor, ++atual);
    else atual = 0;
  }
  return melhor;
}

export function calcularConquistas(s: any, hoje: string): Conquista[] {
  const meuId = s?.perfil?.id;
  const positivos: any[] = (s?.habitos ?? []).filter((h: any) => !h.eh_negativo);
  const idsPositivos = new Set(positivos.map((h) => h.id));
  const checkinsMeus: any[] = (s?.habitoCheckins ?? []).filter(
    (c: any) => idsPositivos.has(c.habito_id) && (!c.usuario_id || c.usuario_id === meuId)
  );

  const porHabito = new Map<string, string[]>();
  const qtd = new Map<string, number>();
  for (const c of checkinsMeus) {
    const l = porHabito.get(c.habito_id) ?? [];
    l.push(c.data);
    porHabito.set(c.habito_id, l);
    const k = `${c.habito_id}|${c.data}`;
    qtd.set(k, (qtd.get(k) ?? 0) + Number(c.quantidade ?? 1));
  }
  const melhorSequencia = Math.max(
    0,
    ...positivos.map((h) => calcularMelhorStreak(porHabito.get(h.id) ?? [], pausasDe(h)))
  );
  const metaDe = new Map(positivos.map((h) => [h.id, Math.max(1, Number(h.meta_diaria) || 1)]));
  const feito = (id: string, dia: string) => (qtd.get(`${id}|${dia}`) ?? 0) >= (metaDe.get(id) ?? 1);
  const diasPerfeitosSeguidos = positivos.length ? melhorSequenciaDiasPerfeitos(positivos, feito, hoje) : 0;

  const diasAtivos = new Set(checkinsMeus.map((c) => c.data)).size;
  const totalCheckins = checkinsMeus.length;
  const tarefasFeitas = (s?.conclusoesTarefas ?? []).length + (s?.tarefas ?? []).filter((t: any) => t.concluida).length;

  const contas: any[] = s?.financas?.contas ?? [];
  const transacoes: any[] = s?.financas?.transacoes ?? [];
  const mesAtual = hoje.slice(0, 7);
  const saldoPorMes = new Map<string, number>();
  for (const t of transacoes) {
    if (t.transferencia_grupo) continue;
    const mes = String(t.data).slice(0, 7);
    if (mes >= mesAtual) continue;
    saldoPorMes.set(mes, (saldoPorMes.get(mes) ?? 0) + (t.tipo === "receita" ? Number(t.valor) : -Number(t.valor)));
  }
  const mesesNoAzul = [...saldoPorMes.values()].filter((v) => v > 0).length;

  // Etapa 221 — meses fechados dentro do teto de gastos atual
  const teto = Number(s?.perfil?.teto_mensal) || 0;
  const mesesNoTeto = teto
    ? [...saldoPorMes.keys()].filter((mes) => gastoDoMes(contas, transacoes, ultimoDiaDoMes(mes)) <= teto).length
    : 0;

  const lancamentos = transacoes.length;
  const metasConcluidas =
    (s?.financas?.metas ?? []).filter((m: any) => m.concluida).length +
    (s?.metasLongas ?? []).filter((m: any) => Number(m.alvo) > 0 && Number(m.progresso) >= Number(m.alvo)).length;
  const diasDiario = (s?.diario ?? []).length;

  return [
    { id: "primeiro-habito", emoji: "🌱", titulo: "Primeiro passo", texto: "Criou seu primeiro hábito", atual: positivos.length, alvo: 1 },
    { id: "seq7", emoji: "🔥", titulo: "Uma semana firme", texto: "7 dias seguidos num hábito", atual: melhorSequencia, alvo: 7 },
    { id: "seq30", emoji: "💪", titulo: "Um mês inteiro", texto: "30 dias seguidos num hábito", atual: melhorSequencia, alvo: 30 },
    { id: "seq100", emoji: "🏆", titulo: "Centenário", texto: "100 dias seguidos num hábito", atual: melhorSequencia, alvo: 100 },
    { id: "perfeita7", emoji: "⭐", titulo: "Semana perfeita", texto: "7 dias seguidos fazendo todos os hábitos", atual: diasPerfeitosSeguidos, alvo: 7 },
    { id: "check50", emoji: "✅", titulo: "50 check-ins", texto: "Marcou hábitos 50 vezes", atual: totalCheckins, alvo: 50 },
    { id: "check500", emoji: "🌟", titulo: "500 check-ins", texto: "Marcou hábitos 500 vezes", atual: totalCheckins, alvo: 500 },
    { id: "dias30", emoji: "📅", titulo: "Presença", texto: "30 dias diferentes usando os hábitos", atual: diasAtivos, alvo: 30 },
    { id: "diario7", emoji: "📔", titulo: "Querido diário", texto: "Registrou 7 dias no diário", atual: diasDiario, alvo: 7 },
    { id: "tarefas10", emoji: "📝", titulo: "Mão na massa", texto: "Concluiu 10 tarefas", atual: tarefasFeitas, alvo: 10 },
    { id: "tarefas100", emoji: "🚀", titulo: "Produtivo", texto: "Concluiu 100 tarefas", atual: tarefasFeitas, alvo: 100 },
    { id: "lanc1", emoji: "💰", titulo: "Controle começou", texto: "Fez o primeiro lançamento", atual: lancamentos, alvo: 1 },
    { id: "lanc100", emoji: "📊", titulo: "Organizado", texto: "100 lançamentos registrados", atual: lancamentos, alvo: 100 },
    { id: "azul1", emoji: "💙", titulo: "Mês no azul", texto: "Fechou um mês gastando menos do que entrou", atual: mesesNoAzul, alvo: 1 },
    { id: "azul3", emoji: "🏅", titulo: "Trimestre no azul", texto: "3 meses no azul", atual: mesesNoAzul, alvo: 3 },
    { id: "teto1", emoji: "🎯", titulo: "Dentro do teto", texto: "Fechou um mês sem passar do teto de gastos", atual: mesesNoTeto, alvo: 1 },
    { id: "meta1", emoji: "🥇", titulo: "Meta batida", texto: "Concluiu uma meta (de economia ou do ano)", atual: metasConcluidas, alvo: 1 },
  ];
}

export const ganhou = (c: Conquista) => c.atual >= c.alvo;

/**
 * Quais conquistas são novas desde a última vez. Na primeira vez
 * (nada salvo) não anuncia nada — só guarda o que já tinha, pra não
 * aparecer uma enxurrada de "nova conquista" pra quem já usa há tempo.
 */
export function conquistasNovas(lista: Conquista[], vistasBruto: string | null): { novas: Conquista[]; vistas: string[] } {
  const ganhas = lista.filter(ganhou).map((c) => c.id);
  let vistas: string[] | null = null;
  try {
    const v = vistasBruto ? JSON.parse(vistasBruto) : null;
    if (Array.isArray(v)) vistas = v.filter((x) => typeof x === "string");
  } catch {
    vistas = null;
  }
  if (!vistas) return { novas: [], vistas: ganhas };
  const jaVistas = new Set(vistas);
  return { novas: lista.filter((c) => ganhou(c) && !jaVistas.has(c.id)), vistas: [...new Set([...vistas, ...ganhas])] };
}
