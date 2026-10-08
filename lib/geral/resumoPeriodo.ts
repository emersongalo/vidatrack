// Etapa 276 — números de um período (um dia ou um mês) a partir do
// retrato local. Usado pela tela "Resumo do dia" e pela "Retrospectiva
// do mês". Função pura.
import type { SnapshotOffline } from "@/lib/offline/snapshot";
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";

export type ResumoPeriodo = {
  inicio: string;
  fim: string;
  habitos: {
    devidos: number;
    feitos: number;
    pct: number | null;
    /** por hábito (pra listas) */
    lista: { id: string; nome: string; icone: string; cor: string; devidos: number; feitos: number }[];
    maisFeito: { nome: string; dias: number } | null;
    maiorSequencia: { nome: string; dias: number } | null;
  };
  tarefas: { concluidas: number; titulos: string[] };
  financas: {
    receitas: number;
    despesas: number;
    saldo: number;
    gastos: { id: string; descricao: string; valor: number; categoria: string | null; icone: string | null }[];
    categoriaTop: { nome: string; valor: number } | null;
    maiorGasto: { descricao: string; valor: number } | null;
  };
  humor: { media: number | null; dias: number };
};

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
const r2 = (n: number) => Math.round(n * 100) / 100;

export function ultimoDiaDoMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return `${mes}-${String(new Date(Date.UTC(a, m, 0)).getUTCDate()).padStart(2, "0")}`;
}

export function mesAnterior(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m - 2, 1)).toISOString().slice(0, 7);
}

export function resumoDoPeriodo(snapshot: SnapshotOffline, inicio: string, fim: string, hoje: string): ResumoPeriodo {
  const ate = fim < hoje ? fim : hoje;
  const meuId = snapshot.perfil.id;
  const dentro = (d: string) => d >= inicio && d <= ate;

  // --- hábitos (positivos, só os meus check-ins) ---
  const qtd = new Map<string, number>();
  for (const c of snapshot.habitoCheckins as any[]) {
    if (c.usuario_id && c.usuario_id !== meuId) continue;
    if (!dentro(c.data)) continue;
    const k = `${c.habito_id}|${c.data}`;
    qtd.set(k, (qtd.get(k) ?? 0) + Number(c.quantidade ?? 1));
  }
  let devidos = 0;
  let feitos = 0;
  const lista: ResumoPeriodo["habitos"]["lista"] = [];
  let maisFeito: { nome: string; dias: number } | null = null;
  let maiorSequencia: { nome: string; dias: number } | null = null;
  for (const h of snapshot.habitos as any[]) {
    if (h.eh_negativo) continue;
    const meta = Math.max(1, Number(h.meta_diaria) || 1);
    const criado = String(h.criado_em ?? "").slice(0, 10) || "0000-00-00";
    let dv = 0;
    let ft = 0;
    let seq = 0;
    let melhorSeq = 0;
    for (let d = inicio, n = 0; d <= ate && n < 400; d = somarDias(d, 1), n++) {
      const feitoNoDia = (qtd.get(`${h.id}|${d}`) ?? 0) >= meta;
      if (feitoNoDia) {
        ft++;
        seq++;
        melhorSeq = Math.max(melhorSeq, seq);
      }
      if (d < criado || h.frequencia === "semanal" || !habitoDevidoNoDia(h, d)) continue;
      dv++;
      if (!feitoNoDia) seq = 0;
    }
    if (dv === 0 && ft === 0) continue;
    if (dv) {
      devidos += dv;
      feitos += Math.min(ft, dv);
    }
    lista.push({ id: h.id, nome: h.nome, icone: h.icone, cor: h.cor, devidos: dv, feitos: ft });
    if (ft > 0 && (!maisFeito || ft > maisFeito.dias)) maisFeito = { nome: h.nome, dias: ft };
    if (melhorSeq > 1 && (!maiorSequencia || melhorSeq > maiorSequencia.dias)) maiorSequencia = { nome: h.nome, dias: melhorSeq };
  }

  // --- tarefas ---
  const nomeTarefa = new Map((snapshot.tarefas as any[]).map((t) => [t.id, t.titulo as string]));
  const titulos: string[] = [];
  for (const c of snapshot.conclusoesTarefas) if (dentro(c.data)) titulos.push(nomeTarefa.get(c.tarefa_id) ?? "Tarefa");
  for (const t of snapshot.tarefas as any[]) if (t.repetir === "nenhuma" && t.concluida && t.data && dentro(t.data)) titulos.push(t.titulo);

  // --- finanças: só o que já aconteceu, sem transferência, sem investimento ---
  const categorias = new Map((snapshot.financas.categorias as any[]).map((c) => [c.id, c]));
  const contasComuns = new Set((snapshot.financas.contas as any[]).filter((c) => c.tipo !== "investimento").map((c) => c.id));
  let receitas = 0;
  let despesas = 0;
  const gastos: ResumoPeriodo["financas"]["gastos"] = [];
  const porCategoria = new Map<string, number>();
  for (const t of snapshot.financas.transacoes as any[]) {
    if (!dentro(t.data) || t.transferencia_grupo || !contasComuns.has(t.conta_id)) continue;
    const v = Number(t.valor);
    const cat = t.categoria_id ? categorias.get(t.categoria_id) : null;
    if (t.tipo === "receita") receitas += v;
    else {
      despesas += v;
      gastos.push({ id: t.id, descricao: t.descricao || cat?.nome || "Gasto", valor: r2(v), categoria: cat?.nome ?? null, icone: cat?.icone ?? null });
      const nome = cat?.nome ?? "Sem categoria";
      porCategoria.set(nome, (porCategoria.get(nome) ?? 0) + v);
    }
  }
  gastos.sort((a, b) => b.valor - a.valor);
  let categoriaTop: { nome: string; valor: number } | null = null;
  for (const [nome, valor] of porCategoria) if (!categoriaTop || valor > categoriaTop.valor) categoriaTop = { nome, valor: r2(valor) };

  // --- humor ---
  const diario = (snapshot.diario ?? []).filter((d) => dentro(d.data));
  const media = diario.length ? Math.round((diario.reduce((s, d) => s + d.humor, 0) / diario.length) * 10) / 10 : null;

  return {
    inicio,
    fim: ate,
    habitos: {
      devidos,
      feitos,
      pct: devidos ? Math.min(100, Math.round((feitos / devidos) * 100)) : null,
      lista: lista.sort((a, b) => b.feitos - a.feitos),
      maisFeito,
      maiorSequencia,
    },
    tarefas: { concluidas: titulos.length, titulos },
    financas: {
      receitas: r2(receitas),
      despesas: r2(despesas),
      saldo: r2(receitas - despesas),
      gastos,
      categoriaTop,
      maiorGasto: gastos[0] ? { descricao: gastos[0].descricao, valor: gastos[0].valor } : null,
    },
    humor: { media, dias: diario.length },
  };
}
