"use client";

// Etapa 350 — fazer qualquer ação do app sem internet.
//
// Sem conexão, a ação NÃO vai pro servidor: entra na fila (com o nome da
// ação e os dados do formulário), o retrato do aparelho muda na hora
// (a tela já mostra o resultado) e, quando a internet volta, a fila
// executa a mesma ação no servidor. Com internet, nada muda: o app faz
// exatamente o que já fazia.
import type { FormEvent } from "react";
import { adicionarNaFila, lerFila, type AcaoPendente } from "@/lib/offline/fila";
import { aplicarPatches, type Patch } from "@/lib/offline/patches";
import type { ArgSerializado, NomeAcaoOffline } from "@/lib/offline/acoesOffline";
import { lerSnapshotOffline, salvarSnapshotOffline } from "@/lib/offline/snapshot";
import { EVENTO_SNAPSHOT } from "@/lib/offline/useSnapshot";
import { novoUuid, sincronizarAgora } from "@/lib/local/financas";

export { novoUuid };

export function semInternet() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/** erro de rede (o pedido nem chegou no servidor) */
export function ehErroDeRede(e: unknown) {
  const msg = String((e as any)?.message ?? e ?? "");
  return /fetch|network|load failed|connection|timeout|abort|offline/i.test(msg);
}

function serializar(arg: unknown): ArgSerializado {
  if (typeof FormData !== "undefined" && arg instanceof FormData) {
    const pares: [string, string][] = [];
    arg.forEach((v, k) => {
      if (typeof v === "string") pares.push([k, v]);
    });
    return { __fd: pares };
  }
  return (arg ?? null) as ArgSerializado;
}

export type PedidoOffline = {
  acao: NomeAcaoOffline;
  args: unknown[];
  patches?: Patch[];
  /** ids que o servidor vai criar com outro número (não dá pra editar antes de subir) */
  provisorios?: string[];
  rotulo?: string;
};

/** guarda a ação na fila e já muda o retrato do aparelho */
export function enfileirarAcao(p: PedidoOffline) {
  const patches = p.patches ?? [];
  adicionarNaFila({
    id: novoUuid(),
    tipo: "generica",
    acao: p.acao,
    args: p.args.map(serializar),
    patches,
    rotulo: p.rotulo,
    provisorios: p.provisorios?.length ? p.provisorios : undefined,
  });
  const snap = lerSnapshotOffline();
  if (snap && patches.length) {
    salvarSnapshotOffline(aplicarPatches(snap as any, patches));
    try {
      window.dispatchEvent(new Event(EVENTO_SNAPSHOT));
    } catch {}
  }
  sincronizarAgora();
}

/** item criado sem internet que o servidor ainda vai numerar (não dá pra editar ainda) */
export function ehProvisorio(id: string | null | undefined) {
  if (!id) return false;
  return lerFila().some((a: any) => a.tipo === "generica" && Array.isArray(a.provisorios) && a.provisorios.includes(id));
}
export const MSG_PROVISORIO = "Esse item foi criado sem internet e ainda está subindo — dá pra mexer nele assim que sincronizar.";

/**
 * Pra botões (arquivar, apagar, marcar...): com internet chama a ação
 * normalmente; sem internet (ou se a rede cair no meio) vai pra fila.
 * Devolve "fila" quando foi guardada no aparelho.
 */
export async function chamarOuGuardar<T>(chamar: () => Promise<T>, p: PedidoOffline): Promise<T | "fila"> {
  if (semInternet()) {
    enfileirarAcao(p);
    return "fila";
  }
  try {
    return await chamar();
  } catch (e) {
    // redirecionamento do Next não é erro
    if (String((e as any)?.digest ?? "").startsWith("NEXT_REDIRECT")) throw e;
    if (ehErroDeRede(e)) {
      enfileirarAcao(p);
      return "fila";
    }
    throw e;
  }
}

/**
 * Pra formulários: no onSubmit. Com internet não faz nada (o formulário
 * segue pro servidor como sempre). Sem internet, monta o pedido a partir
 * dos dados do formulário, guarda e chama `depois` (ex.: voltar pra lista).
 * `montar` pode devolver uma string = mensagem de erro de validação.
 */
export function enviarSemInternet(
  e: FormEvent<HTMLFormElement>,
  montar: (fd: FormData) => PedidoOffline | string | null,
  depois?: (fd: FormData) => void,
  aoErro?: (mensagem: string) => void
): boolean {
  if (!semInternet()) return false;
  const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent)?.submitter ?? undefined);
  const pedido = montar(fd);
  if (pedido === null) return false; // esse caso precisa de internet: deixa seguir (vai mostrar o erro de conexão)
  e.preventDefault();
  if (typeof pedido === "string") {
    if (aoErro) aoErro(pedido);
    else alert(pedido);
    return true;
  }
  enfileirarAcao(pedido);
  depois?.(fd);
  return true;
}

/** Etapa 350 — marcar/desmarcar um item do checklist (sem internet também) */
export function pedidoSubtarefa(tarefaId: string, subtarefaId: string): PedidoOffline {
  const tarefa: any = (lerSnapshotOffline()?.tarefas ?? []).find((t: any) => t.id === tarefaId);
  const subtarefas = ((tarefa?.subtarefas ?? []) as { id: string; feita: boolean }[]).map((s) =>
    s.id === subtarefaId ? { ...s, feita: !s.feita } : s
  );
  return {
    acao: "alternarSubtarefa",
    args: [tarefaId, subtarefaId],
    patches: tarefa ? [{ colecao: "tarefas", op: "mesclar", id: tarefaId, valores: { subtarefas } }] : [],
    rotulo: "Checklist da tarefa",
  };
}

/**
 * Etapa 353 — marcar hábito / concluir tarefa / ajustar quantidade em
 * qualquer tela: sem internet (ou se a rede cair) usa a MESMA fila que a
 * tela Hoje já usa (ela mostra o pendente na hora).
 */
function guardarMarcacao(acao: AcaoPendente) {
  adicionarNaFila(acao);
  sincronizarAgora();
  return "fila" as const;
}
async function marcarComFila<T>(chamar: () => Promise<T>, acao: AcaoPendente): Promise<T | "fila"> {
  if (semInternet()) return guardarMarcacao(acao);
  try {
    return await chamar();
  } catch (e) {
    if (ehErroDeRede(e)) return guardarMarcacao(acao);
    throw e;
  }
}
export const concluirTarefaComFila = <T>(tarefaId: string, data: string, chamar: () => Promise<T>) =>
  marcarComFila(chamar, { tipo: "conclusao_tarefa", tarefaId, data });
export const checkinHabitoComFila = <T>(habitoId: string, data: string, chamar: () => Promise<T>) =>
  marcarComFila(chamar, { tipo: "checkin_habito", habitoId, data });
export const ajusteHabitoComFila = <T>(habitoId: string, data: string, delta: number, chamar: () => Promise<T>) =>
  marcarComFila(chamar, { tipo: "ajuste_habito", habitoId, data, delta });
