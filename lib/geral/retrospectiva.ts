// Etapa 215 — retrospectiva do ano, calculada do retrato local
import type { SnapshotOffline } from "@/lib/offline/snapshot";

export type Retrospectiva = {
  ano: number;
  ateData: string;
  habitos: {
    diasComHabito: number;
    totalMarcacoes: number;
    maisFeito: { nome: string; dias: number } | null;
    maiorSequencia: { nome: string; dias: number } | null;
  };
  tarefasConcluidas: number;
  financas: {
    receitas: number;
    despesas: number;
    economia: number;
    categoriaTop: { nome: string; valor: number } | null;
    melhorMes: { mes: string; economia: number } | null;
    maiorGasto: { descricao: string; valor: number } | null;
    lancamentos: number;
  };
  metasConcluidas: number;
  humor: { media: number | null; diasRegistrados: number; diasOtimos: number };
};

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

const NOMES_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function calcularRetrospectiva(snapshot: SnapshotOffline, ano: number, hojeISO: string): Retrospectiva {
  const inicio = `${ano}-01-01`;
  const fimAno = `${ano}-12-31`;
  const ate = hojeISO < fimAno ? hojeISO : fimAno;
  const noAno = (d: string) => d >= inicio && d <= ate;
  const meuId = snapshot.perfil.id;

  // --- Hábitos (só positivos, só os próprios check-ins) ---
  const positivos = new Map((snapshot.habitos as any[]).filter((h) => !h.eh_negativo).map((h) => [h.id, h]));
  const datasPorHabito = new Map<string, Set<string>>();
  const diasComHabito = new Set<string>();
  let totalMarcacoes = 0;
  for (const c of snapshot.habitoCheckins as any[]) {
    if (c.usuario_id && c.usuario_id !== meuId) continue;
    if (!positivos.has(c.habito_id) || !noAno(c.data)) continue;
    if (!datasPorHabito.has(c.habito_id)) datasPorHabito.set(c.habito_id, new Set());
    const s = datasPorHabito.get(c.habito_id)!;
    if (!s.has(c.data)) totalMarcacoes++;
    s.add(c.data);
    diasComHabito.add(c.data);
  }
  let maisFeito: { nome: string; dias: number } | null = null;
  let maiorSequencia: { nome: string; dias: number } | null = null;
  for (const [id, datas] of datasPorHabito) {
    const nome = positivos.get(id)!.nome;
    if (!maisFeito || datas.size > maisFeito.dias) maisFeito = { nome, dias: datas.size };
    let melhor = 0;
    let atual = 0;
    let anterior: string | null = null;
    for (const d of [...datas].sort()) {
      atual = anterior && somarDias(anterior, 1) === d ? atual + 1 : 1;
      melhor = Math.max(melhor, atual);
      anterior = d;
    }
    if (!maiorSequencia || melhor > maiorSequencia.dias) maiorSequencia = { nome, dias: melhor };
  }

  // --- Tarefas ---
  const tarefasConcluidas = snapshot.conclusoesTarefas.filter((c) => noAno(c.data)).length;

  // --- Finanças (sem transferências, sem agendado futuro) ---
  const nomesCat = new Map((snapshot.financas.categorias as any[]).map((c) => [c.id, c.nome]));
  let receitas = 0;
  let despesas = 0;
  let lancamentos = 0;
  const porCategoria = new Map<string, number>();
  const porMes = new Map<string, number>();
  let maiorGasto: { descricao: string; valor: number } | null = null;
  const contasComuns = new Set((snapshot.financas.contas as any[]).filter((c) => c.tipo !== "investimento").map((c) => c.id));
  for (const t of snapshot.financas.transacoes as any[]) {
    if (!noAno(t.data) || t.transferencia_grupo || !contasComuns.has(t.conta_id)) continue;
    const v = Number(t.valor);
    lancamentos++;
    const mes = t.data.slice(0, 7);
    if (t.tipo === "receita") {
      receitas += v;
      porMes.set(mes, (porMes.get(mes) ?? 0) + v);
    } else {
      despesas += v;
      porMes.set(mes, (porMes.get(mes) ?? 0) - v);
      const cat = t.categoria_id ? nomesCat.get(t.categoria_id) ?? "Sem categoria" : "Sem categoria";
      porCategoria.set(cat, (porCategoria.get(cat) ?? 0) + v);
      if (!maiorGasto || v > maiorGasto.valor) maiorGasto = { descricao: t.descricao || cat, valor: v };
    }
  }
  let categoriaTop: { nome: string; valor: number } | null = null;
  for (const [nome, valor] of porCategoria) if (!categoriaTop || valor > categoriaTop.valor) categoriaTop = { nome, valor };
  let melhorMes: { mes: string; economia: number } | null = null;
  for (const [mes, economia] of porMes) {
    if (!melhorMes || economia > melhorMes.economia) melhorMes = { mes: NOMES_MES[Number(mes.slice(5, 7)) - 1], economia };
  }
  const r2 = (n: number) => Math.round(n * 100) / 100;

  // --- Humor ---
  const diario = (snapshot.diario ?? []).filter((d) => noAno(d.data));
  const media = diario.length ? Math.round((diario.reduce((s, d) => s + d.humor, 0) / diario.length) * 10) / 10 : null;

  return {
    ano,
    ateData: ate,
    habitos: { diasComHabito: diasComHabito.size, totalMarcacoes, maisFeito, maiorSequencia },
    tarefasConcluidas,
    financas: {
      receitas: r2(receitas),
      despesas: r2(despesas),
      economia: r2(receitas - despesas),
      categoriaTop: categoriaTop ? { nome: categoriaTop.nome, valor: r2(categoriaTop.valor) } : null,
      melhorMes: melhorMes && melhorMes.economia > 0 ? { mes: melhorMes.mes, economia: r2(melhorMes.economia) } : null,
      maiorGasto: maiorGasto ? { descricao: maiorGasto.descricao, valor: r2(maiorGasto.valor) } : null,
      lancamentos,
    },
    metasConcluidas: (snapshot.financas.metas as any[]).filter((m) => m.concluida).length,
    humor: { media, diasRegistrados: diario.length, diasOtimos: diario.filter((d) => d.humor === 5).length },
  };
}
