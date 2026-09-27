"use client";

import { useCallback, useEffect, useState } from "react";
import { lerSnapshotOffline, salvarSnapshotOffline, type SnapshotOffline } from "@/lib/offline/snapshot";

/**
 * Etapa 127 — a peça que faz toda tela (não só "Hoje") virar
 * local-first sem reescrever a busca de dados do zero pra cada uma:
 * em vez de cada página ter sua própria query direta ao Supabase,
 * elas leem do MESMO retrato completo que já baixamos nas etapas
 * 123-125 (/api/offline/baixar-tudo) — o que já alimentava a tela
 * /offline separada agora alimenta as telas de verdade também.
 *
 * `undefined` = ainda não sabemos (primeiro instante).
 * `null` = nunca baixou nada ainda (nem tinha internet uma vez).
 */
export const EVENTO_SNAPSHOT = "vidatrack-snapshot-atualizado";

/** Baixa o retrato de novo e avisa todas as telas abertas. */
export async function atualizarSnapshotEmTodasAsTelas() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  try {
    const resposta = await fetch("/api/offline/baixar-tudo");
    if (!resposta.ok) return;
    salvarSnapshotOffline(await resposta.json());
    window.dispatchEvent(new Event(EVENTO_SNAPSHOT));
  } catch {}
}

export function useSnapshotOffline() {
  const [snapshot, setSnapshot] = useState<SnapshotOffline | null | undefined>(undefined);
  const [atualizando, setAtualizando] = useState(false);

  const recarregar = useCallback(async () => {
    if (!navigator.onLine) return;
    setAtualizando(true);
    try {
      const resposta = await fetch("/api/offline/baixar-tudo");
      if (!resposta.ok) return;
      const dados = await resposta.json();
      salvarSnapshotOffline(dados);
      setSnapshot(lerSnapshotOffline());
      // Etapa 204 — avisa as outras telas abertas (ex: lançou um gasto
      // rápido pelo "+" e a tela Início por trás atualiza na hora)
      window.dispatchEvent(new Event(EVENTO_SNAPSHOT));
    } catch {
      // Sem internet de verdade (ou servidor fora) — fica com o que já tinha.
    } finally {
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    const aoAtualizar = () => setSnapshot(lerSnapshotOffline());
    window.addEventListener(EVENTO_SNAPSHOT, aoAtualizar);
    return () => window.removeEventListener(EVENTO_SNAPSHOT, aoAtualizar);
  }, []);

  useEffect(() => {
    setSnapshot(lerSnapshotOffline());
    // Toda vez que uma tela dessas é aberta, tenta trazer dado fresco
    // em segundo plano — não trava a tela esperando isso (o que já
    // tinha salvo aparece na hora), só atualiza quando/se chegar.
    recarregar();
  }, [recarregar]);

  return { snapshot, atualizando, recarregar };
}
