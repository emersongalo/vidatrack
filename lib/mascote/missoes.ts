// Etapa 309 — missões do dia e baú da semana. Todo dia saem 3 missões
// (sempre as mesmas pro mesmo dia e pessoa), montadas a partir dos seus
// hábitos. Cumpriu? Resgata as moedas. Fechou as 3 em 5 dias da semana?
// Abre o baú com um prêmio surpresa. Tudo calculado do retrato; no banco
// só fica o que foi resgatado (dentro do JSON do mascote).
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";
import { calcularStreak } from "@/lib/habitos/streak";
import { duplasDoRetrato } from "@/lib/habitos/dupla";
import { resumoDoDia } from "@/lib/painel/seuDia";
import { somarDiasISO, type DadosMascote } from "@/lib/mascote/mascote";
import { MOVEIS } from "@/lib/mascote/casa";

export type Missao = { id: string; titulo: string; emoji: string; premio: number; atual: number; meta: number; feita: boolean };

export const MISSOES_POR_DIA = 3;
export const DIAS_PRO_BAU = 5;

function semente(texto: string) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Embaralha de forma previsível (mesmo dia = mesmas missões). */
function embaralhar<T>(l: T[], seed: number): T[] {
  const r = [...l];
  let s = seed || 1;
  for (let i = r.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const j = s % (i + 1);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function feitoNoDia(h: any, checkins: any[], dia: string) {
  const meta = Math.max(1, Number(h.meta_diaria) || 1);
  const q = checkins.filter((c) => c.habito_id === h.id && c.data === dia).reduce((s, c) => s + Number(c.quantidade ?? 1), 0);
  return q >= meta;
}

export function missoesDoDia(s: any, hoje: string, m: DadosMascote | null, hora = new Date().getHours()): Missao[] {
  if (!s) return [];
  const checkins = (s.habitoCheckins ?? []) as any[];
  const dia = resumoDoDia(s, hoje);
  const devidos = ((s.habitos ?? []) as any[]).filter((h) => !h.eh_negativo && !h.arquivado && habitoDevidoNoDia(h, hoje));
  if (!devidos.length) return [];
  const seed = semente(`${hoje}|${s.perfil?.id ?? ""}`);
  const lista: Missao[] = [];

  // 1) sempre: fazer N hábitos
  const n = Math.min(3, dia.habitos.total);
  lista.push({ id: "feitos", titulo: `Faça ${n} ${n === 1 ? "hábito" : "hábitos"} hoje`, emoji: "✅", premio: 20, atual: Math.min(n, dia.habitos.feitos), meta: n, feita: dia.habitos.feitos >= n });

  // possíveis extras
  const extras: Missao[] = [];
  if (dia.habitos.total >= 2) {
    extras.push({ id: "completo", titulo: "Complete todos os hábitos do dia", emoji: "🌟", premio: 40, atual: dia.habitos.feitos, meta: dia.habitos.total, feita: dia.habitos.feitos >= dia.habitos.total });
  }
  // o mais esquecido (devido hoje e sem fazer há mais tempo)
  const ultimo = (h: any) => {
    const meta = Math.max(1, Number(h.meta_diaria) || 1);
    const soma = new Map<string, number>();
    for (const c of checkins) if (c.habito_id === h.id) soma.set(c.data, (soma.get(c.data) ?? 0) + Number(c.quantidade ?? 1));
    return [...soma.entries()].filter(([d, q]) => q >= meta && d < hoje).map(([d]) => d).sort().pop() ?? "0000-00-00";
  };
  const esquecido = [...devidos].sort((a, b) => ultimo(a).localeCompare(ultimo(b)))[0];
  if (esquecido && ultimo(esquecido) < somarDiasISO(hoje, -2)) {
    const ok = feitoNoDia(esquecido, checkins, hoje);
    extras.push({ id: "esquecido", titulo: `Volte a fazer “${String(esquecido.nome).slice(0, 28)}”`, emoji: "🔄", premio: 30, atual: ok ? 1 : 0, meta: 1, feita: ok });
  }
  // a maior sequência
  const comSeq = devidos
    .map((h) => {
      const datas = checkins.filter((c) => c.habito_id === h.id && Number(c.quantidade ?? 1) >= Math.max(1, Number(h.meta_diaria) || 1)).map((c) => c.data);
      return { h, seq: calcularStreak(datas, (h.pausas ?? []) as any, hoje) };
    })
    .sort((a, b) => b.seq - a.seq)[0];
  if (comSeq && comSeq.seq >= 3) {
    const ok = feitoNoDia(comSeq.h, checkins, hoje);
    extras.push({ id: "sequencia", titulo: `Não quebre a sequência de “${String(comSeq.h.nome).slice(0, 24)}” (${comSeq.seq} 🔥)`, emoji: "🔥", premio: 20, atual: ok ? 1 : 0, meta: 1, feita: ok });
  }
  // dupla
  const duplas = duplasDoRetrato(s, hoje, hora).filter((d) => habitoDevidoNoDia(d.habito, hoje));
  if (duplas.length) {
    const ok = duplas.some((d) => d.info.euFiz);
    extras.push({ id: "dupla", titulo: "Faça um hábito em dupla", emoji: "🤝", premio: 30, atual: ok ? 1 : 0, meta: 1, feita: ok });
  }
  // cuidar do mascote
  if (m) {
    const deu = (m.consumos ?? []).some((c) => c.d === hoje && c.t !== "adubo");
    extras.push({ id: "alimentar", titulo: `Dê uma comidinha pro ${m.nome}`, emoji: "🍎", premio: 15, atual: deu ? 1 : 0, meta: 1, feita: deu });
  }
  // diário
  const escreveu = ((s.diario ?? []) as any[]).some((d) => d.data === hoje);
  extras.push({ id: "diario", titulo: "Conte como foi seu dia (humor)", emoji: "🙂", premio: 15, atual: escreveu ? 1 : 0, meta: 1, feita: escreveu });
  // tarefa
  if (dia.tarefas.total > 0) {
    extras.push({ id: "tarefa", titulo: "Conclua uma tarefa", emoji: "📝", premio: 15, atual: Math.min(1, dia.tarefas.feitas), meta: 1, feita: dia.tarefas.feitas >= 1 });
  }

  for (const e of embaralhar(extras, seed)) {
    if (lista.length >= MISSOES_POR_DIA) break;
    if (e.id === "completo" && n >= dia.habitos.total) continue; // seria igual à primeira
    lista.push(e);
  }
  return lista;
}

export function resgatadas(m: DadosMascote | null, dia: string): string[] {
  return m?.missoes?.[dia] ?? [];
}

export function resgatarMissao(m: DadosMascote, missao: Missao, hoje: string): DadosMascote | null {
  if (!missao.feita || resgatadas(m, hoje).includes(missao.id)) return null;
  const missoes = { ...(m.missoes ?? {}), [hoje]: [...resgatadas(m, hoje), missao.id] };
  // guarda só as 3 últimas semanas
  const limite = somarDiasISO(hoje, -21);
  for (const d of Object.keys(missoes)) if (d < limite) delete missoes[d];
  return { ...m, missoes, bonus: (m.bonus ?? 0) + missao.premio };
}

/** Segunda-feira da semana do dia. */
export function semanaDe(dia: string) {
  const d = new Date(dia + "T12:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7; // 0 = segunda
  return somarDiasISO(dia, -dow);
}

/** Dias da semana (seg→dom) e se fechou as 3 missões. */
export function semanaDoBau(m: DadosMascote | null, hoje: string) {
  const seg = semanaDe(hoje);
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = somarDiasISO(seg, i);
    return { dia: d, completo: resgatadas(m, d).length >= MISSOES_POR_DIA, hoje: d === hoje, futuro: d > hoje };
  });
  const completos = dias.filter((d) => d.completo).length;
  const aberto = !!m?.baus?.includes(seg);
  return { semana: seg, dias, completos, aberto, disponivel: completos >= DIAS_PRO_BAU && !aberto };
}

export type Premio = { tipo: "moedas" | "pacote" | "movel"; texto: string; emoji: string };

/** Abre o baú da semana: um prêmio surpresa (sempre o mesmo pra mesma semana). */
export function abrirBau(m: DadosMascote, hoje: string): { mascote: DadosMascote; premio: Premio } | null {
  const info = semanaDoBau(m, hoje);
  if (!info.disponivel) return null;
  const seed = semente(`bau|${info.semana}|${m.nome}`);
  const baus = [...(m.baus ?? []), info.semana].slice(-20);
  const sorteio = seed % 10;
  if (sorteio < 4) {
    const v = 120 + (seed % 5) * 20;
    return { mascote: { ...m, baus, bonus: (m.bonus ?? 0) + v }, premio: { tipo: "moedas", texto: `${v} moedas`, emoji: "🪙" } };
  }
  if (sorteio < 7) {
    const estoque = { ...(m.estoque ?? {}) };
    for (const [id, q] of [["sanduiche", 2], ["bolo", 1], ["remedio", 1], ["adubo", 1]] as const) estoque[id] = Math.min(99, (estoque[id] ?? 0) + q);
    return { mascote: { ...m, baus, estoque }, premio: { tipo: "pacote", texto: "Cesta: 2 sanduíches, bolo, remédio e adubo", emoji: "🧺" } };
  }
  // móvel surpresa pra casa (algo que ainda não tem)
  const casa = m.casa ?? { comodos: { quarto: { piso: "madeira", parede: "creme", itens: [] } }, moveis: {}, estilos: [] };
  const opcoes = MOVEIS.filter((x) => x.preco >= 150 && x.preco <= 1200 && !((casa.moveis[x.id] ?? 0) > 0));
  const mv = opcoes.length ? opcoes[seed % opcoes.length] : null;
  if (!mv) {
    return { mascote: { ...m, baus, bonus: (m.bonus ?? 0) + 200 }, premio: { tipo: "moedas", texto: "200 moedas", emoji: "🪙" } };
  }
  const novaCasa = { ...casa, moveis: { ...casa.moveis, [mv.id]: (casa.moveis[mv.id] ?? 0) + 1 } };
  return { mascote: { ...m, baus, casa: novaCasa }, premio: { tipo: "movel", texto: `${mv.nome} pra sua casa (está em Guardados)`, emoji: mv.emoji } };
}
