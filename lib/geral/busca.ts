// Etapa 215 — busca geral no retrato local (funciona sem internet)
import type { SnapshotOffline } from "@/lib/offline/snapshot";

export type ResultadoBusca = {
  tipo: "lancamento" | "habito" | "tarefa" | "meta" | "conta" | "categoria" | "diario";
  titulo: string;
  detalhe: string;
  href: string;
  data?: string;
  valor?: number;
  receita?: boolean;
};

function semAcento(s: string | null | undefined) {
  return (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** "45", "45,9", "45,90", "1.234,56" → número; senão null */
export function valorDaBusca(q: string): number | null {
  const t = q.trim();
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(t)) return null;
  return Number(t.replace(/\./g, "").replace(",", "."));
}

export function buscarNoSnapshot(snapshot: SnapshotOffline, consulta: string, limite = 60): ResultadoBusca[] {
  const q = semAcento(consulta).trim();
  if (q.length < 2) return [];
  const termos = q.split(/\s+/).filter(Boolean);
  const bate = (...textos: (string | null | undefined)[]) => {
    const alvo = textos.map(semAcento).join(" ");
    return termos.every((t) => alvo.includes(t));
  };
  const valor = valorDaBusca(consulta);
  const res: ResultadoBusca[] = [];

  for (const h of snapshot.habitos as any[]) {
    if (bate(h.nome)) res.push({ tipo: "habito", titulo: h.nome, detalhe: "Hábito", href: `/habitos/${h.id}/editar` });
  }
  for (const t of snapshot.tarefas as any[]) {
    if (bate(t.titulo, t.observacoes)) {
      res.push({ tipo: "tarefa", titulo: t.titulo, detalhe: t.data ? `Tarefa · ${t.data.split("-").reverse().join("/")}` : "Tarefa", href: `/habitos/tarefas/${t.id}`, data: t.data ?? undefined });
    }
  }
  for (const m of snapshot.financas.metas as any[]) {
    if (bate(m.nome)) res.push({ tipo: "meta", titulo: m.nome, detalhe: "Meta de economia", href: "/financas/metas" });
  }
  for (const c of snapshot.financas.contas as any[]) {
    if (bate(c.nome, c.banco)) res.push({ tipo: "conta", titulo: c.nome, detalhe: "Conta", href: `/financas/extrato?conta=${c.id}&periodo=tudo` });
  }
  const nomesCat = new Map<string, string>();
  for (const c of snapshot.financas.categorias as any[]) {
    nomesCat.set(c.id, c.nome);
    if (bate(c.nome)) res.push({ tipo: "categoria", titulo: c.nome, detalhe: c.tipo === "receita" ? "Categoria de receita" : "Categoria de despesa", href: `/financas/extrato?categoria=${c.id}&periodo=tudo` });
  }
  for (const d of snapshot.diario ?? []) {
    if (d.texto && bate(d.texto)) res.push({ tipo: "diario", titulo: d.texto, detalhe: "Diário", href: "/habitos/diario", data: d.data });
  }

  const nomesConta = new Map((snapshot.financas.contas as any[]).map((c) => [c.id, c.nome]));
  const lancamentos: ResultadoBusca[] = [];
  for (const t of snapshot.financas.transacoes as any[]) {
    const v = Number(t.valor);
    const porValor = valor !== null && Math.abs(v - valor) < 0.005;
    const porValorInteiro = valor !== null && !consulta.includes(",") && Math.floor(v) === valor;
    if (!(porValor || porValorInteiro || bate(t.descricao, nomesCat.get(t.categoria_id)))) continue;
    lancamentos.push({
      tipo: "lancamento",
      titulo: t.descricao || nomesCat.get(t.categoria_id) || (t.tipo === "receita" ? "Receita" : "Despesa"),
      detalhe: `${t.data.split("-").reverse().join("/")} · ${nomesConta.get(t.conta_id) ?? ""}`,
      href: `/financas/${t.id}/editar`,
      data: t.data,
      valor: v,
      receita: t.tipo === "receita",
    });
  }
  lancamentos.sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
  return [...res, ...lancamentos].slice(0, limite);
}


