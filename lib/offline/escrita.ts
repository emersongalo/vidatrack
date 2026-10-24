// Etapa 353 — "escrita simples" numa tabela (o que várias telas faziam
// direto pelo Supabase do aparelho). Descrita como dado, ela pode ser
// executada na hora (com internet) ou guardada na fila (sem internet).
import type { Colecao, Patch } from "@/lib/offline/patches";

export type Escrita = {
  tabela: string;
  op: "update" | "insert" | "upsert" | "delete";
  /** update/delete: qual linha (pelo id) */
  id?: string;
  valores?: Record<string, unknown>;
  /** upsert: colunas do "já existe" (ex.: "dono_id,data") */
  onConflict?: string;
};

/** tabelas (e operações) que podem ser gravadas assim — as regras do banco (RLS) valem igual */
export const TABELAS_ESCRITA: Record<string, Escrita["op"][]> = {
  habitos: ["update", "insert"],
  tarefas: ["update"],
  financa_transacoes: ["update"],
  financa_categorias: ["update"],
  diario_dias: ["upsert"],
  metas_longas: ["insert", "update"],
  perfis: ["update"],
  habito_interacoes: ["update"],
  mensagens_suporte: ["insert"],
  // Etapa 354
  blocos_tempo: ["insert", "update", "delete"],
  divisoes_despesa: ["update", "delete"],
  categorias_produtividade: ["insert", "delete"],
  financa_recorrencias: ["insert"],
};

const COLECAO: Record<string, Colecao> = {
  habitos: "habitos",
  tarefas: "tarefas",
  financa_transacoes: "financas.transacoes",
  financa_categorias: "financas.categorias",
  metas_longas: "metasLongas",
  categorias_produtividade: "categoriasProdutividade",
  financa_recorrencias: "financas.recorrencias",
};

export function escritaValida(e: Escrita): string | null {
  if (!e || typeof e !== "object") return "Escrita inválida";
  const ops = TABELAS_ESCRITA[e.tabela];
  if (!ops || !ops.includes(e.op)) return `Não dá pra gravar em ${e.tabela} assim`;
  if ((e.op === "update" || e.op === "delete") && !e.id) return "Falta o id";
  if (e.op !== "delete" && (!e.valores || typeof e.valores !== "object")) return "Faltam os valores";
  return null;
}

/** o que muda no retrato do aparelho com essa escrita */
export function patchesDaEscrita(e: Escrita): Patch[] {
  const v = e.valores ?? {};
  if (e.tabela === "perfis" && e.op === "update") {
    const { ordem_blocos_financas, ...resto } = v as any;
    const lista: Patch[] = [{ op: "mesclarObjeto", caminho: "perfil", valores: resto }];
    if (ordem_blocos_financas !== undefined) lista.push({ op: "mesclarObjeto", caminho: "financas", valores: { ordemBlocosFinancas: ordem_blocos_financas } });
    return lista;
  }
  if (e.tabela === "diario_dias" && typeof v.data === "string") {
    return [{ colecao: "diario", op: "upsert", chave: "data", id: v.data, valores: { humor: v.humor ?? null, texto: v.texto ?? null } }];
  }
  const colecao = COLECAO[e.tabela];
  if (!colecao) return [];
  if (e.op === "delete" && e.id) return [{ colecao, op: "remover", id: e.id }];
  if (e.op === "update" && e.id) {
    // arquivar = some das listas (o retrato só tem os ativos)
    if (v.arquivado === true || v.arquivada === true) return [{ colecao, op: "remover", id: e.id }];
    return [{ colecao, op: "mesclar", id: e.id, valores: v }];
  }
  if ((e.op === "insert" || e.op === "upsert") && typeof v.id === "string") return [{ colecao, op: "upsert", id: v.id, valores: v }];
  return [];
}
