// Etapa 312 — trilhas (hábitos prontos pra adicionar com um toque) e
// desafios de 7, 21 ou 30 dias com medalha no final. O desafio fica
// salvo no JSON do mascote; o progresso sai dos check-ins do hábito.
import { somarDiasISO, type DadosMascote, type DesafioSalvo } from "@/lib/mascote/mascote";

export type ModeloHabito = {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  meta?: number;
  unidade?: string;
  /** hábito de parar (conta o dia em que NÃO escorregou) */
  negativo?: boolean;
  dica: string;
};

export type Trilha = { id: string; nome: string; emoji: string; descricao: string; modelos: ModeloHabito[] };

export const TRILHAS: Trilha[] = [
  {
    id: "corpo",
    nome: "Corpo em dia",
    emoji: "💪",
    descricao: "Pequenos cuidados que somam muito no fim do mês.",
    modelos: [
      { id: "agua", nome: "Beber água", icone: "Droplet", cor: "azul", meta: 8, unidade: "copos", dica: "Deixe uma garrafa à vista. 8 copos ≈ 2 litros." },
      { id: "caminhar", nome: "Caminhar 30 min", icone: "Footprints", cor: "verde", dica: "Vale ir a pé pra padaria e voltar pelo caminho mais longo." },
      { id: "alongar", nome: "Alongar 5 min", icone: "Dumbbell", cor: "laranja", dica: "Logo ao acordar, antes de pegar o celular." },
      { id: "fruta", nome: "Comer uma fruta", icone: "Apple", cor: "rosa", dica: "Deixe as frutas na fruteira, não na geladeira." },
      { id: "dormir", nome: "Dormir antes das 23h", icone: "Moon", cor: "roxo", dica: "Um alarme às 22:30 avisando que é hora de desacelerar." },
    ],
  },
  {
    id: "mente",
    nome: "Mente tranquila",
    emoji: "🧘",
    descricao: "Menos ansiedade, mais presença.",
    modelos: [
      { id: "meditar", nome: "Meditar 5 min", icone: "Flower2", cor: "roxo", dica: "Só respirar e contar até 10, várias vezes." },
      { id: "gratidao", nome: "Escrever 3 gratidões", icone: "NotebookPen", cor: "laranja", dica: "Coisas pequenas valem: um café gostoso, uma mensagem." },
      { id: "ler", nome: "Ler 10 páginas", icone: "BookOpen", cor: "habito", meta: 10, unidade: "páginas", dica: "Deixe o livro no travesseiro." },
      { id: "semtela", nome: "Sem celular antes de dormir", icone: "PhoneOff", cor: "ciano", dica: "Carregue o celular longe da cama." },
    ],
  },
  {
    id: "aprender",
    nome: "Aprender todo dia",
    emoji: "🎓",
    descricao: "15 minutos por dia viram 90 horas num ano.",
    modelos: [
      { id: "idioma", nome: "Estudar idioma 15 min", icone: "GraduationCap", cor: "azul", dica: "Um app de idioma no lugar da rede social da fila." },
      { id: "aula", nome: "Assistir uma aula do curso", icone: "Library", cor: "roxo", dica: "Marque um horário fixo, como compromisso." },
      { id: "podcast", nome: "Ouvir um podcast", icone: "Headphones", cor: "ciano", dica: "No trânsito ou lavando a louça." },
      { id: "instrumento", nome: "Praticar instrumento", icone: "Music2", cor: "rosa", dica: "10 minutos todo dia valem mais que 2 horas no domingo." },
    ],
  },
  {
    id: "casa",
    nome: "Casa organizada",
    emoji: "🏡",
    descricao: "Um pouquinho por dia e a casa nunca vira bagunça.",
    modelos: [
      { id: "cama", nome: "Arrumar a cama", icone: "Sunrise", cor: "laranja", dica: "A primeira vitória do dia leva 1 minuto." },
      { id: "louca", nome: "Não dormir com louça na pia", icone: "Sparkles", cor: "ciano", dica: "Lave enquanto a água do café esquenta." },
      { id: "organizar", nome: "Organizar 10 min", icone: "Brush", cor: "verde", dica: "Um cômodo por dia, com timer." },
      { id: "plantas", nome: "Regar as plantas", icone: "Sprout", cor: "verde", dica: "Junto com o café da manhã." },
      { id: "pet", nome: "Passear com o pet", icone: "PawPrint", cor: "laranja", dica: "Ele agradece e você caminha junto." },
    ],
  },
  {
    id: "dinheiro",
    nome: "Dinheiro sob controle",
    emoji: "💰",
    descricao: "Combina com a aba Finanças: anote, segure o impulso, guarde.",
    modelos: [
      { id: "anotar", nome: "Anotar os gastos do dia", icone: "Coins", cor: "financa", dica: "À noite, abra Finanças e lance tudo em 1 minuto." },
      { id: "guardar", nome: "Guardar um trocado", icone: "Coins", cor: "financa", dica: "Até R$ 5 por dia viram mais de R$ 1.800 no ano." },
      { id: "semdelivery", nome: "Sem delivery", icone: "Ban", cor: "rosa", negativo: true, dica: "Marque só se escorregar — o dia limpo conta sozinho." },
      { id: "semimpulso", nome: "Sem compra por impulso", icone: "Ban", cor: "laranja", negativo: true, dica: "Viu algo? Espere 48h antes de comprar." },
    ],
  },
  {
    id: "parar",
    nome: "Largar um hábito",
    emoji: "🚭",
    descricao: "Hábitos de parar: você só marca quando escorregar.",
    modelos: [
      { id: "refri", nome: "Sem refrigerante", icone: "Ban", cor: "rosa", negativo: true, dica: "Troque por água com gás e limão." },
      { id: "doce", nome: "Sem doce", icone: "Ban", cor: "laranja", negativo: true, dica: "Fruta depois do almoço segura a vontade." },
      { id: "fumar", nome: "Sem cigarro", icone: "Ban", cor: "neutro", negativo: true, dica: "Anote quanto economiza por dia no hábito." },
      { id: "redes", nome: "Sem rede social pela manhã", icone: "PhoneOff", cor: "ciano", negativo: true, dica: "Tire os apps da tela inicial." },
    ],
  },
];

export function modeloPorId(id: string): ModeloHabito | null {
  for (const t of TRILHAS) for (const m of t.modelos) if (m.id === id) return m;
  return null;
}

// ---------------- desafios ----------------

export type Duracao = 7 | 21 | 30;
export const DESAFIOS: { dias: Duracao; folga: number; medalha: "bronze" | "prata" | "ouro"; emoji: string; premio: number }[] = [
  { dias: 7, folga: 1, medalha: "bronze", emoji: "🥉", premio: 70 },
  { dias: 21, folga: 3, medalha: "prata", emoji: "🥈", premio: 250 },
  { dias: 30, folga: 4, medalha: "ouro", emoji: "🥇", premio: 400 },
];
export const infoDesafio = (dias: number) => DESAFIOS.find((d) => d.dias === dias) ?? DESAFIOS[0];

type Checkin = { habito_id: string; data: string; quantidade?: number | null; usuario_id?: string | null };

/** O dia valeu? (hábito normal: bateu a meta; hábito de parar: não escorregou) */
export function diaValeu(habito: any, checkins: Checkin[], dia: string, eu?: string): boolean {
  const meus = checkins.filter((c) => c.habito_id === habito.id && c.data === dia && (!eu || !c.usuario_id || c.usuario_id === eu));
  if (habito.eh_negativo) return meus.length === 0;
  const meta = Math.max(1, Number(habito.meta_diaria) || 1);
  return meus.reduce((s, c) => s + Number(c.quantidade ?? 1), 0) >= meta;
}

export type EstadoDesafio = {
  status: "ativo" | "pronto" | "perdido" | "medalha" | "desistiu";
  feitos: number;
  dias: number;
  /** último dia da janela (dias + folga) */
  limite: string;
  /** quantas faltas ainda pode ter */
  folgaRestante: number;
  /** um quadradinho por dia da janela: ok, falta, hoje (em aberto), futuro */
  grade: ("ok" | "falta" | "hoje" | "futuro")[];
};

export function estadoDoDesafio(d: DesafioSalvo, habito: any | null, checkins: Checkin[], hoje: string, eu?: string): EstadoDesafio {
  const info = infoDesafio(d.dias);
  const janela = d.dias + info.folga;
  const limite = somarDiasISO(d.inicio, janela - 1);
  const grade: EstadoDesafio["grade"] = [];
  let feitos = 0;
  let faltas = 0;
  for (let i = 0; i < janela; i++) {
    const dia = somarDiasISO(d.inicio, i);
    if (dia > hoje) {
      grade.push("futuro");
      continue;
    }
    // hábito de parar: o dia de hoje só "conta" quando acabar
    const ok = habito ? diaValeu(habito, checkins, dia, eu) && !(habito.eh_negativo && dia === hoje) : false;
    if (ok) {
      feitos++;
      grade.push("ok");
    } else if (dia === hoje) grade.push("hoje");
    else {
      faltas++;
      grade.push("falta");
    }
  }
  feitos = Math.min(feitos, d.dias);
  const folgaRestante = Math.max(0, info.folga - faltas);
  let status: EstadoDesafio["status"];
  if (d.resultado === "medalha") status = "medalha";
  else if (d.resultado === "desistiu") status = "desistiu";
  else if (d.resultado === "perdeu") status = "perdido";
  else if (!habito) status = "perdido";
  else if (feitos >= d.dias) status = "pronto";
  else if (faltas > info.folga || hoje > limite) status = "perdido";
  else status = "ativo";
  return { status, feitos, dias: d.dias, limite, folgaRestante, grade };
}

function novoId(hoje: string, habitoId: string) {
  return `${hoje.replace(/-/g, "")}${habitoId.slice(0, 6)}${Math.floor(Math.random() * 1e4)}`;
}

/** Desafio em andamento (sem resultado) de um hábito. */
export function desafioAtivo(m: DadosMascote | null, habitoId: string): DesafioSalvo | null {
  return (m?.desafios ?? []).find((d) => d.habitoId === habitoId && !d.resultado) ?? null;
}

export function comecarDesafio(m: DadosMascote, habitoId: string, dias: Duracao, hoje: string): DadosMascote | null {
  if (desafioAtivo(m, habitoId)) return null;
  const d: DesafioSalvo = { id: novoId(hoje, habitoId), habitoId, dias, inicio: hoje };
  return { ...m, desafios: [...(m.desafios ?? []), d].slice(-40) };
}

function fechar(m: DadosMascote, id: string, resultado: NonNullable<DesafioSalvo["resultado"]>, hoje: string): DadosMascote {
  return { ...m, desafios: (m.desafios ?? []).map((d) => (d.id === id ? { ...d, resultado, fim: hoje } : d)) };
}

export function pegarMedalha(m: DadosMascote, d: DesafioSalvo, estado: EstadoDesafio, hoje: string): DadosMascote | null {
  if (d.resultado || estado.status !== "pronto") return null;
  const r = fechar(m, d.id, "medalha", hoje);
  return { ...r, bonus: (m.bonus ?? 0) + infoDesafio(d.dias).premio };
}

export function desistirDesafio(m: DadosMascote, d: DesafioSalvo, hoje: string): DadosMascote {
  return fechar(m, d.id, "desistiu", hoje);
}

/** Perdeu? Fecha como "perdeu" e já começa outro do mesmo tamanho a partir de hoje. */
export function recomecarDesafio(m: DadosMascote, d: DesafioSalvo, hoje: string): DadosMascote {
  const fechado = fechar(m, d.id, "perdeu", hoje);
  return comecarDesafio(fechado, d.habitoId, d.dias, hoje) ?? fechado;
}

export function medalhas(m: DadosMascote | null) {
  const l = (m?.desafios ?? []).filter((d) => d.resultado === "medalha");
  return { bronze: l.filter((d) => d.dias === 7).length, prata: l.filter((d) => d.dias === 21).length, ouro: l.filter((d) => d.dias === 30).length, total: l.length };
}

/** Já tem esse hábito? (mesmo nome, sem ligar pra maiúsculas e acentos) */
export function habitoDoModelo(habitos: any[], modelo: ModeloHabito): any | null {
  const n = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  return habitos.find((h) => !h.arquivado && n(String(h.nome ?? "")) === n(modelo.nome)) ?? null;
}
