"use client";

// Etapa 355 — sem internet, as contas fixas do mês também aparecem "a
// pagar" (o que o servidor faz ao abrir Finanças com internet). O
// aparelho gera o lançamento com o id dele; ao subir, o servidor confere
// se o mês já tinha esse lançamento antes de gravar (não duplica).
import { lerFila } from "@/lib/offline/fila";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";
import { enfileirarAcao, novoUuid } from "@/lib/local/acaoOffline";
import type { Patch } from "@/lib/offline/patches";
import { diasDasRecorrencias, mesCompetencia } from "@/lib/financas/competencia";

export function lancamentosRecorrentesQueFaltam(snap: any, hojeISO: string) {
  const mes = hojeISO.slice(0, 7);
  // Etapa 364 — conta adiada pra outro mês continua sendo do mês dela
  const dias = diasDasRecorrencias(snap?.financas?.recorrencias);
  const ja = new Set(
    ((snap?.financas?.transacoes ?? []) as any[])
      .filter((t) => t.recorrencia_id && mesCompetencia(t, dias.get(t.recorrencia_id)) === mes)
      .map((t) => t.recorrencia_id)
  );
  const faltam: { recorrencia: any; data: string }[] = [];
  for (const r of (snap?.financas?.recorrencias ?? []) as any[]) {
    if (r.ativo === false || ja.has(r.id)) continue;
    const data = `${mes}-${String(Math.min(28, Number(r.dia_mes) || 1)).padStart(2, "0")}`;
    if (r.data_fim && data > r.data_fim) continue;
    if (r.data_inicio && data < r.data_inicio) continue;
    faltam.push({ recorrencia: r, data });
  }
  return faltam;
}

export function garantirRecorrentesNoAparelho(hojeISO: string) {
  const snap = lerSnapshotOffline();
  if (!snap) return;
  const naFila = new Set(
    lerFila()
      .filter((a: any) => a.tipo === "generica" && a.acao === "gerarLancamentoRecorrenteOffline")
      .map((a: any) => `${a.args?.[0]}|${String(a.args?.[2] ?? "").slice(0, 7)}`)
  );
  for (const { recorrencia: r, data } of lancamentosRecorrentesQueFaltam(snap, hojeISO)) {
    if (naFila.has(`${r.id}|${data.slice(0, 7)}`)) continue;
    const id = novoUuid();
    const patches: Patch[] = [
      {
        colecao: "financas.transacoes",
        op: "upsert",
        id,
        valores: {
          dono_id: snap.perfil.id,
          conta_id: r.conta_id,
          categoria_id: r.categoria_id ?? null,
          tipo: r.tipo,
          valor: Number(r.valor),
          descricao: r.descricao ?? null,
          data,
          recorrencia_id: r.id,
          criado_em: new Date().toISOString(),
        },
      },
    ];
    enfileirarAcao({ acao: "gerarLancamentoRecorrenteOffline", args: [r.id, id, data], patches, rotulo: r.descricao || "Conta fixa do mês" });
  }
}
