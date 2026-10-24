// Etapa 359 — Agenda ↔ Google Agenda (e qualquer calendário) pelo formato
// .ics (iCalendar). Regras puras: gerar o calendário pra "assinar" e ler
// um arquivo .ics pra importar.
import type { Evento, Repetir } from "@/lib/agenda/eventos";
import { minutosDoLembrete } from "@/lib/agenda/lembretesSair";

export const FUSO_ICS = "America/Sao_Paulo";

function esc(t: string) {
  return t.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");
}
/** linhas de no máximo 75 caracteres (regra do formato) */
function dobrar(linha: string) {
  const partes: string[] = [];
  let resto = linha;
  while (resto.length > 74) {
    partes.push(resto.slice(0, 74));
    resto = " " + resto.slice(74);
  }
  partes.push(resto);
  return partes.join("\r\n");
}
const dataIcs = (iso: string) => iso.slice(0, 10).replace(/-/g, "");
const horaIcs = (h: string) => h.slice(0, 5).replace(":", "") + "00";
function somarDia(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

const RRULE: Record<Exclude<Repetir, "nenhuma">, string> = {
  diaria: "FREQ=DAILY",
  semanal: "FREQ=WEEKLY",
  quinzenal: "FREQ=WEEKLY;INTERVAL=2",
  mensal: "FREQ=MONTHLY",
  anual: "FREQ=YEARLY",
};

export function gerarIcs(eventos: (Evento & { atualizado_em?: string | null })[], opcoes: { nome?: string; agora?: Date; dominio?: string } = {}) {
  const agora = (opcoes.agora ?? new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const dominio = opcoes.dominio ?? "vidatrack.online";
  const L: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VidaTrack//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(opcoes.nome ?? "VidaTrack")}`,
    `X-WR-TIMEZONE:${FUSO_ICS}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    // fuso de Brasília (sem horário de verão desde 2019)
    "BEGIN:VTIMEZONE",
    `TZID:${FUSO_ICS}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:-0300",
    "TZOFFSETTO:-0300",
    "TZNAME:-03",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];
  for (const e of eventos) {
    const diaTodo = !e.hora_inicio;
    L.push("BEGIN:VEVENT", `UID:${e.id}@${dominio}`, `DTSTAMP:${agora}`);
    if (diaTodo) {
      L.push(`DTSTART;VALUE=DATE:${dataIcs(e.data)}`, `DTEND;VALUE=DATE:${dataIcs(somarDia(e.data, 1))}`);
    } else {
      const ini = e.hora_inicio!.slice(0, 5);
      const fim = e.hora_fim && e.hora_fim.slice(0, 5) > ini ? e.hora_fim.slice(0, 5) : null;
      L.push(`DTSTART;TZID=${FUSO_ICS}:${dataIcs(e.data)}T${horaIcs(ini)}`);
      if (fim) L.push(`DTEND;TZID=${FUSO_ICS}:${dataIcs(e.data)}T${horaIcs(fim)}`);
      else L.push("DURATION:PT1H");
    }
    L.push(`SUMMARY:${esc(e.titulo)}`);
    if (e.local) L.push(`LOCATION:${esc(e.local)}`);
    if (e.descricao) L.push(`DESCRIPTION:${esc(e.descricao)}`);
    if (e.repetir && e.repetir !== "nenhuma") {
      let regra = RRULE[e.repetir];
      if (e.repetir_ate) regra += `;UNTIL=${dataIcs(e.repetir_ate)}${diaTodo ? "" : "T235959Z"}`;
      L.push(`RRULE:${regra}`);
      for (const ex of e.excecoes ?? []) {
        L.push(diaTodo ? `EXDATE;VALUE=DATE:${dataIcs(ex)}` : `EXDATE;TZID=${FUSO_ICS}:${dataIcs(ex)}T${horaIcs(e.hora_inicio!)}`);
      }
    }
    for (const bruto of e.lembretes ?? []) {
      const m = minutosDoLembrete(bruto);
      // dia inteiro: o aviso conta a partir das 9h do dia
      const rel = diaTodo ? 9 * 60 - m : -m;
      L.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(e.titulo)}`, `TRIGGER:${rel < 0 ? "-" : ""}PT${Math.abs(rel)}M`, "END:VALARM");
    }
    L.push("END:VEVENT");
  }
  L.push("END:VCALENDAR");
  return L.map(dobrar).join("\r\n") + "\r\n";
}

// ---------- importar ----------
export type EventoImportado = {
  titulo: string;
  data: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  local: string | null;
  descricao: string | null;
  repetir: Repetir;
  repetir_ate: string | null;
  uid: string | null;
};

function desdobrar(texto: string) {
  return texto.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}
function desesc(t: string) {
  return t.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\;/g, ";").replace(/\\\\/g, "\\");
}

/** "20261030T200000Z" / "20261030T200000" / "20261030" → { data, hora } no horário de Brasília */
function lerData(valor: string, params: string): { data: string; hora: string | null } {
  const m = valor.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return { data: "", hora: null };
  if (!m[4] || /VALUE=DATE(?!-)/.test(params)) return { data: `${m[1]}-${m[2]}-${m[3]}`, hora: null };
  if (m[7] === "Z") {
    // UTC → Brasília (-3h)
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - 3 * 3600 * 1000);
    return { data: d.toISOString().slice(0, 10), hora: d.toISOString().slice(11, 16) };
  }
  return { data: `${m[1]}-${m[2]}-${m[3]}`, hora: `${m[4]}:${m[5]}` };
}

export function lerIcs(texto: string): EventoImportado[] {
  const linhas = desdobrar(texto).split("\n");
  const saida: EventoImportado[] = [];
  let atual: Record<string, { valor: string; params: string }> | null = null;
  let dentroAlarme = false;
  for (const linha of linhas) {
    if (linha === "BEGIN:VEVENT") {
      atual = {};
      continue;
    }
    if (!atual) continue;
    if (linha === "BEGIN:VALARM") dentroAlarme = true;
    if (linha === "END:VALARM") {
      dentroAlarme = false;
      continue;
    }
    if (dentroAlarme) continue;
    if (linha === "END:VEVENT") {
      const ini = atual.DTSTART ? lerData(atual.DTSTART.valor, atual.DTSTART.params) : null;
      const fim = atual.DTEND ? lerData(atual.DTEND.valor, atual.DTEND.params) : null;
      const status = atual.STATUS?.valor?.toUpperCase();
      if (ini?.data && atual.SUMMARY && status !== "CANCELLED") {
        const rrule = atual.RRULE?.valor ?? "";
        const freq = rrule.match(/FREQ=(\w+)/)?.[1];
        const intervalo = Number(rrule.match(/INTERVAL=(\d+)/)?.[1] ?? 1);
        const repetir: Repetir =
          freq === "DAILY" && intervalo === 1
            ? "diaria"
            : freq === "WEEKLY" && intervalo === 2
              ? "quinzenal"
              : freq === "WEEKLY" && intervalo === 1
                ? "semanal"
                : freq === "MONTHLY" && intervalo === 1
                  ? "mensal"
                  : freq === "YEARLY" && intervalo === 1
                    ? "anual"
                    : "nenhuma";
        const ate = rrule.match(/UNTIL=(\d{8})/)?.[1];
        saida.push({
          titulo: desesc(atual.SUMMARY.valor).trim().slice(0, 120),
          data: ini.data,
          hora_inicio: ini.hora,
          hora_fim: ini.hora && fim?.hora && fim.data === ini.data ? fim.hora : null,
          local: atual.LOCATION ? desesc(atual.LOCATION.valor).trim().slice(0, 200) || null : null,
          descricao: atual.DESCRIPTION ? desesc(atual.DESCRIPTION.valor).trim().slice(0, 2000) || null : null,
          repetir,
          repetir_ate: repetir !== "nenhuma" && ate ? `${ate.slice(0, 4)}-${ate.slice(4, 6)}-${ate.slice(6, 8)}` : null,
          uid: atual.UID?.valor ?? null,
        });
      }
      atual = null;
      continue;
    }
    const i = linha.indexOf(":");
    if (i < 0) continue;
    const cabeca = linha.slice(0, i);
    const [nome, ...params] = cabeca.split(";");
    const chave = nome.toUpperCase();
    if (!(chave in atual)) atual[chave] = { valor: linha.slice(i + 1), params: params.join(";") };
  }
  return saida;
}
