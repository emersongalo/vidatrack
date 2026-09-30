// Etapa 233 — hábitos em dupla: carinha do dia, sequência juntos e o
// "jardim" (uma plantinha que cresce com os dias em que TODOS fizeram).
// Tudo calculado dos check-ins que já existem — nada novo gravado.
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";

export type HumorDupla =
  | "festa" // todo mundo fez hoje
  | "esperandoParceiro" // você fez, falta o outro
  | "esperandoVoce" // o outro fez, falta você
  | "tranquilo" // ninguém fez ainda (e ainda é cedo)
  | "preocupado" // ninguém fez e já está tarde
  | "triste"; // a sequência de vocês quebrou ontem

export type Parceiro = { id: string; nome: string };
type Checkin = { habito_id: string; data: string; quantidade?: number | null; usuario_id?: string | null };

export const ESTAGIOS_PLANTA = [
  { nome: "Semente", minimo: 0 },
  { nome: "Broto", minimo: 1 },
  { nome: "Mudinha", minimo: 3 },
  { nome: "Plantinha", minimo: 7 },
  { nome: "Botão", minimo: 14 },
  { nome: "Flor", minimo: 30 },
  { nome: "Árvore", minimo: 60 },
] as const;

export type InfoDupla = {
  humor: HumorDupla;
  euFiz: boolean;
  parceiros: (Parceiro & { feito: boolean })[];
  /** dias seguidos (que valiam) em que todos fizeram */
  sequencia: number;
  recorde: number;
  /** total de dias em que todos fizeram (últimos ~400 dias) */
  diasJuntos: number;
  /** 0 semente … 6 árvore */
  estagio: number;
  /** quantos dias juntos faltam pro próximo estágio (null na árvore) */
  proximoEstagioEm: number | null;
  /** 2 viçosa, 1 murchando, 0 murcha (dias recentes em que ninguém fez) */
  saude: 0 | 1 | 2;
  ultimos14: { dia: string; eu: boolean; parceiros: boolean; valia: boolean }[];
};

export function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Dias em que cada pessoa bateu a meta do hábito */
function diasFeitosPorPessoa(habito: any, checkins: Checkin[], eu: string): Map<string, Set<string>> {
  const meta = Math.max(1, Number(habito.meta_diaria) || 1);
  const soma = new Map<string, number>();
  for (const c of checkins) {
    if (c.habito_id !== habito.id) continue;
    const quem = c.usuario_id || eu; // check-in sem dono = marcado por mim neste aparelho
    const k = `${quem}|${c.data}`;
    soma.set(k, (soma.get(k) ?? 0) + Number(c.quantidade ?? 1));
  }
  const porPessoa = new Map<string, Set<string>>();
  for (const [k, q] of soma) {
    if (q < meta) continue;
    const [quem, dia] = k.split("|");
    if (!porPessoa.has(quem)) porPessoa.set(quem, new Set());
    porPessoa.get(quem)!.add(dia);
  }
  return porPessoa;
}

export function estagioDaPlanta(diasJuntos: number): { estagio: number; proximoEm: number | null } {
  let estagio = 0;
  ESTAGIOS_PLANTA.forEach((e, i) => {
    if (diasJuntos >= e.minimo) estagio = i;
  });
  const proximo = ESTAGIOS_PLANTA[estagio + 1];
  return { estagio, proximoEm: proximo ? proximo.minimo - diasJuntos : null };
}

export function infoDupla(
  habito: any,
  checkins: Checkin[],
  eu: string,
  parceiros: Parceiro[],
  hoje: string,
  hora: number
): InfoDupla {
  const porPessoa = diasFeitosPorPessoa(habito, checkins, eu);
  const meus = porPessoa.get(eu) ?? new Set<string>();
  const deles = parceiros.map((p) => porPessoa.get(p.id) ?? new Set<string>());
  const todos = (dia: string) => meus.has(dia) && deles.every((s) => s.has(dia));
  const ninguem = (dia: string) => !meus.has(dia) && deles.every((s) => !s.has(dia));
  const vale = (dia: string) => habitoDevidoNoDia(habito, dia);
  const criado = String(habito.criado_em ?? "").slice(0, 10) || "0000-00-00";

  // sequência atual: hoje ainda em aberto não quebra
  let sequencia = 0;
  for (let i = 0; i < 400; i++) {
    const dia = somarDias(hoje, -i);
    if (dia < criado) break;
    if (!vale(dia)) continue;
    if (todos(dia)) sequencia++;
    else if (i === 0) continue;
    else break;
  }

  // recorde e total juntos
  let recorde = 0;
  let corrida = 0;
  let diasJuntos = 0;
  for (let i = 399; i >= 0; i--) {
    const dia = somarDias(hoje, -i);
    if (dia < criado || !vale(dia)) continue;
    if (todos(dia)) {
      diasJuntos++;
      corrida++;
      recorde = Math.max(recorde, corrida);
    } else if (i > 0) corrida = 0;
  }

  // dias que valiam antes de hoje (pra tristeza e pra saúde da planta)
  const anteriores: string[] = [];
  for (let i = 1; i < 60 && anteriores.length < 3; i++) {
    const dia = somarDias(hoje, -i);
    if (dia < criado) break;
    if (vale(dia)) anteriores.push(dia);
  }
  const faltasRecentes = anteriores.filter(ninguem).length;
  const saude = (2 - Math.min(2, faltasRecentes)) as 0 | 1 | 2;

  const euFiz = meus.has(hoje);
  const algumParceiro = deles.some((s) => s.has(hoje));
  const quebrouOntem = anteriores.length >= 2 && !todos(anteriores[0]) && todos(anteriores[1]);

  let humor: HumorDupla;
  if (euFiz && deles.every((s) => s.has(hoje))) humor = "festa";
  else if (euFiz) humor = "esperandoParceiro";
  else if (algumParceiro) humor = "esperandoVoce";
  else if (quebrouOntem) humor = "triste";
  else if (hora >= 19 && vale(hoje)) humor = "preocupado";
  else humor = "tranquilo";

  const { estagio, proximoEm } = estagioDaPlanta(diasJuntos);

  const ultimos14 = Array.from({ length: 14 }, (_, i) => {
    const dia = somarDias(hoje, i - 13);
    return { dia, eu: meus.has(dia), parceiros: deles.every((s) => s.has(dia)), valia: vale(dia) && dia >= criado };
  });

  return {
    humor,
    euFiz,
    parceiros: parceiros.map((p, i) => ({ ...p, feito: deles[i].has(hoje) })),
    sequencia,
    recorde,
    diasJuntos,
    estagio,
    proximoEstagioEm: proximoEm,
    saude,
    ultimos14,
  };
}

/** Frase curta pra acompanhar a carinha */
export function fraseDoHumor(humor: HumorDupla, nomes: string[]): string {
  const quem = nomes.length === 1 ? nomes[0] : "o pessoal";
  switch (humor) {
    case "festa":
      return nomes.length === 1 ? `Você e ${nomes[0]} fizeram hoje!` : "Todo mundo fez hoje!";
    case "esperandoParceiro":
      return `Você fez! Falta ${quem}`;
    case "esperandoVoce":
      return `${quem} já fez — falta você`;
    case "triste":
      return "A sequência de vocês quebrou… recomecem hoje";
    case "preocupado":
      return "Tá ficando tarde… bora?";
    default:
      return "Ninguém fez ainda hoje";
  }
}

/** Primeiro nome, pra caber nos avisos */
export function primeiroNome(bruto: string | null | undefined): string {
  const s = String(bruto ?? "").trim();
  if (!s) return "Seu par";
  return s.split("@")[0].split(" ")[0].slice(0, 30);
}

export const REACOES = ["❤️", "🔥", "👏", "🙏", "💪", "😍"] as const;

/** Etapa 234 — todos os hábitos em dupla do retrato local, já calculados */
export function duplasDoRetrato(s: any, hoje: string, hora: number): { habito: any; info: InfoDupla }[] {
  if (!s) return [];
  const porHabito = new Map<string, Parceiro[]>();
  for (const p of (s.parceiros ?? []) as { habito_id: string; usuario_id: string; nome: string }[]) {
    const l = porHabito.get(p.habito_id) ?? [];
    l.push({ id: p.usuario_id, nome: p.nome });
    porHabito.set(p.habito_id, l);
  }
  if (!porHabito.size) return [];
  const checkins = [...(s.habitoCheckins ?? []), ...(s.checkinsCompartilhados ?? [])];
  return ((s.habitos ?? []) as any[])
    .filter((h) => porHabito.has(h.id) && !h.eh_negativo)
    .map((h) => ({ habito: h, info: infoDupla(h, checkins, s.perfil?.id ?? "", porHabito.get(h.id)!, hoje, hora) }));
}
