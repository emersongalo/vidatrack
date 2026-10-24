"use client";

// Etapa 344 — Finanças "estilo Monee": o lançamento é salvo PRIMEIRO no
// celular (aparece na hora, com ou sem internet) e vai pro banco logo em
// seguida pela fila de sincronização. O id é criado aqui no aparelho, então
// dá pra editar ou apagar antes mesmo de ele chegar no servidor.
import { adicionarNaFila, lerFila, salvarFilaCompleta, type AcaoPendente } from "@/lib/offline/fila";
import { lerSnapshotOffline, salvarSnapshotOffline } from "@/lib/offline/snapshot";
import { EVENTO_SNAPSHOT } from "@/lib/offline/useSnapshot";

export const EVENTO_SINCRONIZAR_AGORA = "vt-sincronizar-agora";

export type DadosLancamento = {
  tipo: "receita" | "despesa";
  /** como o campo do app manda: "1.234,56" */
  valor: string;
  contaId: string;
  categoriaId: string;
  descricao: string;
  data: string;
  etiquetas?: string[] | null;
};

export function valorParaNumero(valor: string | number): number {
  if (typeof valor === "number") return valor;
  const limpo = String(valor).trim().replace(/[^\d,.-]/g, "");
  const n = limpo.includes(",") ? Number(limpo.replace(/\./g, "").replace(",", ".")) : Number(limpo);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

export function novoUuid() {
  try {
    return crypto.randomUUID();
  } catch {
    // aparelhos bem antigos: uuid v4 "na mão"
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

/** muda o retrato do aparelho e avisa todas as telas */
function mexerNoRetrato(mudar: (transacoes: any[]) => any[]) {
  const snap = lerSnapshotOffline();
  if (!snap) return;
  salvarSnapshotOffline({ ...snap, financas: { ...snap.financas, transacoes: mudar([...(snap.financas.transacoes ?? [])]) } });
  try {
    window.dispatchEvent(new Event(EVENTO_SNAPSHOT));
  } catch {}
}

/** pede pra fila subir agora (se tiver internet) */
export function sincronizarAgora() {
  try {
    if (navigator.onLine) window.dispatchEvent(new Event(EVENTO_SINCRONIZAR_AGORA));
  } catch {}
}

/** Lança no aparelho e agenda o envio. Devolve o id do lançamento. */
export function lancarLocal(d: DadosLancamento): string {
  const id = novoUuid();
  const snap = lerSnapshotOffline();
  mexerNoRetrato((lista) => [
    {
      id,
      dono_id: snap?.perfil.id,
      conta_id: d.contaId,
      categoria_id: d.categoriaId || null,
      tipo: d.tipo,
      valor: valorParaNumero(d.valor),
      descricao: d.descricao || null,
      data: d.data,
      etiquetas: d.etiquetas?.length ? d.etiquetas : null,
      criado_em: new Date().toISOString(),
      pendente_sync: true,
    },
    ...lista,
  ]);
  adicionarNaFila({ id, tipo: "criar_transacao", dados: { ...d, etiquetas: d.etiquetas ?? undefined } as any });
  sincronizarAgora();
  return id;
}

/** Edita (lançamento simples: sem parcelas/recorrência/transferência). */
export function editarLocal(id: string, d: DadosLancamento) {
  mexerNoRetrato((lista) =>
    lista.map((t) =>
      t.id === id
        ? {
            ...t,
            conta_id: d.contaId,
            categoria_id: d.categoriaId || null,
            tipo: d.tipo,
            valor: valorParaNumero(d.valor),
            descricao: d.descricao || null,
            data: d.data,
            ...(d.etiquetas !== undefined ? { etiquetas: d.etiquetas?.length ? d.etiquetas : null } : {}),
            pendente_sync: true,
          }
        : t
    )
  );
  // ainda nem subiu? só atualiza o "criar" que está na fila
  const fila = lerFila();
  const criar = fila.find((a) => a.tipo === "criar_transacao" && "id" in a && a.id === id);
  if (criar) {
    salvarFilaCompleta(fila.map((a) => (a === criar ? ({ ...criar, dados: { ...d } } as AcaoPendente) : a)));
  } else {
    adicionarNaFila({ id: `editar:${id}`, tipo: "editar_transacao", transacaoId: id, dados: d });
  }
  sincronizarAgora();
}

/** Apaga no aparelho e agenda a exclusão. */
export function apagarLocal(id: string) {
  mexerNoRetrato((lista) => lista.filter((t) => t.id !== id));
  const fila = lerFila();
  const aindaNaoSubiu = fila.some((a) => a.tipo === "criar_transacao" && "id" in a && a.id === id);
  // tira tudo que falava desse lançamento
  const limpa = fila.filter((a) => !("id" in a && (a.id === id || a.id === `editar:${id}`)));
  if (aindaNaoSubiu) salvarFilaCompleta(limpa);
  else {
    salvarFilaCompleta(limpa);
    adicionarNaFila({ id: `apagar:${id}`, tipo: "apagar_transacao", transacaoId: id });
  }
  sincronizarAgora();
}

/** Lançamento que dá pra mexer só no aparelho (os "especiais" ainda passam pelo servidor). */
export function ehLancamentoSimples(t: { parcela_grupo?: string | null; recorrencia_id?: string | null; transferencia_grupo?: string | null } | null | undefined) {
  return !!t && !t.parcela_grupo && !t.recorrencia_id && !t.transferencia_grupo;
}
