export type AcaoPendente =
  | { tipo: "checkin_habito"; habitoId: string; data: string }
  | { tipo: "ajuste_habito"; habitoId: string; data: string; delta: number }
  | { tipo: "conclusao_tarefa"; tarefaId: string; data: string }
  | { id: string; tipo: "criar_nota"; titulo: string; conteudo: string; notaIdTemporario: string }
  | { id: string; tipo: "editar_nota"; notaId: string; titulo: string; conteudo: string }
  | { id: string; tipo: "excluir_nota"; notaId: string }
  | {
      id: string;
      tipo: "criar_transacao";
      dados: { tipo: "receita" | "despesa"; valor: string; contaId: string; categoriaId: string; descricao: string; data: string };
    }
  | { id: string; tipo: "criar_habito"; dados: { nome: string; icone: string; cor: string } };

const CHAVE_FILA = "vidatrack-fila-offline";
const CHAVE_CACHE_HOJE = "vidatrack-cache-hoje";

export function lerFila(): AcaoPendente[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CHAVE_FILA) ?? "[]");
  } catch {
    return [];
  }
}

export function adicionarNaFila(acao: AcaoPendente) {
  const fila = lerFila();
  // Ações que têm `id` (as novas, desde a Etapa 44) substituem uma
  // entrada anterior com o mesmo id, em vez de empilhar duplicata —
  // é assim que "editar a mesma nota 5 vezes offline" vira só 1 ação
  // na fila (a mais recente), não 5.
  const idNovo = "id" in acao ? acao.id : null;
  const filaFiltrada = idNovo ? fila.filter((a) => !("id" in a) || a.id !== idNovo) : fila;
  filaFiltrada.push(acao);
  localStorage.setItem(CHAVE_FILA, JSON.stringify(filaFiltrada));
}

/**
 * Sobrescreve a fila inteira — usado pelo processador de sincronização
 * (Etapa 44) pra salvar só o que ainda ficou pendente depois de tentar
 * processar tudo, mantendo a ordem.
 */
export function salvarFilaCompleta(fila: AcaoPendente[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAVE_FILA, JSON.stringify(fila));
}

export function limparFila() {
  localStorage.setItem(CHAVE_FILA, "[]");
}

export function salvarCacheHoje(chave: string, itens: unknown) {
  if (typeof window === "undefined") return;
  try {
    const tudo = JSON.parse(localStorage.getItem(CHAVE_CACHE_HOJE) ?? "{}");
    tudo[chave] = itens;
    localStorage.setItem(CHAVE_CACHE_HOJE, JSON.stringify(tudo));
  } catch {
    // Se o localStorage estiver cheio ou indisponível, ignora — o app
    // volta a funcionar normalmente assim que a conexão retornar.
  }
}

export function lerCacheHoje(chave: string): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const tudo = JSON.parse(localStorage.getItem(CHAVE_CACHE_HOJE) ?? "{}");
    return tudo[chave] ?? null;
  } catch {
    return null;
  }
}
