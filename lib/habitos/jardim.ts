// Etapa 282 — jardim dos hábitos: cada hábito vira uma planta que cresce
// com os dias feitos (os níveis de nivel.ts). Tudo calculado do retrato.
import { diasFeitos, nivelPorDias, type ProgressoNivel } from "@/lib/habitos/nivel";

export type PlantaJardim = {
  id: string;
  nome: string;
  icone: string | null;
  cor: string | null;
  nivel: ProgressoNivel;
  /** feito hoje? (a planta fica "regada") */
  regadaHoje: boolean;
};

export function montarJardim(
  habitos: any[],
  checkins: { habito_id: string; data: string; quantidade?: number | null; usuario_id?: string | null }[],
  hoje: string,
  meuId?: string
): PlantaJardim[] {
  const meus = meuId ? checkins.filter((c) => !c.usuario_id || c.usuario_id === meuId) : checkins;
  return habitos
    .filter((h) => !h.eh_negativo && !h.arquivado)
    .map((h) => {
      const meta = Math.max(1, Number(h.meta_diaria) || 1);
      const hojeQtd = meus.filter((c) => c.habito_id === h.id && c.data === hoje).reduce((s, c) => s + Number(c.quantidade ?? 1), 0);
      return {
        id: h.id,
        nome: h.nome,
        icone: h.icone ?? null,
        cor: h.cor ?? null,
        nivel: nivelPorDias(diasFeitos(h, meus)),
        regadaHoje: hojeQtd >= meta,
      };
    })
    .sort((a, b) => b.nivel.dias - a.nivel.dias || a.nome.localeCompare(b.nome));
}

/** Resumo do jardim: quantas plantas, dias somados e o nível médio. */
export function resumoJardim(plantas: PlantaJardim[]) {
  const dias = plantas.reduce((s, p) => s + p.nivel.dias, 0);
  const media = plantas.length ? plantas.reduce((s, p) => s + p.nivel.atual.numero, 0) / plantas.length : 0;
  return { plantas: plantas.length, dias, nivelMedio: Math.round(media * 10) / 10, regadas: plantas.filter((p) => p.regadaHoje).length };
}
