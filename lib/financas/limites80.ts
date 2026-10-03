// Etapa 247 — aviso quando o teto do mês ou o orçamento de uma
// categoria passa de 80% (e outro quando estoura).
import { formatarMoeda } from "@/lib/financas/formatacao";
import { gastoDoMes, situacaoTeto } from "@/lib/financas/teto";

type Alerta = { id: string; emoji: string; texto: string; href: string; acao: string };

export function alertasDeLimite(snapshot: any, hojeISO: string): Alerta[] {
  const f = snapshot?.financas;
  if (!f) return [];
  const mes = hojeISO.slice(0, 7);
  const saida: Alerta[] = [];

  const teto = Number(snapshot.perfil?.teto_mensal ?? 0);
  if (teto > 0) {
    const gasto = gastoDoMes(f.contas, f.transacoes, hojeISO);
    const s = situacaoTeto(gasto, teto, hojeISO);
    if (s.estourou) {
      saida.push({
        id: `teto-100-${mes}`,
        emoji: "🚨",
        texto: `Você passou do teto do mês: ${formatarMoeda(gasto)} de ${formatarMoeda(teto)}.`,
        href: "/financas/analise",
        acao: "Ver pra onde foi",
      });
    } else if (s.pct >= 80) {
      saida.push({
        id: `teto-80-${mes}`,
        emoji: "🎯",
        texto: `Já foi ${s.pct}% do teto do mês. Sobram ${formatarMoeda(s.restante)} — cerca de ${formatarMoeda(s.porDia)} por dia.`,
        href: "/financas/analise",
        acao: "Ver gastos",
      });
    }
  }

  const investimento = new Set((f.contas ?? []).filter((c: any) => c.tipo === "investimento").map((c: any) => c.id));
  const gastoPorCategoria = new Map<string, number>();
  for (const t of f.transacoes ?? []) {
    if (t.tipo !== "despesa" || t.transferencia_grupo || !t.categoria_id || investimento.has(t.conta_id)) continue;
    if (!String(t.data).startsWith(mes) || (t.data > hojeISO && !t.pago_em)) continue;
    gastoPorCategoria.set(t.categoria_id, (gastoPorCategoria.get(t.categoria_id) ?? 0) + Number(t.valor));
  }
  const categorias = (f.categorias ?? [])
    .filter((c: any) => c.tipo === "despesa" && Number(c.meta_mensal) > 0)
    .map((c: any) => {
      const gasto = gastoPorCategoria.get(c.id) ?? 0;
      return { c, gasto, pct: Math.round((gasto / Number(c.meta_mensal)) * 100) };
    })
    .filter((x: any) => x.pct >= 80)
    .sort((a: any, b: any) => b.pct - a.pct)
    .slice(0, 2);
  for (const { c, gasto, pct } of categorias) {
    const meta = Number(c.meta_mensal);
    saida.push({
      id: `orc-${pct >= 100 ? 100 : 80}-${c.id}-${mes}`,
      emoji: pct >= 100 ? "🔴" : "🟠",
      texto:
        pct >= 100
          ? `${c.nome}: passou do orçamento (${formatarMoeda(gasto)} de ${formatarMoeda(meta)}).`
          : `${c.nome}: já foi ${pct}% do orçamento. Restam ${formatarMoeda(meta - gasto)}.`,
      href: `/financas/extrato?categoria=${c.id}&tipo=despesa&mes=${mes}`,
      acao: "Ver gastos",
    });
  }
  return saida;
}
