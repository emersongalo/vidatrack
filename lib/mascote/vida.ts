// Etapa 302 — o mascote "de verdade" (estilo bichinho virtual): barriga e
// saúde calculadas dia a dia a partir dos hábitos feitos e do que você deu
// pra ele (comidinhas, remédio). Nada roda no servidor: é só conta em cima
// do retrato. Ele adoece, mas NUNCA morre — volta com hábitos e remédio.
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";
import { consumivel, somarDiasISO, type Consumo } from "@/lib/mascote/mascote";

export type EstadoVida = "bem" | "fome" | "doente";

export type Vida = {
  /** 0 (vazia) a 100 (cheia) */
  barriga: number;
  /** 0 a 100 */
  saude: number;
  estado: EstadoVida;
  /** dias seguidos (antes de hoje) sem nenhum hábito feito */
  diasSemCuidar: number;
  /** quanto já comeu hoje de consumíveis (pra não exagerar) */
  petiscosHoje: number;
};

export const DIAS_SIMULADOS = 14;
const GASTO_DIA = 40; // quanto a barriga esvazia num dia
const ENCHE_DIA = 80; // quanto enche com 100% dos hábitos
export const LIMITE_PETISCOS_DIA = 6;

/** Fração dos hábitos do dia que foram feitos (null = nenhum hábito valia). */
export function razaoDoDia(s: any, dia: string): number | null {
  const qtd = new Map<string, number>();
  for (const c of (s?.habitoCheckins ?? []) as any[]) if (c.data === dia) qtd.set(c.habito_id, (qtd.get(c.habito_id) ?? 0) + Number(c.quantidade ?? 1));
  const devidos = ((s?.habitos ?? []) as any[]).filter((h) => {
    if (h.eh_negativo || h.arquivado) return false;
    const criado = String(h.criado_em ?? "").slice(0, 10);
    if (criado && criado > dia) return false;
    try {
      return habitoDevidoNoDia(h, dia);
    } catch {
      return false;
    }
  });
  if (!devidos.length) return null;
  const feitos = devidos.filter((h) => (qtd.get(h.id) ?? 0) >= Math.max(1, Number(h.meta_diaria) || 1)).length;
  return feitos / devidos.length;
}

const lim = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Simula os últimos dias. Regras (simples de explicar):
 * - todo dia a barriga esvazia 40; hábitos enchem até 80 (proporcional);
 * - dia sem NENHUM hábito feito: saúde −25; barriga quase vazia: saúde −15;
 * - dia bem cuidado (metade ou mais): saúde +15;
 * - comidinhas e remédios somam na hora.
 */
export function calcularVida(s: any, hoje: string, hora: number, consumos: Consumo[] = [], criadoEm?: string): Vida {
  let barriga = 75;
  let saude = 90;
  let diasSemCuidar = 0;
  const inicio = somarDiasISO(hoje, -DIAS_SIMULADOS);
  const comeco = criadoEm && criadoEm > inicio ? criadoEm : inicio;

  const efeitos = (dia: string) => {
    let b = 0;
    let sa = 0;
    let n = 0;
    for (const c of consumos) {
      if (c.d !== dia) continue;
      const item = consumivel(c.t);
      if (!item || item.tipo === "planta") continue;
      b += item.barriga;
      sa += item.saude;
      n++;
    }
    return { b, sa, n };
  };

  for (let dia = comeco; dia < hoje; dia = somarDiasISO(dia, 1)) {
    const r = razaoDoDia(s, dia);
    const e = efeitos(dia);
    if (r === null) barriga -= 15;
    else barriga += -GASTO_DIA + ENCHE_DIA * r;
    barriga = lim(barriga + e.b);
    saude += e.sa;
    if (r !== null && r === 0) {
      saude -= 25;
      diasSemCuidar++;
    } else {
      if (r !== null) diasSemCuidar = 0;
      if (barriga < 25) saude -= 15;
      else if (r === null || r >= 0.5) saude += 15;
    }
    saude = lim(saude);
  }

  // hoje: vai esvaziando com as horas, enche com o que já fez
  const rHoje = razaoDoDia(s, hoje);
  const eHoje = efeitos(hoje);
  barriga = lim(barriga - GASTO_DIA * (Math.max(0, Math.min(24, hora)) / 24) + (rHoje ? ENCHE_DIA * rHoje : 0) + eHoje.b);
  saude = lim(saude + eHoje.sa + (rHoje && rHoje >= 1 ? 10 : 0));

  const estado: EstadoVida = saude < 35 ? "doente" : barriga < 25 ? "fome" : "bem";
  return { barriga, saude, estado, diasSemCuidar, petiscosHoje: eHoje.n };
}

export function textoBarriga(b: number) {
  if (b >= 80) return "Cheinho";
  if (b >= 50) return "Satisfeito";
  if (b >= 25) return "Com fominha";
  return "Faminto";
}

export function textoSaude(s: number) {
  if (s >= 75) return "Forte";
  if (s >= 50) return "Bem";
  if (s >= 35) return "Abatido";
  return "Doente";
}
