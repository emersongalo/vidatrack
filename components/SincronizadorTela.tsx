"use client";

// Etapa 292 — confere o hábito de tela (se a pessoa criou um) nos dias que
// já fecharam e marca sozinho quando ficou dentro do limite. Só roda no app
// Android com a permissão dada; no resto não faz nada.
import { useEffect } from "react";
import { estadoTela, lerUsoPorDia } from "@/lib/tela/nativo";
import { conferirDias, gravarConfigTela, lerConfigTela } from "@/lib/tela/habitoTela";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { ajustarQuantidadeHabito } from "@/app/habitos/actions";
import { hojeISO } from "@/lib/habitos/streak";

const CHAVE_ULTIMA = "vt-tela-ultima-conferida";

export async function conferirHabitoTela(): Promise<number> {
  const cfg = lerConfigTela();
  if (!cfg) return 0;
  if ((await estadoTela()) !== "ok") return 0;
  const dias = await lerUsoPorDia(8);
  if (!dias) return 0;
  const hoje = hojeISO();
  const snap = lerSnapshotOffline();
  const habito = (snap?.habitos as any[] | undefined)?.find((h) => h.id === cfg.habitoId);
  if (!habito) return 0; // arquivado ou ainda não chegou no retrato
  const jaTem = new Set(((snap?.habitoCheckins ?? []) as any[]).filter((c) => c.habito_id === cfg.habitoId).map((c) => c.data));

  let marcados = 0;
  const conferidos = new Set(cfg.conferidos);
  for (const d of conferirDias(cfg, dias, hoje)) {
    if (d.resultado === "marcar" && !jaTem.has(d.dia)) {
      if (!navigator.onLine) break; // tenta de novo quando tiver internet
      const r = await ajustarQuantidadeHabito(cfg.habitoId, d.dia, 1).catch(() => ({ erro: "falhou" }) as any);
      if (r?.erro) break;
      marcados++;
    }
    conferidos.add(d.dia);
  }
  // guarda só as últimas 3 semanas de conferidos
  const limite = new Date(Date.now() - 21 * 86400000).toLocaleDateString("sv-SE");
  gravarConfigTela({ ...cfg, conferidos: [...conferidos].filter((d) => d >= limite).sort() });
  if (marcados) void atualizarSnapshotEmTodasAsTelas();
  return marcados;
}

export function SincronizadorTela() {
  useEffect(() => {
    if (!lerConfigTela()) return;
    try {
      // no máximo a cada 30 min
      const ultima = Number(sessionStorage.getItem(CHAVE_ULTIMA) ?? 0);
      if (Date.now() - ultima < 30 * 60 * 1000) return;
      sessionStorage.setItem(CHAVE_ULTIMA, String(Date.now()));
    } catch {}
    const t = setTimeout(() => void conferirHabitoTela(), 2500);
    return () => clearTimeout(t);
  }, []);
  return null;
}
