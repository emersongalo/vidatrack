// Etapa 314 — relatório do mês dos hábitos: quanto foi cumprido, melhor
// sequência, dia da semana mais forte e mais fraco, o hábito destaque, o
// que caiu em relação ao mês anterior e sugestões de ajuste. Tudo calculado
// dos check-ins que já estão no aparelho.
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";

type Checkin = { habito_id: string; data: string; quantidade?: number | null; usuario_id?: string | null };

export const NOMES_DIA_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const PLURAL_DIA: [string, string][] = [["os", "domingos"], ["as", "segundas"], ["as", "terças"], ["as", "quartas"], ["as", "quintas"], ["as", "sextas"], ["os", "sábados"]];
export const NOMES_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
export function mesAnterior(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
}
export function mesSeguinte(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, "0")}`;
}
export function nomeDoMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const n = NOMES_MES[m - 1];
  return `${n[0].toUpperCase()}${n.slice(1)} de ${a}`;
}
function diasDoMes(mes: string, ate: string): string[] {
  const l: string[] = [];
  for (let d = `${mes}-01`; d.startsWith(mes) && d <= ate; d = somarDias(d, 1)) l.push(d);
  return l;
}
const diaDaSemana = (iso: string) => new Date(iso + "T12:00:00Z").getUTCDay();

export type LinhaHabito = {
  id: string;
  nome: string;
  tipo: "diario" | "semanal" | "parar";
  /** dias (ou semanas, no semanal) que valiam */
  devidos: number;
  feitos: number;
  taxa: number | null;
  taxaAntes: number | null;
  melhorSequencia: number;
};

export type RelatorioMes = {
  mes: string;
  completo: boolean;
  devidos: number;
  feitos: number;
  taxa: number | null;
  taxaAntes: number | null;
  diasPerfeitos: number;
  diasComAlgo: number;
  melhorSequencia: { nome: string; dias: number } | null;
  porDiaSemana: { dia: number; taxa: number | null }[];
  melhorDia: number | null;
  piorDia: number | null;
  habitos: LinhaHabito[];
  destaque: LinhaHabito | null;
  queda: LinhaHabito | null;
  sugestoes: string[];
};

function qtdPorDia(h: any, checkins: Checkin[]) {
  const m = new Map<string, number>();
  for (const c of checkins) if (c.habito_id === h.id) m.set(c.data, (m.get(c.data) ?? 0) + Number(c.quantidade ?? 1));
  return m;
}

/** Contas de um hábito num mês (até `ate`). */
function linhaDoMes(h: any, qtd: Map<string, number>, mes: string, ate: string, hoje: string) {
  const meta = Math.max(1, Number(h.meta_diaria) || 1);
  const criado = String(h.criado_em ?? "").slice(0, 10) || "0000-00-00";
  const dias = diasDoMes(mes, ate).filter((d) => d >= criado);
  const porDia: { dia: string; ok: boolean }[] = [];
  if (h.eh_negativo) {
    // hábito de parar: o dia vale se não escorregou (hoje só conta quando acabar)
    for (const d of dias) if (d !== hoje) porDia.push({ dia: d, ok: !(qtd.get(d) ?? 0) });
    return { tipo: "parar" as const, devidos: porDia.length, feitos: porDia.filter((x) => x.ok).length, porDia };
  }
  if (h.frequencia === "semanal") {
    const vezes = Math.max(1, Number(h.vezes_semana) || 3);
    // semanas que começam (segunda) dentro do mês; conta a semana inteira
    let devidos = 0;
    let feitos = 0;
    for (const seg of dias.filter((d) => diaDaSemana(d) === 1)) {
      let n = 0;
      for (let k = 0; k < 7; k++) {
        const d = somarDias(seg, k);
        if (d <= hoje && (qtd.get(d) ?? 0) >= meta) n++;
      }
      if (n >= vezes) {
        devidos++;
        feitos++;
      } else if (somarDias(seg, 6) < hoje) devidos++;
    }
    return { tipo: "semanal" as const, devidos, feitos, porDia: [] as { dia: string; ok: boolean }[] };
  }
  for (const d of dias) {
    if (!habitoDevidoNoDia(h, d)) continue;
    const ok = (qtd.get(d) ?? 0) >= meta;
    if (d === hoje && !ok) continue; // hoje ainda está em aberto
    porDia.push({ dia: d, ok });
  }
  return { tipo: "diario" as const, devidos: porDia.length, feitos: porDia.filter((x) => x.ok).length, porDia };
}

const taxaDe = (f: number, d: number) => (d > 0 ? Math.round((f / d) * 100) : null);

export function relatorioDoMes(s: any, mes: string, hoje: string): RelatorioMes {
  const fimMes = somarDias(`${mesSeguinte(mes)}-01`, -1);
  const ate = fimMes < hoje ? fimMes : hoje;
  const completo = fimMes < hoje;
  const anterior = mesAnterior(mes);
  const fimAnterior = somarDias(`${mes}-01`, -1);
  const checkins = (s?.habitoCheckins ?? []) as Checkin[];
  const habitos = ((s?.habitos ?? []) as any[]).filter((h) => !h.arquivado && String(h.criado_em ?? "").slice(0, 10) <= ate);

  const linhas: LinhaHabito[] = [];
  const diasMes = diasDoMes(mes, ate);
  const porDia = new Map<string, { devidos: number; feitos: number }>();
  let melhorSeq: { nome: string; dias: number } | null = null;
  let devAntes = 0;
  let feitosAntes = 0;

  for (const h of habitos) {
    const qtd = qtdPorDia(h, checkins);
    const l = linhaDoMes(h, qtd, mes, ate, hoje);
    const antes = linhaDoMes(h, qtd, anterior, fimAnterior, hoje);
    devAntes += antes.devidos;
    feitosAntes += antes.feitos;
    // sequência dentro do mês (dias que valiam, seguidos)
    let seq = 0;
    let melhor = 0;
    for (const x of l.porDia) {
      seq = x.ok ? seq + 1 : 0;
      melhor = Math.max(melhor, seq);
    }
    if (l.tipo === "diario") {
      for (const x of l.porDia) {
        const r = porDia.get(x.dia) ?? { devidos: 0, feitos: 0 };
        r.devidos++;
        if (x.ok) r.feitos++;
        porDia.set(x.dia, r);
      }
    }
    if (l.tipo !== "semanal" && melhor > (melhorSeq?.dias ?? 0)) melhorSeq = { nome: String(h.nome), dias: melhor };
    if (!l.devidos && !antes.devidos) continue;
    linhas.push({
      id: h.id,
      nome: String(h.nome),
      tipo: l.tipo,
      devidos: l.devidos,
      feitos: l.feitos,
      taxa: taxaDe(l.feitos, l.devidos),
      taxaAntes: taxaDe(antes.feitos, antes.devidos),
      melhorSequencia: melhor,
    });
  }

  const devidos = linhas.reduce((a, l) => a + l.devidos, 0);
  const feitos = linhas.reduce((a, l) => a + l.feitos, 0);
  const taxaAntes = taxaDe(feitosAntes, devAntes);

  const semana = Array.from({ length: 7 }, () => ({ devidos: 0, feitos: 0 }));
  let diasPerfeitos = 0;
  let diasComAlgo = 0;
  for (const d of diasMes) {
    const r = porDia.get(d);
    if (!r || !r.devidos) continue;
    const w = diaDaSemana(d);
    semana[w].devidos += r.devidos;
    semana[w].feitos += r.feitos;
    if (r.feitos === r.devidos) diasPerfeitos++;
    if (r.feitos > 0) diasComAlgo++;
  }
  const porDiaSemana = semana.map((x, dia) => ({ dia, taxa: x.devidos >= 3 ? taxaDe(x.feitos, x.devidos) : null }));
  const validos = porDiaSemana.filter((x) => x.taxa !== null) as { dia: number; taxa: number }[];
  const melhorDia = validos.length >= 2 ? validos.reduce((a, b) => (b.taxa > a.taxa ? b : a)).dia : null;
  const piorDia = validos.length >= 2 ? validos.reduce((a, b) => (b.taxa < a.taxa ? b : a)).dia : null;

  const comBase = linhas.filter((l) => l.devidos >= 4 && l.taxa !== null);
  const destaque = comBase.length ? comBase.reduce((a, b) => ((b.taxa ?? 0) > (a.taxa ?? 0) || ((b.taxa ?? 0) === (a.taxa ?? 0) && b.devidos > a.devidos) ? b : a)) : null;
  const quedas = comBase.filter((l) => l.taxaAntes !== null && (l.taxaAntes ?? 0) - (l.taxa ?? 0) >= 15);
  const queda = quedas.length ? quedas.reduce((a, b) => ((b.taxaAntes! - b.taxa!) > (a.taxaAntes! - a.taxa!) ? b : a)) : null;

  const taxa = taxaDe(feitos, devidos);
  const sugestoes: string[] = [];
  if (queda) sugestoes.push(`“${queda.nome}” caiu de ${queda.taxaAntes}% pra ${queda.taxa}%. Diminuir a meta ou trocar o horário do lembrete pode ajudar a voltar.`);
  const parado = comBase.find((l) => (l.taxa ?? 0) < 30 && l.devidos >= 8 && l.tipo === "diario" && l !== queda);
  if (parado) sugestoes.push(`“${parado.nome}” quase não saiu do papel (${parado.taxa}%). Que tal transformar em “3 vezes por semana”?`);
  if (melhorDia !== null && piorDia !== null) {
    const tm = validos.find((x) => x.dia === melhorDia)!.taxa;
    const tp = validos.find((x) => x.dia === piorDia)!.taxa;
    if (tm - tp >= 25) {
      const [ap, np] = PLURAL_DIA[piorDia];
      const [am, nm] = PLURAL_DIA[melhorDia];
      sugestoes.push(`${ap === "os" ? "Os" : "As"} ${np} são o dia mais difícil (${tp}% contra ${tm}% n${am} ${nm}). Deixe só o essencial nesse dia ou ponha um lembrete extra.`);
    }
  }
  if (linhas.length >= 8 && taxa !== null && taxa < 50) sugestoes.push("Muitos hábitos ao mesmo tempo. Pausar alguns e focar em 3 costuma dar mais resultado.");
  if (taxa !== null && taxa >= 85) sugestoes.push("Mês excelente! Que tal um desafio de 30 dias pra subir o nível? 🥇");
  if (!sugestoes.length && taxa !== null) sugestoes.push("Bom ritmo! Escolha um hábito pra puxar um pouco mais no próximo mês.");

  return {
    mes,
    completo,
    devidos,
    feitos,
    taxa,
    taxaAntes,
    diasPerfeitos,
    diasComAlgo,
    melhorSequencia: melhorSeq,
    porDiaSemana,
    melhorDia,
    piorDia,
    habitos: linhas.sort((a, b) => (b.taxa ?? -1) - (a.taxa ?? -1)),
    destaque,
    queda,
    sugestoes,
  };
}
