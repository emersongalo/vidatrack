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

/**
 * Etapa 289 — ordem igual à do app do banco: hoje no topo, depois ontem
 * e os dias anteriores (no mesmo dia, o lançado por último primeiro).
 * O que ainda vai acontecer (data no futuro) fica separado, do mais
 * próximo pro mais distante.
 */
export function ordenarComoBanco<T extends { data: string; criado_em?: string | null; id?: string }>(
  lista: T[],
  hoje: string
): { passados: T[]; futuros: T[] } {
  const passados: T[] = [];
  const futuros: T[] = [];
  for (const t of lista) (String(t.data) > hoje ? futuros : passados).push(t);
  const criado = (t: T) => String(t.criado_em ?? "");
  passados.sort(
    (a, b) => String(b.data).localeCompare(String(a.data)) || criado(b).localeCompare(criado(a)) || String(b.id ?? "").localeCompare(String(a.id ?? ""))
  );
  futuros.sort(
    (a, b) => String(a.data).localeCompare(String(b.data)) || criado(a).localeCompare(criado(b)) || String(a.id ?? "").localeCompare(String(b.id ?? ""))
  );
  return { passados, futuros };
}

/** Junta os lançamentos do mesmo dia (mesmo que venham fora de ordem), na ordem em que cada dia aparece. Transferência não entra no saldo do dia. */
export function agruparPorDia<T extends { data: string; tipo: string; valor: number | string; transferencia_grupo?: string | null }>(
  lista: T[],
  hoje: string
): GrupoDia<T>[] {
  const grupos: GrupoDia<T>[] = [];
  const porDia = new Map<string, GrupoDia<T>>();
  for (const t of lista) {
    let g = porDia.get(t.data);
    if (!g) {
      g = { dia: t.data, rotulo: rotuloDoDia(t.data, hoje), saldoDia: 0, itens: [] };
      porDia.set(t.data, g);
      grupos.push(g);
    }
    g.itens.push(t);
    if (!t.transferencia_grupo) g.saldoDia += (t.tipo === "receita" ? 1 : -1) * Number(t.valor);
  }
  for (const g of grupos) g.saldoDia = Math.round(g.saldoDia * 100) / 100;
  return grupos;
}
