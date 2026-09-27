import { diaBateComFrequencia } from "@/lib/agenda/dias";

/**
 * Etapa 193 — regra ÚNICA de "essa tarefa aparece nesse dia?".
 * Antes a mesma conta estava copiada em 6 lugares (Hoje, lembretes,
 * alarme na tela, notificações...). Agora todos chamam daqui, então
 * uma repetição nova funciona igual em todo o app.
 *
 * Tipos de repetição (coluna `repetir`):
 * - nenhuma      → só no dia `data`
 * - diaria       → todo dia
 * - dias_semana  → nos dias de `dias_semana` (0=dom ... 6=sáb)
 * - mensal       → todo mês no dia `dia_mes` (31 = último dia do mês;
 *                  dia 30 em fevereiro cai no último dia também)
 * - anual        → todo ano no dia `dia_mes` do mês `mes` (1-12)
 * - intervalo    → a cada `intervalo_dias` dias, contando a partir de `data`
 */
export type RegraTarefa = {
  repetir: string;
  dias_semana?: number[] | null;
  data?: string | null;
  dia_mes?: number | null;
  mes?: number | null;
  intervalo_dias?: number | null;
};

function partes(dataISO: string) {
  const [a, m, d] = dataISO.split("-").map(Number);
  return { ano: a, mes: m, dia: d };
}

function ultimoDiaDoMes(ano: number, mes: number) {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** Dias corridos entre duas datas ISO (b - a), sem fuso horário no meio. */
export function diasEntre(aISO: string, bISO: string) {
  const a = partes(aISO);
  const b = partes(bISO);
  return Math.round((Date.UTC(b.ano, b.mes - 1, b.dia) - Date.UTC(a.ano, a.mes - 1, a.dia)) / 86400000);
}

export function tarefaApareceNoDia(t: RegraTarefa, dataISO: string): boolean {
  switch (t.repetir) {
    case "nenhuma":
      return t.data === dataISO;
    case "diaria":
    case "dias_semana":
      return diaBateComFrequencia(t.repetir, t.dias_semana ?? [], dataISO);
    case "mensal": {
      if (!t.dia_mes) return false;
      const { ano, mes, dia } = partes(dataISO);
      return dia === Math.min(t.dia_mes, ultimoDiaDoMes(ano, mes));
    }
    case "anual": {
      if (!t.dia_mes || !t.mes) return false;
      const { ano, mes, dia } = partes(dataISO);
      if (mes !== t.mes) return false;
      return dia === Math.min(t.dia_mes, ultimoDiaDoMes(ano, mes));
    }
    case "intervalo": {
      if (!t.data || !t.intervalo_dias || t.intervalo_dias < 1) return false;
      const d = diasEntre(t.data, dataISO);
      return d >= 0 && d % t.intervalo_dias === 0;
    }
    default:
      return false;
  }
}

/** Tarefa única, não concluída, com data já passada. */
export function tarefaAtrasada(t: RegraTarefa & { concluida?: boolean }, hojeISO: string) {
  return t.repetir === "nenhuma" && !t.concluida && !!t.data && t.data < hojeISO;
}

const NOMES_MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const NOMES_DIA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Texto curto pra mostrar na lista/detalhe: "Todo dia 10", "A cada 2 semanas"... */
export function descreverRepeticao(t: RegraTarefa): string {
  switch (t.repetir) {
    case "nenhuma":
      return t.data ? new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR") : "Sem data";
    case "diaria":
      return "Todo dia";
    case "dias_semana": {
      const dias = [...(t.dias_semana ?? [])].sort();
      if (dias.join() === "1,2,3,4,5") return "Dias úteis";
      if (dias.join() === "0,6") return "Fins de semana";
      return dias.map((d) => NOMES_DIA[d]).join(", ") || "Dias da semana";
    }
    case "mensal":
      return t.dia_mes && t.dia_mes >= 31 ? "Último dia de cada mês" : `Todo dia ${t.dia_mes} do mês`;
    case "anual":
      return t.dia_mes && t.mes
        ? `Todo ano em ${t.dia_mes >= 31 ? "último dia de" : t.dia_mes + " de"} ${NOMES_MES[t.mes - 1]}`
        : "Todo ano";
    case "intervalo": {
      const n = t.intervalo_dias ?? 1;
      if (n % 7 === 0) return n === 7 ? "Toda semana" : `A cada ${n / 7} semanas`;
      return `A cada ${n} dias`;
    }
    default:
      return "Repete";
  }
}

export const PRIORIDADES = [
  { valor: 0, rotulo: "Nenhuma", classe: "text-ink-400", fundo: "bg-base-600" },
  { valor: 1, rotulo: "Baixa", classe: "text-sky-400", fundo: "bg-sky-400" },
  { valor: 2, rotulo: "Média", classe: "text-financa", fundo: "bg-financa" },
  { valor: 3, rotulo: "Alta", classe: "text-red-400", fundo: "bg-red-400" },
] as const;
