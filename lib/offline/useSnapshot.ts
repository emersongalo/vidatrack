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
    } catch {
      // Sem internet de verdade (ou servidor fora) — fica com o que já tinha.
    } finally {
      setAtualizando(false);
    }
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
