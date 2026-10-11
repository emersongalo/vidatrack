// Etapa 292 — hábito de tela (opcional): "Redes sociais até 1h". A regra
// fica só neste aparelho (é aqui que estão os dados de uso). O app confere
// os dias que já fecharam e marca o hábito sozinho quando ficou no limite.
// Etapa 295 — vários hábitos de tela, por tipo de app, por apps escolhidos
// (ex: "Instagram até 30 min") ou o celular inteiro.
import type { AppUso, CategoriaTela, DiaUso } from "@/lib/tela/categorias";
import { minutosNasCategorias, CATEGORIAS_TELA } from "@/lib/tela/categorias";

export const CHAVE_HABITO_TELA = "vt-habito-tela";

export type RegraTela = {
  habitoId: string;
  limiteMin: number;
  /** tipos de app contados (vazio = usa `apps` ou, se também vazio, o celular todo) */
  categorias: CategoriaTela[];
  /** apps escolhidos (pacotes) — quando tem, conta só eles */
  apps?: { pacote: string; nome: string }[];
  /** conta o celular inteiro */
  tudo?: boolean;
  /** dia (YYYY-MM-DD) em que foi criado — antes disso não confere */
  desde: string;
  /** dias já conferidos */
  conferidos: string[];
};
/** compatibilidade com a Etapa 292 */
export type ConfigHabitoTela = RegraTela;

/** Lê as regras salvas (aceita o formato antigo, de uma regra só). */
export function lerRegrasTela(): RegraTela[] {
  try {
    const c = JSON.parse(localStorage.getItem(CHAVE_HABITO_TELA) ?? "null");
    if (Array.isArray(c)) return c.filter((r) => r && typeof r.habitoId === "string");
    return c && typeof c.habitoId === "string" ? [c] : [];
  } catch {
    return [];
  }
}

export function gravarRegrasTela(regras: RegraTela[]) {
  try {
    if (regras.length) localStorage.setItem(CHAVE_HABITO_TELA, JSON.stringify(regras));
    else localStorage.removeItem(CHAVE_HABITO_TELA);
  } catch {}
}

/** @deprecated use lerRegrasTela — devolve a primeira regra */
export function lerConfigTela(): RegraTela | null {
  return lerRegrasTela()[0] ?? null;
}

function tempo(limiteMin: number) {
  return limiteMin % 60 === 0 ? `${limiteMin / 60}h` : `${limiteMin} min`;
}

export function nomeDaRegra(r: Pick<RegraTela, "categorias" | "apps" | "tudo" | "limiteMin">): string {
  if (r.tudo) return `Celular até ${tempo(r.limiteMin)}`;
  if (r.apps && r.apps.length) {
    const nomes = r.apps.map((a) => a.nome);
    const alvo = nomes.length <= 2 ? nomes.join(" + ") : `${nomes.slice(0, 2).join(", ")} +${nomes.length - 2}`;
    return `${alvo} até ${tempo(r.limiteMin)}`;
  }
  const alvo =
    r.categorias.length === 1
      ? { redes: "Redes sociais", video: "Vídeos", jogos: "Jogos", mensagens: "Mensagens", musica: "Música", outros: "Outros apps" }[r.categorias[0]]
      : r.categorias.length > 1
        ? r.categorias.map((c) => CATEGORIAS_TELA.find((x) => x.id === c)?.nome ?? c).join(" + ")
        : "Tempo de tela";
  return `${alvo} até ${tempo(r.limiteMin)}`;
}

/** compatibilidade com a Etapa 292 */
export function nomeDoHabitoTela(categorias: CategoriaTela[], limiteMin: number): string {
  return nomeDaRegra({ categorias, limiteMin });
}

/** Minutos que contam pra regra num dia. */
export function minutosDaRegra(apps: AppUso[], r: Pick<RegraTela, "categorias" | "apps" | "tudo">): number {
  if (r.tudo) return Math.round(apps.reduce((s, a) => s + a.minutos, 0));
  if (r.apps && r.apps.length) {
    const alvo = new Set(r.apps.map((a) => a.pacote));
    return Math.round(apps.filter((a) => alvo.has(a.pacote)).reduce((s, a) => s + a.minutos, 0));
  }
  return minutosNasCategorias(apps, r.categorias);
}

/**
 * Decide o que fazer com cada dia fechado (antes de hoje, a partir de "desde",
 * ainda não conferido): "marcar" se ficou no limite, "falhou" se passou.
 */
export function conferirDias(
  cfg: RegraTela,
  dias: DiaUso[],
  hoje: string
): { dia: string; resultado: "marcar" | "falhou"; minutos: number }[] {
  const feitos = new Set(cfg.conferidos);
  return dias
    .filter((d) => d.dia < hoje && d.dia >= cfg.desde && !feitos.has(d.dia))
    .map((d) => {
      const minutos = minutosDaRegra(d.apps, cfg);
      return { dia: d.dia, resultado: minutos <= cfg.limiteMin ? ("marcar" as const) : ("falhou" as const), minutos };
    });
}

/** Sugestões prontas pra criar com um toque. */
export const SUGESTOES_TELA: { titulo: string; emoji: string; regra: Pick<RegraTela, "categorias" | "tudo" | "limiteMin"> }[] = [
  { titulo: "Redes sociais até 1h", emoji: "📱", regra: { categorias: ["redes"], limiteMin: 60 } },
  { titulo: "Vídeos até 1h", emoji: "🎬", regra: { categorias: ["video"], limiteMin: 60 } },
  { titulo: "Jogos até 1h", emoji: "🎮", regra: { categorias: ["jogos"], limiteMin: 60 } },
  { titulo: "Redes + vídeos até 2h", emoji: "🌀", regra: { categorias: ["redes", "video"], limiteMin: 120 } },
  { titulo: "Celular até 3h", emoji: "📵", regra: { categorias: [], tudo: true, limiteMin: 180 } },
];
