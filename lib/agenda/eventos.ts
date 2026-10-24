// Etapa 341 — Agenda: compromissos pessoais e compartilhados.
// Regras puras (sem banco nem tela) pra testar: repetição, ocorrências
// num período, lembretes que vencem agora e o "criar rápido"
// ("jantar sexta 20h").

import { ehLembreteSair, minutosDoLembrete } from "@/lib/agenda/lembretesSair";

export type Repetir = "nenhuma" | "diaria" | "semanal" | "quinzenal" | "mensal" | "anual";
export type TipoEvento = "evento" | "aniversario" | "data_especial";
export type Resposta = "pendente" | "vou" | "talvez" | "nao_vou";

export type Evento = {
  id: string;
  dono_id: string;
  titulo: string;
  descricao?: string | null;
  local?: string | null;
  cor?: string | null;
  data: string; // AAAA-MM-DD (1ª vez)
  hora_inicio?: string | null; // "HH:MM" ou "HH:MM:SS"; null = dia inteiro
  hora_fim?: string | null;
  repetir: Repetir;
  repetir_ate?: string | null;
  excecoes?: string[] | null; // ocorrências apagadas ("só este")
  lembretes?: number[] | null; // minutos antes
  tipo: TipoEvento;
};

export type Ocorrencia = { evento: Evento; dia: string };

/** dia inteiro: os lembretes contam a partir das 9h do dia */
export const HORA_DIA_INTEIRO = "09:00";

export const CORES_EVENTO: Record<string, { fundo: string; texto: string; hex: string; nome: string }> = {
  nota: { fundo: "bg-nota/15", texto: "text-nota", hex: "#9C8FD9", nome: "Lilás" },
  habito: { fundo: "bg-habito/15", texto: "text-habito", hex: "#7FB894", nome: "Verde" },
  financa: { fundo: "bg-financa/15", texto: "text-financa", hex: "#D9A24C", nome: "Dourado" },
  azul: { fundo: "bg-sky-400/15", texto: "text-sky-400", hex: "#38BDF8", nome: "Azul" },
  rosa: { fundo: "bg-pink-400/15", texto: "text-pink-400", hex: "#F472B6", nome: "Rosa" },
  vermelho: { fundo: "bg-red-400/15", texto: "text-red-400", hex: "#F87171", nome: "Vermelho" },
};
export function corDoEvento(cor?: string | null) {
  return CORES_EVENTO[cor ?? "nota"] ?? CORES_EVENTO.nota;
}

// ---------- datas ----------
function partes(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { a, m, d };
}
function ultimoDia(a: number, m: number) {
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
}
export function somarDiasISO(iso: string, n: number) {
  const { a, m, d } = partes(iso);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
export function diasEntreISO(de: string, ate: string) {
  const x = partes(de);
  const y = partes(ate);
  return Math.round((Date.UTC(y.a, y.m - 1, y.d) - Date.UTC(x.a, x.m - 1, x.d)) / 86400000);
}
export function diaDaSemanaISO(iso: string) {
  const { a, m, d } = partes(iso);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}
export const hhmm = (h?: string | null) => (h ? h.slice(0, 5) : null);

/** O evento acontece nesse dia? */
export function ocorreNoDia(e: Evento, dia: string): boolean {
  if (dia < e.data) return false;
  if (e.repetir_ate && dia > e.repetir_ate) return false;
  if ((e.excecoes ?? []).includes(dia)) return false;
  const ini = partes(e.data);
  const x = partes(dia);
  switch (e.repetir) {
    case "nenhuma":
      return dia === e.data;
    case "diaria":
      return true;
    case "semanal":
      return diasEntreISO(e.data, dia) % 7 === 0;
    case "quinzenal":
      return diasEntreISO(e.data, dia) % 14 === 0;
    case "mensal":
      // dia 31 cai no último dia dos meses mais curtos
      return x.d === Math.min(ini.d, ultimoDia(x.a, x.m));
    case "anual":
      return x.m === ini.m && x.d === Math.min(ini.d, ultimoDia(x.a, x.m));
    default:
      return false;
  }
}

/** Todas as vezes que os eventos acontecem entre `de` e `ate` (inclusive), em ordem. */
export function ocorrenciasEntre(eventos: Evento[], de: string, ate: string): Ocorrencia[] {
  const lista: Ocorrencia[] = [];
  const n = Math.max(0, diasEntreISO(de, ate));
  for (let i = 0; i <= n; i++) {
    const dia = somarDiasISO(de, i);
    for (const e of eventos) if (ocorreNoDia(e, dia)) lista.push({ evento: e, dia });
  }
  return lista.sort((a, b) =>
    a.dia !== b.dia ? (a.dia < b.dia ? -1 : 1) : (hhmm(a.evento.hora_inicio) ?? "00:00").localeCompare(hhmm(b.evento.hora_inicio) ?? "00:00")
  );
}

/** Próxima vez (a partir de hoje) — pra contagem regressiva de aniversários. */
export function proximaOcorrencia(e: Evento, hoje: string, limiteDias = 400): string | null {
  for (let i = 0; i <= limiteDias; i++) {
    const dia = somarDiasISO(hoje, i);
    if (ocorreNoDia(e, dia)) return dia;
  }
  return null;
}

// ---------- lembretes ----------
/** "AAAA-MM-DD HH:MM" daquele dia/hora menos X minutos (sem fuso no meio). */
export function menosMinutos(dia: string, hora: string, minutos: number) {
  const { a, m, d } = partes(dia);
  const [h, mi] = hora.split(":").map(Number);
  const t = new Date(Date.UTC(a, m - 1, d, h, mi) - minutos * 60000);
  return `${t.toISOString().slice(0, 10)} ${t.toISOString().slice(11, 16)}`;
}

export type LembreteVencido = { evento: Evento; dia: string; minutos: number };

/**
 * Lembretes cujo horário caiu entre (agora − janela) e agora.
 * O agendador roda a cada poucos minutos; o "já avisei" fica no banco.
 */
export function lembretesNaJanela(eventos: Evento[], hoje: string, horaAgora: string, janelaMin = 5): LembreteVencido[] {
  const agora = `${hoje} ${horaAgora}`;
  const inicio = menosMinutos(hoje, horaAgora, janelaMin);
  const maxAntes = Math.max(0, ...eventos.flatMap((e) => (e.lembretes ?? []).map(minutosDoLembrete)));
  const ate = somarDiasISO(hoje, Math.ceil(maxAntes / 1440) + 1);
  const saida: LembreteVencido[] = [];
  for (const o of ocorrenciasEntre(eventos.filter((e) => (e.lembretes ?? []).length), somarDiasISO(hoje, -1), ate)) {
    const base = hhmm(o.evento.hora_inicio) ?? HORA_DIA_INTEIRO;
    for (const m of o.evento.lembretes ?? []) {
      // Etapa 361 — "hora de sair" usa o mesmo cálculo (minutos antes)
      if (ehLembreteSair(m) && !o.evento.hora_inicio) continue;
      const quando = menosMinutos(o.dia, base, minutosDoLembrete(m));
      if (quando >= inicio && quando <= agora) saida.push({ evento: o.evento, dia: o.dia, minutos: m });
    }
  }
  return saida;
}

export const OPCOES_LEMBRETE = [0, 10, 30, 60, 120, 1440, 10080];

export function rotuloLembrete(minutos: number, diaInteiro = false) {
  if (diaInteiro) {
    if (minutos === 0) return "No dia (9h)";
    if (minutos === 1440) return "Na véspera (9h)";
    if (minutos === 10080) return "1 semana antes";
  }
  if (minutos === 0) return "Na hora";
  if (minutos < 60) return `${minutos} min antes`;
  if (minutos < 1440) return `${minutos / 60} h antes`;
  if (minutos === 1440) return "1 dia antes";
  if (minutos === 10080) return "1 semana antes";
  return `${Math.round(minutos / 1440)} dias antes`;
}

const SEMANA_CURTA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function rotuloDia(dia: string, hoje: string) {
  const dif = diasEntreISO(hoje, dia);
  if (dif === 0) return "hoje";
  if (dif === 1) return "amanhã";
  if (dif === -1) return "ontem";
  const { m, d } = partes(dia);
  return `${SEMANA_CURTA[diaDaSemanaISO(dia)]}, ${d} ${MESES_CURTOS[m - 1]}`;
}

/** Texto da notificação: "📅 Jantar — hoje às 20:00 (em 1 h)" */
export function textoLembrete(e: Evento, dia: string, minutos: number, hoje: string) {
  // Etapa 361 — "hora de sair"
  if (ehLembreteSair(minutos)) {
    return `🚗 Hora de sair pra ${e.titulo} — começa às ${hhmm(e.hora_inicio)}${e.local ? ` · ${e.local}` : ""}. Toque pra ver a rota.`;
  }
  const emoji = e.tipo === "aniversario" ? "🎂" : e.tipo === "data_especial" ? "⭐" : "📅";
  const hora = hhmm(e.hora_inicio);
  const quando = `${rotuloDia(dia, hoje)}${hora ? ` às ${hora}` : ""}`;
  const falta = minutos === 0 ? (hora ? " — começa agora" : "") : ` (${rotuloLembrete(minutos, !hora).replace(" antes", "").replace("Na véspera (9h)", "amanhã")})`;
  const local = e.local ? ` · ${e.local}` : "";
  return `${emoji} ${e.titulo} — ${quando}${falta}${local}`;
}

// ---------- criar rápido ----------
export type Rascunho = {
  titulo: string;
  data: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  repetir: Repetir;
  tipo: TipoEvento;
  entendi: string[]; // o que foi reconhecido (mostra como chips)
};

const DIAS_SEMANA: [RegExp, number][] = [
  [/\bdomingo\b|\bdom\b/, 0],
  [/\bsegunda(-feira)?\b|\bseg\b/, 1],
  [/\bter[cç]a(-feira)?\b|\bter\b/, 2],
  [/\bquarta(-feira)?\b|\bqua\b/, 3],
  [/\bquinta(-feira)?\b|\bqui\b/, 4],
  [/\bsexta(-feira)?\b|\bsex\b/, 5],
  [/\bs[aá]bado\b|\bs[aá]b\b/, 6],
];

function doisDigitos(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * "jantar sexta 20h", "dentista amanhã 14:30", "aniversário da Su 12/03",
 * "reunião toda segunda 9h", "academia todo dia 7h", "pagar escola dia 10 todo mês"
 */
export function interpretarRapido(entrada: string, hoje: string): Rascunho {
  let t = ` ${entrada.trim()} `;
  const baixo = () => t.toLowerCase();
  const tirar = (re: RegExp) => {
    t = t.replace(re, " ");
  };
  const entendi: string[] = [];
  let data: string | null = null;
  let hora: string | null = null;
  let repetir: Repetir = "nenhuma";
  let tipo: TipoEvento = "evento";

  // repetição
  const rep: [RegExp, Repetir, string][] = [
    [/\btodos os dias\b|\btodo dia\b|\bdiariamente\b/i, "diaria", "todo dia"],
    [/\btoda semana\b|\bsemanalmente\b/i, "semanal", "toda semana"],
    [/\ba cada (15|quinze) dias\b|\bquinzenal(mente)?\b/i, "quinzenal", "a cada 15 dias"],
    [/\btodo m[eê]s\b|\bmensalmente\b|\bmensal\b/i, "mensal", "todo mês"],
    [/\btodo ano\b|\banualmente\b|\banual\b/i, "anual", "todo ano"],
  ];
  for (const [re, r, rot] of rep)
    if (re.test(t)) {
      repetir = r;
      entendi.push(rot);
      tirar(re);
      break;
    }

  if (/anivers[aá]rio/i.test(t)) {
    tipo = "aniversario";
    repetir = "anual";
    if (!entendi.includes("todo ano")) entendi.push("aniversário · todo ano");
  }

  // "toda segunda" → semanal começando na próxima segunda
  const toda = baixo().match(/\btod[ao]s? (as |os )?(domingo|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado)s?\b/);
  if (toda) {
    repetir = "semanal";
    entendi.push(`toda ${toda[2]}`);
    t = t.replace(new RegExp(toda[0], "i"), ` ${toda[2]} `);
  }

  // hora: 20h, 20h30, 20:30, às 8, 8 da noite, meio-dia
  const meioDia = baixo().match(/\bmeio[- ]dia\b/);
  if (meioDia) {
    hora = "12:00";
    tirar(/\b(ao |à |as |às )?meio[- ]dia\b/i);
  } else {
    const h = baixo().match(/\b(?:[àa]s? )?(\d{1,2})(?:(?:h|:)(\d{2})?|h)\s*(?:min)?(?:\s*(da manh[aã]|da tarde|da noite))?(?![\wà-ú])|\b(?:[àa]s )(\d{1,2})(?:\s*(da manh[aã]|da tarde|da noite))?(?![\wà-ú])|\b(\d{1,2})\s*(da manh[aã]|da tarde|da noite)(?![\wà-ú])/);
    if (h) {
      let hh = Number(h[1] ?? h[4] ?? h[6]);
      const mm = Number(h[2] ?? 0);
      const periodo = h[3] ?? h[5] ?? h[7];
      if (periodo && /tarde|noite/.test(periodo) && hh < 12) hh += 12;
      if (hh <= 23 && mm <= 59) {
        hora = `${doisDigitos(hh)}:${doisDigitos(mm)}`;
        t = t.replace(new RegExp(h[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), " ");
      }
    }
  }

  // data: dd/mm(/aaaa), "dia 25", hoje, amanhã, depois de amanhã, dia da semana
  const dm = baixo().match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dm) {
    const { a: anoHoje } = partes(hoje);
    let ano = dm[3] ? Number(dm[3].length === 2 ? `20${dm[3]}` : dm[3]) : anoHoje;
    const mes = Number(dm[2]);
    const dia = Number(dm[1]);
    if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
      let iso = `${ano}-${doisDigitos(mes)}-${doisDigitos(Math.min(dia, ultimoDia(ano, mes)))}`;
      if (!dm[3] && iso < hoje) {
        ano += 1;
        iso = `${ano}-${doisDigitos(mes)}-${doisDigitos(Math.min(dia, ultimoDia(ano, mes)))}`;
      }
      data = iso;
      tirar(new RegExp(`\\b(dia |em |no dia )?${dm[0].replace(/\//g, "\\/")}\\b`, "i"));
    }
  }
  if (!data && /\bdepois de amanh[aã](?![\wà-ú])/i.test(t)) {
    data = somarDiasISO(hoje, 2);
    tirar(/\bdepois de amanh[aã](?![\wà-ú])/i);
  }
  if (!data && /\bamanh[aã](?![\wà-ú])/i.test(t)) {
    data = somarDiasISO(hoje, 1);
    tirar(/\bamanh[aã](?![\wà-ú])/i);
  }
  if (!data && /\bhoje\b/i.test(t)) {
    data = hoje;
    tirar(/\bhoje\b/i);
  }
  if (!data) {
    const diaN = baixo().match(/\bdia (\d{1,2})\b/);
    if (diaN) {
      const n = Number(diaN[1]);
      const { a, m } = partes(hoje);
      if (n >= 1 && n <= 31) {
        let iso = `${a}-${doisDigitos(m)}-${doisDigitos(Math.min(n, ultimoDia(a, m)))}`;
        if (iso < hoje) {
          const pm = m === 12 ? 1 : m + 1;
          const pa = m === 12 ? a + 1 : a;
          iso = `${pa}-${doisDigitos(pm)}-${doisDigitos(Math.min(n, ultimoDia(pa, pm)))}`;
        }
        data = iso;
        tirar(/\b(no )?dia \d{1,2}\b/i);
      }
    }
  }
  if (!data) {
    for (const [re, wd] of DIAS_SEMANA) {
      if (re.test(baixo())) {
        const hojeWd = diaDaSemanaISO(hoje);
        let dif = (wd - hojeWd + 7) % 7;
        if (dif === 0) dif = 7; // "sexta" falado numa sexta = a próxima
        data = somarDiasISO(hoje, dif);
        t = t.replace(new RegExp(`\\b(na |no |nesta |neste |pr[oó]xim[ao] )?(${re.source})(-feira)?`, "i"), " ");
        break;
      }
    }
  }

  if (data) entendi.unshift(rotuloDia(data, hoje));
  if (hora) entendi.splice(data ? 1 : 0, 0, hora);

  const titulo = t
    .replace(/\s+(de|da|do|na|no|às|as|em)\s*$/i, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^(de|da|do|na|no|em)\s+/i, "");
  let fim: string | null = null;
  if (hora) {
    const [h, m] = hora.split(":").map(Number);
    fim = `${doisDigitos(Math.min(23, h + 1))}:${doisDigitos(h >= 23 ? 59 : m)}`;
  }

  return {
    titulo: titulo ? titulo.charAt(0).toUpperCase() + titulo.slice(1) : "",
    data: data ?? hoje,
    hora_inicio: tipo === "aniversario" ? null : hora,
    hora_fim: tipo === "aniversario" ? null : fim,
    repetir,
    tipo,
    entendi,
  };
}

/** Lembretes padrão: com hora → 30 min antes; dia inteiro → no dia às 9h (aniversário: véspera e no dia). */
export function lembretesPadrao(tipo: TipoEvento, temHora: boolean): number[] {
  if (tipo === "aniversario") return [1440, 0];
  return temHora ? [30] : [0];
}
