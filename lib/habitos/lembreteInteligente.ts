// Etapa 215 — lembrete inteligente: olha em que horário a pessoa
// costuma marcar cada hábito e sugere mover (ou criar) o lembrete pra
// um pouco antes disso.

const FUSO = "America/Sao_Paulo";

function horaLocal(criadoEmISO: string): { data: string; minutos: number } | null {
  const d = new Date(criadoEmISO);
  if (isNaN(d.getTime())) return null;
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "00";
  return { data: `${v("year")}-${v("month")}-${v("day")}`, minutos: Number(v("hour")) * 60 + Number(v("minute")) };
}

export function minutosParaHora(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function horaParaMinutos(h: string): number {
  const [hh, mm] = h.slice(0, 5).split(":").map(Number);
  return hh * 60 + mm;
}

export type SugestaoLembrete = {
  habitoId: string;
  nome: string;
  atual: string | null; // "HH:MM" ou null (sem lembrete)
  sugerido: string; // "HH:MM"
  costuma: string; // horário típico em que marca
  amostras: number;
};

export function sugerirLembretes(
  habitos: { id: string; nome: string; horario_lembrete?: string | null; horarios_lembrete?: string[] | null; eh_negativo?: boolean }[],
  checkins: { habito_id: string; data: string; criado_em?: string | null }[],
  hojeISO: string,
  opcoes: { minimoAmostras?: number; diferencaMinima?: number; antecedencia?: number } = {}
): SugestaoLembrete[] {
  const minimo = opcoes.minimoAmostras ?? 5;
  const diferencaMinima = opcoes.diferencaMinima ?? 45;
  const antecedencia = opcoes.antecedencia ?? 15;
  const [a, m, d] = hojeISO.split("-").map(Number);
  const limite = new Date(Date.UTC(a, m - 1, d - 30)).toISOString().slice(0, 10);

  const porHabito = new Map<string, number[]>();
  for (const c of checkins) {
    if (!c.criado_em || c.data < limite) continue;
    const h = horaLocal(c.criado_em);
    // só quando marcou no próprio dia (marcar ontem hoje de manhã não diz nada do horário)
    if (!h || h.data !== c.data) continue;
    if (!porHabito.has(c.habito_id)) porHabito.set(c.habito_id, []);
    porHabito.get(c.habito_id)!.push(h.minutos);
  }

  const saida: SugestaoLembrete[] = [];
  for (const hab of habitos) {
    if (hab.eh_negativo) continue;
    if ((hab.horarios_lembrete?.length ?? 0) > 1) continue; // vários lembretes (ex: água): não mexe
    const lista = (porHabito.get(hab.id) ?? []).sort((x, y) => x - y);
    if (lista.length < minimo) continue;
    const mediana = lista[Math.floor(lista.length / 2)];
    // horários muito espalhados (desvio > 2h) = sem rotina definida
    const media = lista.reduce((s, v) => s + v, 0) / lista.length;
    const desvio = Math.sqrt(lista.reduce((s, v) => s + (v - media) ** 2, 0) / lista.length);
    if (desvio > 120) continue;
    const sugeridoMin = Math.max(0, Math.round((mediana - antecedencia) / 5) * 5);
    const sugerido = minutosParaHora(sugeridoMin);
    const atual = hab.horario_lembrete ? hab.horario_lembrete.slice(0, 5) : null;
    if (atual && Math.abs(horaParaMinutos(atual) - sugeridoMin) < diferencaMinima) continue;
    saida.push({ habitoId: hab.id, nome: hab.nome, atual, sugerido, costuma: minutosParaHora(mediana), amostras: lista.length });
  }
  return saida;
}
