// Etapa 218 — metas de longo prazo (ex: "Ler 12 livros em 2026")
export type MetaLonga = {
  id: string;
  nome: string;
  emoji: string | null;
  alvo: number;
  unidade: string | null;
  data_inicio: string;
  data_fim: string;
  habito_id: string | null;
  progresso: number;
};

function dias(a: string, b: string) {
  return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000);
}

export function progressoMeta(
  meta: MetaLonga,
  checkins: { habito_id: string; data: string; quantidade?: number | null }[],
  hojeISO: string
) {
  const feito = meta.habito_id
    ? checkins
        .filter((c) => c.habito_id === meta.habito_id && c.data >= meta.data_inicio && c.data <= meta.data_fim)
        .reduce((s, c) => s + Number(c.quantidade ?? 1), 0)
    : Number(meta.progresso) || 0;
  const alvo = Number(meta.alvo);
  const pct = alvo > 0 ? Math.min(100, Math.round((feito / alvo) * 100)) : 0;
  const total = Math.max(1, dias(meta.data_inicio, meta.data_fim) + 1);
  const passados = Math.min(total, Math.max(0, dias(meta.data_inicio, hojeISO) + 1));
  const esperado = Math.round(((alvo * passados) / total) * 10) / 10;
  const restantesDias = Math.max(0, dias(hojeISO, meta.data_fim));
  const concluida = feito >= alvo;
  const encerrada = hojeISO > meta.data_fim;
  let status: "concluida" | "adiantada" | "no_ritmo" | "atrasada" | "encerrada";
  if (concluida) status = "concluida";
  else if (encerrada) status = "encerrada";
  else if (feito >= esperado + alvo * 0.05) status = "adiantada";
  else if (feito >= esperado - alvo * 0.05) status = "no_ritmo";
  else status = "atrasada";
  const faltam = Math.max(0, alvo - feito);
  const semanasRestantes = Math.max(1, restantesDias / 7);
  return {
    feito: Math.round(feito * 10) / 10,
    pct,
    esperado,
    status,
    faltam,
    restantesDias,
    porSemana: concluida || encerrada ? null : Math.ceil((faltam / semanasRestantes) * 10) / 10,
  };
}
