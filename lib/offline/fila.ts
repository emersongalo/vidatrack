import type { Patch } from "@/lib/offline/patches";
import type { ArgSerializado, NomeAcaoOffline } from "@/lib/offline/acoesOffline";

export type AcaoPendente =
  | { tipo: "checkin_habito"; habitoId: string; data: string }
  | { tipo: "ajuste_habito"; habitoId: string; data: string; delta: number }
  | { tipo: "conclusao_tarefa"; tarefaId: string; data: string }
  | {
      id: string;
      tipo: "criar_transacao";
      dados: { tipo: "receita" | "despesa"; valor: string; contaId: string; categoriaId: string; descricao: string; data: string; etiquetas?: string[] | null };
    }
  /** Etapa 344 — editar / apagar lançamento feito no aparelho */
  | {
      id: string;
      tipo: "editar_transacao";
      transacaoId: string;
      dados: { tipo: "receita" | "despesa"; valor: string; contaId: string; categoriaId: string; descricao: string; data: string; etiquetas?: string[] | null };
    }
  | { id: string; tipo: "apagar_transacao"; transacaoId: string }
  | { id: string; tipo: "criar_habito"; dados: { nome: string; icone: string; cor: string } }
  /** Etapa 343 — tarefa criada sem internet (campos do formulário) */
  | { id: string; tipo: "criar_tarefa"; entradas: [string, string][] }
  /** Etapa 343 — compromisso da Agenda criado sem internet */
  | { id: string; tipo: "criar_evento"; dados: Record<string, unknown>; convidados: string[] }
  /** Etapa 347 — Agenda "estilo Monee": editar / apagar sem esperar a internet */
  | { id: string; tipo: "editar_evento"; eventoId: string; dados: Record<string, unknown>; convidados: string[] }
  | { id: string; tipo: "apagar_evento"; eventoId: string; soODia?: string | null }
  /**
   * Etapa 350 — qualquer outra ação do app feita sem internet: o nome da
   * ação, os argumentos e o que muda no retrato do aparelho.
   * `provisorios` = ids que só existem no aparelho até subir (o servidor
   * vai criar com outro id): não dá pra editar esses itens antes.
   */
  | { id: string; tipo: "generica"; acao: NomeAcaoOffline; args: ArgSerializado[]; patches: Patch[]; rotulo?: string; provisorios?: string[] };

const CHAVE_FILA = "vidatrack-fila-offline";
/** Etapa 276 — avisa as telas sempre que a fila muda (selo "N esperando internet") */
export const EVENTO_FILA_MUDOU = "vt-fila-mudou";
function avisarMudanca() {
  try {
    window.dispatchEvent(new CustomEvent(EVENTO_FILA_MUDOU, { detail: lerFila().length }));
  } catch {
    /* fora do navegador */
  }
}
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
  // Etapa 358 — quando foi feito (pra tela "Esperando sincronizar")
  filaFiltrada.push({ criadoEm: Date.now(), ...acao } as unknown as AcaoPendente);
  localStorage.setItem(CHAVE_FILA, JSON.stringify(filaFiltrada));
  avisarMudanca();
}

/**
 * Sobrescreve a fila inteira — usado pelo processador de sincronização
 * (Etapa 44) pra salvar só o que ainda ficou pendente depois de tentar
 * processar tudo, mantendo a ordem.
 */
export function salvarFilaCompleta(fila: AcaoPendente[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAVE_FILA, JSON.stringify(fila));
  avisarMudanca();
}

export function limparFila() {
  localStorage.setItem(CHAVE_FILA, "[]");
  avisarMudanca();
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

// ---------- Etapa 358 — tela "Esperando sincronizar" ----------
const CHAVE_FALHAS = "vidatrack-fila-falhas";
const CHAVE_RECUSADOS = "vidatrack-fila-recusados";

/** chave estável de uma ação da fila */
export function chaveAcao(a: AcaoPendente): string {
  return JSON.stringify(a);
}

function lerJson<T>(chave: string, padrao: T): T {
  if (typeof window === "undefined") return padrao;
  try {
    return JSON.parse(localStorage.getItem(chave) ?? "null") ?? padrao;
  } catch {
    return padrao;
  }
}

export type FalhaFila = { erro: string; em: number; tentativas: number };

/** última falha de cada ação que ainda está na fila (vai tentar de novo) */
export function lerFalhas(): Record<string, FalhaFila> {
  return lerJson<Record<string, FalhaFila>>(CHAVE_FALHAS, {});
}

export function registrarFalha(a: AcaoPendente, erro: string) {
  try {
    const f = lerFalhas();
    const k = chaveAcao(a);
    f[k] = { erro: erro.slice(0, 300), em: Date.now(), tentativas: (f[k]?.tentativas ?? 0) + 1 };
    // só guarda as que ainda estão na fila
    const vivas = new Set(lerFila().map(chaveAcao));
    for (const kk of Object.keys(f)) if (!vivas.has(kk)) delete f[kk];
    localStorage.setItem(CHAVE_FALHAS, JSON.stringify(f));
  } catch {}
}

export type Recusado = { acao: AcaoPendente; erro: string; em: number };

/** o que o servidor recusou de vez (últimos 20) */
export function lerRecusados(): Recusado[] {
  return lerJson<Recusado[]>(CHAVE_RECUSADOS, []);
}

export function registrarRecusado(a: AcaoPendente, erro: string) {
  try {
    const lista = [{ acao: a, erro: erro.slice(0, 300), em: Date.now() }, ...lerRecusados()].slice(0, 20);
    localStorage.setItem(CHAVE_RECUSADOS, JSON.stringify(lista));
  } catch {}
}

export function limparRecusados() {
  try {
    localStorage.removeItem(CHAVE_RECUSADOS);
  } catch {}
}

/** tira UMA ação da fila (a pessoa desistiu dela) */
export function descartarDaFila(chave: string) {
  salvarFilaCompleta(lerFila().filter((a) => chaveAcao(a) !== chave));
}
