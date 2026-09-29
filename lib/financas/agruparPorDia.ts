// Etapa 225 — extrato agrupado por dia ("Hoje", "Ontem", "sáb., 27 de set.")
export type GrupoDia<T> = { dia: string; rotulo: string; saldoDia: number; itens: T[] };

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

export function rotuloDoDia(dia: string, hoje: string): string {
  if (dia === hoje) return "Hoje";
  if (dia === somarDias(hoje, -1)) return "Ontem";
  if (dia === somarDias(hoje, 1)) return "Amanhã";
  const d = new Date(dia + "T12:00:00");
  const texto = d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(dia.slice(0, 4) !== hoje.slice(0, 4) ? { year: "numeric" } : {}),
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Mantém a ordem da lista; junta os lançamentos seguidos do mesmo dia. Transferência não entra no saldo do dia. */
export function agruparPorDia<T extends { data: string; tipo: string; valor: number | string; transferencia_grupo?: string | null }>(
  lista: T[],
  hoje: string
): GrupoDia<T>[] {
  const grupos: GrupoDia<T>[] = [];
  for (const t of lista) {
    let g = grupos[grupos.length - 1];
    if (!g || g.dia !== t.data) {
      g = { dia: t.data, rotulo: rotuloDoDia(t.data, hoje), saldoDia: 0, itens: [] };
      grupos.push(g);
    }
    g.itens.push(t);
    if (!t.transferencia_grupo) g.saldoDia += (t.tipo === "receita" ? 1 : -1) * Number(t.valor);
  }
  for (const g of grupos) g.saldoDia = Math.round(g.saldoDia * 100) / 100;
  return grupos;
}
