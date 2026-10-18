// Etapa 330 — parcelamentos que ainda estão rolando num cartão
// (agrupa as parcelas pelo grupo e conta quantas já passaram).
type T = { id?: string; data: string; valor: number | string; descricao?: string | null; parcela_grupo?: string | null; parcela_numero?: number | null; parcela_total?: number | null };

export type Parcelamento = { grupo: string; descricao: string; total: number; pagas: number; valorParcela: number; falta: number; ultima: string };

export function parcelamentosAtivos(transacoes: T[], hoje: string): Parcelamento[] {
  const grupos = new Map<string, T[]>();
  for (const t of transacoes) {
    if (!t.parcela_grupo) continue;
    const l = grupos.get(t.parcela_grupo) ?? [];
    l.push(t);
    grupos.set(t.parcela_grupo, l);
  }
  const r: Parcelamento[] = [];
  for (const [grupo, l] of grupos) {
    l.sort((a, b) => (a.data < b.data ? -1 : 1));
    const ultima = l[l.length - 1].data;
    if (ultima < hoje) continue; // já terminou
    const total = Math.max(l.length, Number(l[0].parcela_total) || l.length);
    const pagas = l.filter((t) => t.data <= hoje).length;
    const futuras = l.filter((t) => t.data > hoje);
    const falta = Math.round(futuras.reduce((s, t) => s + Number(t.valor), 0) * 100) / 100;
    const descricao = (l[0].descricao ?? "Compra parcelada").replace(/\s*\(\d+\/\d+\)\s*$/, "");
    r.push({ grupo, descricao, total, pagas, valorParcela: Number(l[0].valor), falta, ultima });
  }
  return r.sort((a, b) => (a.ultima < b.ultima ? -1 : 1));
}
