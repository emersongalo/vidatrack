// Etapa 232 — "Próximos dias" no Painel: o que vem pela frente na semana
// (contas a pagar, faturas, receitas previstas e tarefas com data).
// Tudo calculado do retrato local — nada novo no banco.
import { eventosFinanceiros } from "@/lib/financas/calendario";

export type ItemProximo = {
  data: string;
  titulo: string;
  tipo: "despesa" | "receita" | "tarefa";
  valor: number | null;
  href: string;
};

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

export function proximosDias(s: any, hoje: string, dias = 7, limite = 6): ItemProximo[] {
  const inicio = somarDias(hoje, 1);
  const fim = somarDias(hoje, dias);
  const itens: ItemProximo[] = [];

  try {
    const eventos = eventosFinanceiros(
      {
        contas: s?.financas?.contas ?? [],
        transacoes: s?.financas?.transacoes ?? [],
        recorrencias: s?.financas?.recorrencias ?? [],
        hojeISO: hoje,
      },
      inicio,
      fim
    );
    for (const e of eventos) {
      if (e.origem === "lancado" || e.origem === "cartao") continue;
      itens.push({ data: e.data, titulo: e.descricao, tipo: e.tipo, valor: e.valor, href: "/financas/calendario" });
    }
  } catch {
    /* dado estranho: segue só com as tarefas */
  }

  for (const t of (s?.tarefas ?? []) as any[]) {
    if ((t.repetir ?? "nenhuma") !== "nenhuma" || t.concluida || !t.data) continue;
    if (t.data < inicio || t.data > fim) continue;
    itens.push({ data: t.data, titulo: String(t.titulo ?? "Tarefa"), tipo: "tarefa", valor: null, href: `/tarefas/${t.id}` });
  }

  const ordemTipo = { tarefa: 0, despesa: 1, receita: 2 } as const;
  return itens.sort((a, b) => a.data.localeCompare(b.data) || ordemTipo[a.tipo] - ordemTipo[b.tipo]).slice(0, limite);
}
