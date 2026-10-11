// Etapa 292 — hábito de tela (opcional): "Redes sociais até 1h". A regra
// fica só neste aparelho (é aqui que estão os dados de uso). O app confere
// os dias que já fecharam e marca o hábito sozinho quando ficou no limite.
import type { CategoriaTela, DiaUso } from "@/lib/tela/categorias";
import { minutosNasCategorias } from "@/lib/tela/categorias";

export const CHAVE_HABITO_TELA = "vt-habito-tela";

export type ConfigHabitoTela = {
  habitoId: string;
  limiteMin: number;
  categorias: CategoriaTela[];
  /** dia (YYYY-MM-DD) em que foi criado — antes disso não confere */
  desde: string;
  /** dias já conferidos */
  conferidos: string[];
};

export function lerConfigTela(): ConfigHabitoTela | null {
  try {
    const c = JSON.parse(localStorage.getItem(CHAVE_HABITO_TELA) ?? "null");
    return c && typeof c.habitoId === "string" ? c : null;
  } catch {
    return null;
  }
}

export function gravarConfigTela(c: ConfigHabitoTela | null) {
  try {
    if (c) localStorage.setItem(CHAVE_HABITO_TELA, JSON.stringify(c));
    else localStorage.removeItem(CHAVE_HABITO_TELA);
  } catch {}
}

export function nomeDoHabitoTela(categorias: CategoriaTela[], limiteMin: number): string {
  const tempo = limiteMin % 60 === 0 ? `${limiteMin / 60}h` : `${limiteMin} min`;
  const alvo =
    categorias.length === 1
      ? { redes: "Redes sociais", video: "Vídeos", jogos: "Jogos", mensagens: "Mensagens", musica: "Música", outros: "Celular" }[categorias[0]]
      : "Tempo de tela";
  return `${alvo} até ${tempo}`;
}

/**
 * Decide o que fazer com cada dia fechado (antes de hoje, a partir de "desde",
 * ainda não conferido): "marcar" se ficou no limite, "falhou" se passou.
 */
export function conferirDias(
  cfg: ConfigHabitoTela,
  dias: DiaUso[],
  hoje: string
): { dia: string; resultado: "marcar" | "falhou"; minutos: number }[] {
  const feitos = new Set(cfg.conferidos);
  return dias
    .filter((d) => d.dia < hoje && d.dia >= cfg.desde && !feitos.has(d.dia))
    .map((d) => {
      const minutos = minutosNasCategorias(d.apps, cfg.categorias);
      return { dia: d.dia, resultado: minutos <= cfg.limiteMin ? ("marcar" as const) : ("falhou" as const), minutos };
    });
}
