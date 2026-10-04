// Etapa 259 — organização da tela de Tarefas: em que grupo cada tarefa
// cai (atrasadas, hoje, amanhã, esta semana, depois, concluídas), a
// próxima vez que uma tarefa repetida aparece e o resumo do topo.
import { tarefaApareceNoDia, tarefaAtrasada, type RegraTarefa } from "@/lib/agenda/recorrencia";

export type TarefaLista = RegraTarefa & {
  id: string;
  titulo: string;
  concluida?: boolean;
  categoria_id?: string | null;
  prioridade?: number | null;
  ordem?: number | null;
};

export type Grupo = "atrasadas" | "hoje" | "amanha" | "semana" | "depois" | "concluidas";

export const NOMES_GRUPO: Record<Grupo, { titulo: string; emoji: string }> = {
  atrasadas: { titulo: "Atrasadas", emoji: "⏰" },
  hoje: { titulo: "Hoje", emoji: "☀️" },
  amanha: { titulo: "Amanhã", emoji: "🌤️" },
  semana: { titulo: "Próximos 7 dias", emoji: "📅" },
  depois: { titulo: "Mais pra frente", emoji: "🗓️" },
  concluidas: { titulo: "Concluídas", emoji: "✅" },
};

export const ORDEM_GRUPOS: Grupo[] = ["atrasadas", "hoje", "amanha", "semana", "depois", "concluidas"];

export function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Próximo dia (a partir de hoje, incluindo hoje) em que a tarefa aparece. */
export function proximaOcorrencia(t: RegraTarefa, hoje: string, limiteDias = 400): string | null {
  if (t.repetir === "nenhuma") return t.data ?? null;
  for (let i = 0; i <= limiteDias; i++) {
    const d = somarDias(hoje, i);
    if (tarefaApareceNoDia(t, d)) return d;
  }
  return null;
}

/** Feita hoje? Tarefa única: concluída. Repetida: tem conclusão no dia de hoje. */
export function feitaHoje(t: TarefaLista, conclusoesHoje: Set<string>) {
  return t.repetir === "nenhuma" ? !!t.concluida : conclusoesHoje.has(t.id);
}

export function grupoDaTarefa(t: TarefaLista, hoje: string, conclusoesHoje: Set<string>): Grupo {
  if (t.repetir === "nenhuma") {
    if (t.concluida) return "concluidas";
    if (tarefaAtrasada(t, hoje)) return "atrasadas";
  }
  const proxima = proximaOcorrencia(t, hoje);
  // repetida já feita hoje continua em "Hoje" (riscada), porque volta a aparecer
  if (!proxima) return "depois";
  if (proxima === hoje) return "hoje";
  if (proxima === somarDias(hoje, 1)) return "amanha";
  if (proxima <= somarDias(hoje, 7)) return "semana";
  return "depois";
}

function ordenar(a: TarefaLista & { _feita: boolean; _proxima: string | null }, b: typeof a) {
  if (a._feita !== b._feita) return a._feita ? 1 : -1;
  const pa = a.prioridade ?? 0;
  const pb = b.prioridade ?? 0;
  if (pa !== pb) return pb - pa;
  const da = a._proxima ?? "9999";
  const db = b._proxima ?? "9999";
  if (da !== db) return da.localeCompare(db);
  return (a.ordem ?? 0) - (b.ordem ?? 0);
}

export function agruparTarefas<T extends TarefaLista>(tarefas: T[], hoje: string, conclusoesHoje: Set<string>) {
  const grupos = new Map<Grupo, (T & { _feita: boolean; _proxima: string | null })[]>();
  for (const g of ORDEM_GRUPOS) grupos.set(g, []);
  for (const t of tarefas) {
    const item = { ...t, _feita: feitaHoje(t, conclusoesHoje), _proxima: proximaOcorrencia(t, hoje) };
    grupos.get(grupoDaTarefa(t, hoje, conclusoesHoje))!.push(item);
  }
  for (const l of grupos.values()) l.sort(ordenar);
  return grupos;
}

export function resumoTarefas(tarefas: TarefaLista[], hoje: string, conclusoesHoje: Set<string>) {
  let atrasadas = 0;
  let deHoje = 0;
  let feitasHoje = 0;
  let semana = 0;
  for (const t of tarefas) {
    const g = grupoDaTarefa(t, hoje, conclusoesHoje);
    if (g === "atrasadas") atrasadas++;
    if (g === "semana" || g === "amanha") semana++;
    const ehDeHoje = g === "hoje" || (t.repetir === "nenhuma" && t.concluida && t.data === hoje);
    if (ehDeHoje) {
      deHoje++;
      if (feitaHoje(t, conclusoesHoje)) feitasHoje++;
    }
  }
  return { atrasadas, deHoje, feitasHoje, semana };
}

/** "hoje", "amanhã", "sex, 10/10" */
export function rotuloData(iso: string | null, hoje: string): string {
  if (!iso) return "";
  if (iso === hoje) return "hoje";
  if (iso === somarDias(hoje, 1)) return "amanhã";
  if (iso === somarDias(hoje, -1)) return "ontem";
  const d = new Date(iso + "T12:00:00");
  const dia = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  return `${dia}, ${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}
