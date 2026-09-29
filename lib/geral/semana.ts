// Etapa 221 — relatório da semana (últimos 7 dias até hoje), pra ver
// no domingo e compartilhar como imagem. Tudo calculado do retrato local.
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

export type ResumoSemana = {
  inicio: string;
  fim: string;
  habitos: { devidos: number; feitos: number; pct: number; diasPerfeitos: number; melhor: { nome: string; feitos: number; devidos: number } | null };
  tarefas: number;
  gastos: { total: number; anterior: number; variacaoPct: number | null; maiorCategoria: { nome: string; valor: number } | null };
  humor: { media: number; dias: number } | null;
};

export function resumoDaSemana(s: any, hoje: string): ResumoSemana {
  const inicio = somarDias(hoje, -6);
  const habitos: any[] = (s?.habitos ?? []).filter((h: any) => !h.eh_negativo);
  const checkins: any[] = s?.habitoCheckins ?? [];

  const qtd = new Map<string, number>();
  for (const c of checkins) {
    if (c.data < inicio || c.data > hoje) continue;
    const k = `${c.habito_id}|${c.data}`;
    qtd.set(k, (qtd.get(k) ?? 0) + Number(c.quantidade ?? 1));
  }

  let devidos = 0;
  let feitos = 0;
  let diasPerfeitos = 0;
  const porHabito = new Map<string, { nome: string; feitos: number; devidos: number }>();
  for (let i = 0; i < 7; i++) {
    const dia = somarDias(inicio, i);
    let devDia = 0;
    let feitoDia = 0;
    for (const h of habitos) {
      if (String(h.criado_em ?? "").slice(0, 10) > dia) continue;
      if (!habitoDevidoNoDia(h, dia)) continue;
      const ok = (qtd.get(`${h.id}|${dia}`) ?? 0) >= Math.max(1, Number(h.meta_diaria) || 1);
      devDia++;
      if (ok) feitoDia++;
      const ph = porHabito.get(h.id) ?? { nome: h.nome, feitos: 0, devidos: 0 };
      ph.devidos++;
      if (ok) ph.feitos++;
      porHabito.set(h.id, ph);
    }
    devidos += devDia;
    feitos += feitoDia;
    if (devDia > 0 && feitoDia === devDia) diasPerfeitos++;
  }
  const melhor =
    [...porHabito.values()]
      .filter((h) => h.feitos > 0)
      .sort((a, b) => b.feitos / b.devidos - a.feitos / a.devidos || b.feitos - a.feitos)[0] ?? null;

  const conclusoes = (s?.conclusoesTarefas ?? []).filter((c: any) => c.data >= inicio && c.data <= hoje).length;
  const unicas = (s?.tarefas ?? []).filter(
    (t: any) => (t.repetir ?? "nenhuma") === "nenhuma" && t.concluida && t.data >= inicio && t.data <= hoje
  ).length;

  const contas: any[] = s?.financas?.contas ?? [];
  const investimento = new Set(contas.filter((c) => c.tipo === "investimento").map((c) => c.id));
  const transacoes: any[] = s?.financas?.transacoes ?? [];
  const nomeCategoria = new Map((s?.financas?.categorias ?? []).map((c: any) => [c.id, c.nome]));
  const ehGasto = (t: any) => t.tipo === "despesa" && !t.transferencia_grupo && !investimento.has(t.conta_id);
  let total = 0;
  let anterior = 0;
  const porCategoria = new Map<string, number>();
  const inicioAnterior = somarDias(inicio, -7);
  for (const t of transacoes) {
    if (!ehGasto(t)) continue;
    const v = Number(t.valor);
    if (t.data >= inicio && t.data <= hoje) {
      total += v;
      const k = t.categoria_id ?? "";
      porCategoria.set(k, (porCategoria.get(k) ?? 0) + v);
    } else if (t.data >= inicioAnterior && t.data < inicio) anterior += v;
  }
  const maior = [...porCategoria.entries()].filter(([k]) => k).sort((a, b) => b[1] - a[1])[0];

  const diario = (s?.diario ?? []).filter((d: any) => d.data >= inicio && d.data <= hoje && d.humor);
  const r2 = (v: number) => Math.round(v * 100) / 100;

  return {
    inicio,
    fim: hoje,
    habitos: { devidos, feitos, pct: devidos ? Math.round((feitos / devidos) * 100) : 0, diasPerfeitos, melhor },
    tarefas: conclusoes + unicas,
    gastos: {
      total: r2(total),
      anterior: r2(anterior),
      variacaoPct: anterior > 0 ? Math.round(((total - anterior) / anterior) * 100) : null,
      maiorCategoria: maior ? { nome: String(nomeCategoria.get(maior[0]) ?? "Outros"), valor: r2(maior[1]) } : null,
    },
    humor: diario.length ? { media: Math.round((diario.reduce((x: number, d: any) => x + Number(d.humor), 0) / diario.length) * 10) / 10, dias: diario.length } : null,
  };
}
