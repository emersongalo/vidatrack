// Etapa 220 — pedaços de linguagem que o assistente entende:
// períodos ("em setembro", "mês passado"), datas ("ontem", "dia 12"),
// contas ("no nubank") e o assunto da pergunta ("com uber").

export function semAcento(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function iso(a: number, m: number, d: number) {
  return `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function ultimoDia(a: number, m: number) {
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
}
export function somarDias(isoData: string, n: number) {
  const [a, m, d] = isoData.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
function diaDaSemana(isoData: string) {
  const [a, m, d] = isoData.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

export type Periodo = { inicio: string; fim: string; rotulo: string };

/** Período citado na frase; null se não citou nenhum. */
export function periodoDaFrase(textoOriginal: string, hoje: string): Periodo | null {
  const t = semAcento(textoOriginal);
  const [a, m] = hoje.split("-").map(Number);
  if (/\bhoje\b/.test(t)) return { inicio: hoje, fim: hoje, rotulo: "hoje" };
  if (/\banteontem\b/.test(t)) {
    const d = somarDias(hoje, -2);
    return { inicio: d, fim: d, rotulo: "anteontem" };
  }
  if (/\bontem\b/.test(t)) {
    const d = somarDias(hoje, -1);
    return { inicio: d, fim: d, rotulo: "ontem" };
  }
  const ultimos = t.match(/ultimos?\s+(\d{1,3})\s+dias/);
  if (ultimos) return { inicio: somarDias(hoje, -(Number(ultimos[1]) - 1)), fim: hoje, rotulo: `nos últimos ${ultimos[1]} dias` };
  if (/semana passada/.test(t)) {
    const seg = somarDias(hoje, -((diaDaSemana(hoje) + 6) % 7) - 7);
    return { inicio: seg, fim: somarDias(seg, 6), rotulo: "na semana passada" };
  }
  if (/(essa|esta|nessa|nesta) semana/.test(t)) {
    const seg = somarDias(hoje, -((diaDaSemana(hoje) + 6) % 7));
    return { inicio: seg, fim: hoje, rotulo: "essa semana" };
  }
  if (/mes passado/.test(t)) {
    const aa = m === 1 ? a - 1 : a;
    const mm = m === 1 ? 12 : m - 1;
    return { inicio: iso(aa, mm, 1), fim: iso(aa, mm, ultimoDia(aa, mm)), rotulo: `em ${MESES[mm - 1].replace("marco", "março")}` };
  }
  if (/ano passado/.test(t)) return { inicio: iso(a - 1, 1, 1), fim: iso(a - 1, 12, 31), rotulo: `em ${a - 1}` };
  if (/(esse|este|nesse|neste) ano|no ano/.test(t)) return { inicio: iso(a, 1, 1), fim: hoje, rotulo: `em ${a}` };
  for (let i = 0; i < 12; i++) {
    const re = new RegExp(`\\b${MESES[i]}\\b(?:\\s+(?:de\\s+)?(\\d{4}))?`);
    const achou = t.match(re);
    if (achou) {
      const mes = i + 1;
      // mês sem ano: o mais recente que já começou
      const ano = achou[1] ? Number(achou[1]) : mes > m ? a - 1 : a;
      return { inicio: iso(ano, mes, 1), fim: iso(ano, mes, ultimoDia(ano, mes)), rotulo: `em ${MESES[i].replace("marco", "março")}${achou[1] ? ` de ${ano}` : ""}` };
    }
  }
  if (/(esse|este|nesse|neste) mes|no mes/.test(t)) return { inicio: iso(a, m, 1), fim: iso(a, m, ultimoDia(a, m)), rotulo: "esse mês" };
  return null;
}

/** Data de um lançamento citada na frase ("ontem", "dia 12", "12/09"). */
export function dataDaFrase(textoOriginal: string, hoje: string): string | null {
  const t = semAcento(textoOriginal);
  if (/\banteontem\b/.test(t)) return somarDias(hoje, -2);
  if (/\bontem\b/.test(t)) return somarDias(hoje, -1);
  if (/\bamanha\b/.test(t)) return somarDias(hoje, 1);
  if (/\bhoje\b/.test(t)) return hoje;
  const [a, m] = hoje.split("-").map(Number);
  const barra = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (barra) {
    const d = Number(barra[1]);
    const mm = Number(barra[2]);
    let aa = barra[3] ? Number(barra[3]) : a;
    if (aa < 100) aa += 2000;
    if (mm >= 1 && mm <= 12 && d >= 1 && d <= ultimoDia(aa, mm)) return iso(aa, mm, d);
  }
  const dia = t.match(/\bdia\s+(\d{1,2})\b/);
  if (dia) {
    const d = Number(dia[1]);
    if (d >= 1 && d <= ultimoDia(a, m)) return iso(a, m, d);
  }
  return null;
}

/** Conta citada ("no nubank", "pelo inter"). */
export function contaDaFrase<T extends { id: string; nome: string; banco?: string | null }>(textoOriginal: string, contas: T[]): T | null {
  const t = ` ${semAcento(textoOriginal)} `;
  let melhor: T | null = null;
  let tamanho = 0;
  for (const c of contas) {
    for (const nome of [c.nome, c.banco ?? ""]) {
      const n = semAcento(nome).trim();
      if (n.length >= 2 && t.includes(` ${n} `) && n.length > tamanho) {
        melhor = c;
        tamanho = n.length;
      }
    }
  }
  return melhor;
}

const PALAVRAS_TEMPO = new Set([
  "hoje", "ontem", "anteontem", "semana", "mes", "ano", "passado", "passada", "esse", "este", "essa", "esta", "nesse", "neste", "ultimos", "dias",
  ...MESES,
]);

/** O "assunto" depois de com/no/na/em/de (ex: "quanto gastei com uber" → "uber"). */
export function assuntoDaFrase(textoOriginal: string): string | null {
  const t = semAcento(textoOriginal).replace(/[?!.,]/g, " ");
  const achou = t.match(/\b(?:com|no|na|em|de|do|da)\s+([a-z0-9][a-z0-9 ]{1,40})/);
  if (!achou) return null;
  const palavras = achou[1].split(/\s+/).filter(Boolean);
  const util: string[] = [];
  for (const p of palavras) {
    if (PALAVRAS_TEMPO.has(p) || ["no", "na", "em", "de", "do", "da", "o", "a", "os", "as", "mes"].includes(p)) break;
    util.push(p);
  }
  const assunto = util.join(" ").trim();
  return assunto.length >= 2 ? assunto : null;
}

/** Tira da descrição as palavras de data, conta e comando ("lança", "ontem", "no nubank"). */
export function limparDescricao(descricao: string | null, contaNome?: string | null): string | null {
  if (!descricao) return null;
  let d = ` ${descricao} `;
  const tirar = ["lanca", "lança", "lancar", "lançar", "registra", "registrar", "anota", "anotar", "cadastra", "ontem", "anteontem", "hoje", "amanha", "amanhã", "pelo", "pela", "cartao", "cartão"];
  for (const p of tirar) d = d.replace(new RegExp(`\\s${p}\\s`, "gi"), " ");
  if (contaNome) d = d.replace(new RegExp(`\\s${contaNome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s`, "gi"), " ");
  d = d.replace(/\sdia\s\d{1,2}\s/gi, " ").replace(/\s\d{1,2}\/\d{1,2}(\/\d{2,4})?\s/g, " ");
  d = d.replace(/\s+/g, " ").trim();
  return d ? d.charAt(0).toUpperCase() + d.slice(1) : null;
}
