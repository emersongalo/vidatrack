"use client";

// Etapa 353 — criar hábito / tarefa "rápidos" (sugestões, trilhas, tarefa
// da lista) sem internet: nascem no aparelho com o id definitivo.
import { gravar } from "@/lib/local/gravar";
import { novoUuid, semInternet } from "@/lib/local/acaoOffline";
import { sincronizarAgora } from "@/lib/local/financas";
import { adicionarNaFila } from "@/lib/offline/fila";
import { lerSnapshotOffline, salvarSnapshotOffline } from "@/lib/offline/snapshot";
import { EVENTO_SNAPSHOT } from "@/lib/offline/useSnapshot";

export { semInternet };

/** hábito novo (valores no formato da tabela) — devolve o id */
export async function criarHabitoLocal(valores: Record<string, unknown>): Promise<{ id?: string; erro?: string }> {
  const snap = lerSnapshotOffline();
  if (!snap?.perfil.id) return { erro: "Abra o app com internet uma vez antes." };
  const id = novoUuid();
  const linha = { frequencia: "diaria", dias_semana: [], meta_diaria: 1, ...valores, id, dono_id: snap.perfil.id, ordem: snap.habitos.length };
  const { error } = await gravar(
    { tabela: "habitos", op: "insert", valores: linha },
    { patches: [{ colecao: "habitos", op: "upsert", id, valores: { ...linha, criado_em: new Date().toISOString(), pausas: [] } }], rotulo: `Novo hábito "${valores.nome}"` }
  );
  return error ? { erro: error.message } : { id };
}

/** tarefa rápida (só o título) — usa a mesma fila do "+ Nova tarefa" */
export function criarTarefaRapidaLocal(dados: { titulo: string; categoriaId?: string | null; data: string; prioridade?: number }): { erro?: string } {
  const titulo = dados.titulo.trim().slice(0, 200);
  if (!titulo) return { erro: "Escreva a tarefa" };
  const entradas: [string, string][] = [
    ["titulo", titulo],
    ["icone", "NotebookPen"],
    ["repetir", "nenhuma"],
    ["data", dados.data],
    ["prioridade", String(dados.prioridade ?? 0)],
  ];
  if (dados.categoriaId) entradas.push(["categoriaId", dados.categoriaId]);
  adicionarNaFila({ id: novoUuid(), tipo: "criar_tarefa", entradas });
  // regrava o retrato: a tarefa da fila aparece na hora (aplicarPendentes)
  const snap = lerSnapshotOffline();
  if (snap) {
    salvarSnapshotOffline({ ...snap });
    try {
      window.dispatchEvent(new Event(EVENTO_SNAPSHOT));
    } catch {}
  }
  sincronizarAgora();
  return {};
}

/** ordem dos blocos de Finanças (perfil) */
export async function gravarOrdemBlocosFinancas(ordem: unknown) {
  const id = lerSnapshotOffline()?.perfil.id;
  if (!id) return;
  await gravar({ tabela: "perfis", op: "update", id, valores: { ordem_blocos_financas: ordem } });
}

/** Etapa 354 — conta fixa sugerida (cobrança que se repete) */
export async function criarRecorrenciaSugeridaLocal(
  d: { contaId: string; categoriaId: string | null; valor: number; descricao: string; diaMes: number; dataInicio: string },
  donoId: string
): Promise<{ erro?: string }> {
  const valor = Math.round(Number(d.valor) * 100) / 100;
  const diaMes = Math.trunc(Number(d.diaMes));
  if (!(valor > 0) || !(diaMes >= 1 && diaMes <= 28)) return { erro: "Dados inválidos" };
  const id = novoUuid();
  const valores = {
    id,
    dono_id: donoId,
    conta_id: d.contaId,
    categoria_id: d.categoriaId,
    tipo: "despesa",
    valor,
    descricao: String(d.descricao).slice(0, 200),
    dia_mes: diaMes,
    data_inicio: d.dataInicio,
  };
  const { error } = await gravar(
    { tabela: "financa_recorrencias", op: "insert", valores },
    { patches: [{ colecao: "financas.recorrencias", op: "upsert", id, valores: { ...valores, ativo: true, data_fim: null } }] }
  );
  return error ? { erro: error.message } : {};
}
