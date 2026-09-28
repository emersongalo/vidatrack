import { diaBateComFrequencia } from "@/lib/agenda/dias";
import { tarefaApareceNoDia, tarefaAtrasada } from "@/lib/agenda/recorrencia";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { preverFimDoMes } from "@/lib/financas/previsao";

/**
 * Etapa 195 — TUDO que os widgets de tela inicial mostram sai daqui.
 * É uma função pura (sem banco, sem window), usada em dois lugares:
 *  - no app aberto (SincronizadorWidgets), a partir do retrato local,
 *    pra atualizar os widgets na hora que algo muda;
 *  - no servidor (/api/widget/dados), que o próprio Android chama de
 *    30 em 30 min — assim os widgets ficam certos mesmo sem abrir o app
 *    (virada do dia, conta que venceu, etc.).
 * Uma regra só = widget nunca mostra coisa diferente do app.
 */
export type DadosWidgets = {
  versao: 1;
  /** dia (YYYY-MM-DD) a que esses dados se referem */
  data: string;
  geradoEm: string;
  hoje: { feitos: number; total: number };
  habitos: { id: string; nome: string; feito: boolean; atual: number; meta: number }[];
  tarefas: { titulo: string; quando: string; atrasada: boolean }[];
  sequencias: { nome: string; atual: number; recorde: number; negativo: boolean }[];
  semana: { rotulo: string; pct: number | null; ehHoje: boolean }[];
  saldoTexto: string | null;
  /** Etapa 215 — widget "Previsão do mês" */
  previstoTexto: string | null;
  previstoNegativo: boolean;
  gastoMesTexto: string | null;
  porDiaTexto: string | null;
  contas: string[];
  /** só o app calcula (depende do que a pessoa dispensou no aparelho) */
  pendencias: number | null;
};

export type EntradaWidgets = {
  hoje: string;
  habitos: any[];
  checkins: { habito_id: string; data: string; quantidade?: number | null }[];
  tarefas: any[];
  conclusoesTarefas: { tarefa_id: string; data: string }[];
  contas: { id?: string; nome?: string; tipo: string; saldo: number | string; dia_fechamento?: number | null; dia_vencimento?: number | null }[];
  recorrencias: { id?: string; conta_id?: string; tipo: string; valor: number | string; dia_mes: number; data_fim: string | null; data_inicio?: string | null; ativo: boolean; descricao: string | null }[];
  /** Etapa 215 — pra previsão do mês e gasto do mês (opcional) */
  transacoes?: { id?: string; conta_id: string; tipo: string; valor: number | string; data: string; descricao?: string | null; pago_em?: string | null; recorrencia_id?: string | null; transferencia_grupo?: string | null }[];
  pendencias?: number | null;
};

const LETRAS_DIA = ["D", "S", "T", "Q", "Q", "S", "S"];
const NOMES_DIA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

function diaDaSemana(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

function ultimoDiaDoMes(ano: number, mes: number) {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function streakAtual(datas: Set<string>, hoje: string) {
  let cursor = datas.has(hoje) ? hoje : somarDias(hoje, -1);
  let n = 0;
  while (datas.has(cursor)) {
    n++;
    cursor = somarDias(cursor, -1);
  }
  return n;
}

function melhorStreak(datas: Set<string>) {
  const ordenadas = [...datas].sort();
  let melhor = 0;
  let atual = 0;
  let anterior: string | null = null;
  for (const d of ordenadas) {
    atual = anterior && somarDias(anterior, 1) === d ? atual + 1 : 1;
    melhor = Math.max(melhor, atual);
    anterior = d;
  }
  return melhor;
}

function diasEntre(aISO: string, bISO: string) {
  const [a1, m1, d1] = aISO.split("-").map(Number);
  const [a2, m2, d2] = bISO.split("-").map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
}

export function montarDadosWidgets(e: EntradaWidgets): DadosWidgets {
  const { hoje } = e;
  const habitos = [...e.habitos].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  // quantidade por hábito+dia
  const qtd = new Map<string, number>();
  const datasPorHabito = new Map<string, Set<string>>();
  for (const c of e.checkins) {
    const q = Number(c.quantidade ?? 1);
    qtd.set(`${c.habito_id}|${c.data}`, (qtd.get(`${c.habito_id}|${c.data}`) ?? 0) + q);
    if (!datasPorHabito.has(c.habito_id)) datasPorHabito.set(c.habito_id, new Set());
    datasPorHabito.get(c.habito_id)!.add(c.data);
  }
  const feitoNoDia = (h: any, dia: string) => (qtd.get(`${h.id}|${dia}`) ?? 0) >= (h.meta_diaria ?? 1);

  // --- Hoje (mesma conta da tela Hoje: todos os hábitos do dia) ---
  const doDia = habitos.filter((h) => diaBateComFrequencia(h.frequencia, h.dias_semana ?? [], hoje));
  const hojeResumo = { feitos: doDia.filter((h) => feitoNoDia(h, hoje)).length, total: doDia.length };

  // --- Lista pra marcar no widget (só positivos: marcar um hábito
  // negativo seria registrar uma recaída, não faz sentido num toque) ---
  const listaHabitos = doDia
    .filter((h) => !h.eh_negativo)
    .slice(0, 5)
    .map((h) => ({
      id: h.id,
      nome: h.nome,
      feito: feitoNoDia(h, hoje),
      atual: qtd.get(`${h.id}|${hoje}`) ?? 0,
      meta: h.meta_diaria ?? 1,
    }));

  // --- Sequências (as 3 maiores atuais) ---
  const sequencias = habitos
    .map((h) => {
      const datas = datasPorHabito.get(h.id) ?? new Set<string>();
      if (h.eh_negativo) {
        const lapsos = [...datas].filter((d) => d <= hoje).sort();
        const base = lapsos.at(-1) ?? String(h.criado_em ?? hoje).slice(0, 10);
        return { nome: h.nome, atual: Math.max(0, diasEntre(base, hoje)), recorde: 0, negativo: true };
      }
      return { nome: h.nome, atual: streakAtual(datas, hoje), recorde: melhorStreak(datas), negativo: false };
    })
    .filter((s) => s.atual > 0 || s.recorde > 0)
    .sort((a, b) => b.atual - a.atual || b.recorde - a.recorde)
    .slice(0, 3);

  // --- Semana (7 dias terminando hoje, só positivos) ---
  const semana = Array.from({ length: 7 }, (_, i) => {
    const dia = somarDias(hoje, i - 6);
    const devidos = habitos.filter((h) => !h.eh_negativo && diaBateComFrequencia(h.frequencia, h.dias_semana ?? [], dia));
    const feitos = devidos.filter((h) => feitoNoDia(h, dia)).length;
    return {
      rotulo: LETRAS_DIA[diaDaSemana(dia)],
      pct: devidos.length ? Math.round((feitos / devidos.length) * 100) : null,
      ehHoje: dia === hoje,
    };
  });

  // --- Próximas tarefas (atrasadas, hoje e próximos 7 dias) ---
  const feitasHoje = new Set(e.conclusoesTarefas.filter((c) => c.data === hoje).map((c) => c.tarefa_id));
  type Linha = { titulo: string; quando: string; atrasada: boolean; chave: string };
  const linhas: Linha[] = [];
  const jaListadas = new Set<string>();

  const atrasadas = e.tarefas
    .filter((t) => tarefaAtrasada(t, hoje))
    .sort((a, b) => String(a.data).localeCompare(String(b.data)) || (b.prioridade ?? 0) - (a.prioridade ?? 0));
  for (const t of atrasadas) {
    linhas.push({ titulo: t.titulo, quando: "Atrasada", atrasada: true, chave: `${t.data}|0|${t.titulo}` });
    jaListadas.add(t.id);
  }
  for (let i = 0; i <= 7 && linhas.length < 5; i++) {
    const dia = somarDias(hoje, i);
    const doDiaT = e.tarefas
      .filter((t) => !jaListadas.has(t.id) && tarefaApareceNoDia(t, dia))
      .filter((t) => (t.repetir === "nenhuma" ? !t.concluida : i > 0 || !feitasHoje.has(t.id)))
      .sort(
        (a, b) =>
          (b.prioridade ?? 0) - (a.prioridade ?? 0) ||
          String(a.horario_lembrete ?? "99").localeCompare(String(b.horario_lembrete ?? "99"))
      );
    for (const t of doDiaT) {
      const [, m, d] = dia.split("-");
      const rotuloDia = i === 0 ? "Hoje" : i === 1 ? "Amanhã" : `${NOMES_DIA[diaDaSemana(dia)]} ${d}/${m}`;
      const hora = t.horario_lembrete ? ` ${String(t.horario_lembrete).slice(0, 5)}` : "";
      linhas.push({ titulo: t.titulo, quando: rotuloDia + hora, atrasada: false, chave: dia });
      jaListadas.add(t.id);
    }
  }

  // --- Saldo (mesma conta do Painel: tudo menos investimento) ---
  const contasComuns = e.contas.filter((c) => c.tipo !== "investimento" && c.tipo !== "cartao");
  const saldoTexto = contasComuns.length
    ? formatarMoeda(contasComuns.reduce((s, c) => s + Number(c.saldo), 0))
    : null;

  // --- Etapa 215: previsão até o fim do mês + gasto do mês ---
  let previstoTexto: string | null = null;
  let previstoNegativo = false;
  let gastoMesTexto: string | null = null;
  let porDiaTexto: string | null = null;
  if (contasComuns.length && e.transacoes) {
    const p = preverFimDoMes({
      contas: e.contas.filter((c) => c.id) as any,
      transacoes: e.transacoes,
      recorrencias: e.recorrencias.filter((r) => r.id && r.conta_id) as any,
      hojeISO: hoje,
    });
    previstoTexto = formatarMoeda(Math.abs(p.sobra));
    previstoNegativo = p.sobra < 0;
    porDiaTexto = p.porDia !== null ? formatarMoeda(p.porDia) : null;
    const investimento = new Set(e.contas.filter((c) => c.tipo === "investimento").map((c) => c.id));
    const mes = hoje.slice(0, 7);
    const gasto = e.transacoes
      .filter((t) => t.tipo === "despesa" && !t.transferencia_grupo && !investimento.has(t.conta_id) && t.data.startsWith(mes) && t.data <= hoje)
      .reduce((s, t) => s + Number(t.valor), 0);
    gastoMesTexto = formatarMoeda(gasto);
  }

  // --- Próximas contas a pagar (despesas recorrentes) ---
  const [anoH, mesH, diaH] = hoje.split("-").map(Number);
  const contas = e.recorrencias
    .filter((r) => r.ativo && r.tipo === "despesa" && r.dia_mes)
    .map((r) => {
      let ano = anoH;
      let mes = mesH;
      let dia = Math.min(r.dia_mes, ultimoDiaDoMes(ano, mes));
      const isoDe = (a: number, m: number, d: number) => `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      // Etapa 205 — pula o mês se a recorrência ainda não tinha começado
      if (dia < diaH || (r.data_inicio && isoDe(ano, mes, dia) < r.data_inicio)) {
        mes += 1;
        if (mes > 12) {
          mes = 1;
          ano += 1;
        }
        dia = Math.min(r.dia_mes, ultimoDiaDoMes(ano, mes));
      }
      const quando = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      return { r, quando };
    })
    .filter(({ r, quando }) => (!r.data_fim || quando <= r.data_fim) && (!r.data_inicio || quando >= r.data_inicio))
    .sort((a, b) => a.quando.localeCompare(b.quando))
    .slice(0, 3)
    .map(({ r, quando }) => {
      const dif = diasEntre(hoje, quando);
      const rotulo = dif === 0 ? "hoje" : dif === 1 ? "amanhã" : `dia ${Number(quando.slice(8))}`;
      return `${r.descricao || "Conta"} · ${rotulo} · ${formatarMoeda(Number(r.valor))}`;
    });

  return {
    versao: 1,
    data: hoje,
    geradoEm: new Date().toISOString(),
    hoje: hojeResumo,
    habitos: listaHabitos,
    tarefas: linhas.slice(0, 5).map(({ titulo, quando, atrasada }) => ({ titulo, quando, atrasada })),
    sequencias,
    semana,
    saldoTexto,
    previstoTexto,
    previstoNegativo,
    gastoMesTexto,
    porDiaTexto,
    contas,
    pendencias: e.pendencias ?? null,
  };
}
