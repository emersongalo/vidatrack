// Etapa 287 — números do topo do Início: hábitos e tarefas de hoje e
// quanto saiu hoje, mais uma frase curta conforme o andamento do dia.
import { resumoDoDia, type ResumoDia } from "@/lib/painel/seuDia";

export type TopoInicio = ResumoDia & { gastoHoje: number; entrouHoje: number; frase: string };

export function gastoDoDia(transacoes: any[], hoje: string) {
  let gasto = 0;
  let entrou = 0;
  for (const t of transacoes) {
    if (t.data !== hoje || t.transferencia_grupo) continue;
    if (t.tipo === "despesa") gasto += Number(t.valor) || 0;
    else if (t.tipo === "receita") entrou += Number(t.valor) || 0;
  }
  return { gasto: Math.round(gasto * 100) / 100, entrou: Math.round(entrou * 100) / 100 };
}

export function fraseDoDia(r: ResumoDia, hora: number): string {
  const faltaH = r.habitos.total - r.habitos.feitos;
  const faltaT = r.tarefas.total - r.tarefas.feitas;
  const total = r.habitos.total + r.tarefas.total;
  if (total === 0) return hora < 12 ? "Dia livre pela frente. Aproveite! 🌿" : "Nada marcado pra hoje. 🌿";
  if (faltaH === 0 && faltaT === 0) return "Dia fechado! Tudo feito. 🎉";
  const partes = [
    faltaH > 0 ? `${faltaH} ${faltaH === 1 ? "hábito" : "hábitos"}` : null,
    faltaT > 0 ? `${faltaT} ${faltaT === 1 ? "tarefa" : "tarefas"}` : null,
  ].filter(Boolean);
  const feitos = r.habitos.feitos + r.tarefas.feitas;
  if (feitos === 0) return hora < 12 ? `Bora começar: ${partes.join(" e ")} hoje.` : `Ainda dá tempo: ${partes.join(" e ")}.`;
  if (feitos / total >= 0.5) return `Mais da metade feita! Faltam ${partes.join(" e ")}.`;
  return `Faltam ${partes.join(" e ")} pra fechar o dia.`;
}

export function topoDoInicio(s: any, hoje: string, hora: number): TopoInicio {
  const r = resumoDoDia(s, hoje);
  const { gasto, entrou } = gastoDoDia((s?.financas?.transacoes ?? []) as any[], hoje);
  return { ...r, gastoHoje: gasto, entrouHoje: entrou, frase: fraseDoDia(r, hora) };
}

// Etapa 288 — a pessoa escolhe quais quadrinhos aparecem no topo
// (ex: esconder o gasto do dia pra não mostrar finanças de cara).
export type QuadroTopo = "habitos" | "tarefas" | "gasto";
export const QUADROS_TOPO: { id: QuadroTopo; rotulo: string; emoji: string }[] = [
  { id: "habitos", rotulo: "Hábitos", emoji: "✅" },
  { id: "tarefas", rotulo: "Tarefas", emoji: "📋" },
  { id: "gasto", rotulo: "Saiu hoje", emoji: "💸" },
];
export const CHAVE_QUADROS_TOPO = "vt-topo-inicio-quadros";

/** Lê o que foi salvo; inválido ou nada salvo = os 3. Lista vazia vale (esconde tudo). */
export function lerQuadrosTopo(bruto: string | null): QuadroTopo[] {
  if (bruto === null) return QUADROS_TOPO.map((q) => q.id);
  try {
    const v = JSON.parse(bruto);
    if (!Array.isArray(v)) return QUADROS_TOPO.map((q) => q.id);
    return QUADROS_TOPO.map((q) => q.id).filter((id) => v.includes(id));
  } catch {
    return QUADROS_TOPO.map((q) => q.id);
  }
}
