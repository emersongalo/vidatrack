// Etapa 314 — hábitos "X vezes por semana" (horário e dia livres): aviso
// inteligente quando a semana está acabando e a meta ficou apertada.
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";

type Checkin = { habito_id: string; data: string; quantidade?: number | null };

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
const diaDaSemana = (iso: string) => new Date(iso + "T12:00:00Z").getUTCDay();

export type Apertado = { id: string; nome: string; feitos: number; vezes: number; falta: number; restam: number };

/**
 * Hábitos semanais em que o que falta já ocupa todos os dias que restam
 * na semana (contando hoje). Quem já fez hoje não entra (está em dia).
 */
export function semanaisApertados(habitos: any[], checkins: Checkin[], hoje: string): Apertado[] {
  const seg = somarDias(hoje, -((diaDaSemana(hoje) + 6) % 7));
  const restam = 7 - ((diaDaSemana(hoje) + 6) % 7); // hoje até domingo
  const r: Apertado[] = [];
  for (const h of habitos) {
    if (h.frequencia !== "semanal" || h.eh_negativo || h.arquivado) continue;
    if (!habitoDevidoNoDia(h, hoje)) continue; // pausado
    const meta = Math.max(1, Number(h.meta_diaria) || 1);
    const vezes = Math.max(1, Number(h.vezes_semana) || 3);
    const soma = new Map<string, number>();
    for (const c of checkins) if (c.habito_id === h.id && c.data >= seg && c.data <= hoje) soma.set(c.data, (soma.get(c.data) ?? 0) + Number(c.quantidade ?? 1));
    if ((soma.get(hoje) ?? 0) >= meta) continue;
    const feitos = [...soma.values()].filter((q) => q >= meta).length;
    const falta = vezes - feitos;
    if (falta > 0 && falta >= restam) r.push({ id: h.id, nome: String(h.nome), feitos, vezes, falta, restam });
  }
  return r;
}

export function textoApertados(l: Apertado[]): string | null {
  if (!l.length) return null;
  if (l.length === 1) {
    const a = l[0];
    if (a.falta > a.restam) return `⏳ ${a.nome}: ${a.feitos} de ${a.vezes} nesta semana. A meta não fecha mais, mas cada vez conta — bora fazer hoje?`;
    return a.restam === 1
      ? `⏳ Último dia pra fechar ${a.nome} da semana (${a.feitos} de ${a.vezes}). Bora?`
      : `⏳ ${a.nome}: faltam ${a.falta} de ${a.vezes} e restam ${a.restam} dias. Faz hoje pra não apertar!`;
  }
  return `⏳ Semana apertando: ${l.map((a) => `${a.nome} (${a.feitos}/${a.vezes})`).join(", ")}. Faz hoje pra fechar as metas!`;
}
