"use client";

import Link from "next/link";
import { BotaoPaguei } from "@/components/BotaoPaguei";
import type { SnapshotOffline } from "@/lib/offline/snapshot";

/**
 * Etapa 214 — "Hoje unificado": na tela Hoje, abaixo dos hábitos e
 * tarefas, as contas/receitas que caem no dia visto — lançamentos
 * com essa data (com "Paguei" quando for agendado) e recorrências que
 * vão ser lançadas nesse dia. Transferências ficam de fora.
 */
export function ContasDoDia({ snapshot, dataISO, hojeISO }: { snapshot: SnapshotOffline; dataISO: string; hojeISO: string }) {
  const contas = new Map((snapshot.financas.contas ?? []).map((c: any) => [c.id, c.nome as string]));
  const lancamentos = (snapshot.financas.transacoes ?? []).filter(
    (t: any) => t.data === dataISO && !t.transferencia_grupo
  ) as any[];

  // recorrência que ainda não virou lançamento (dia futuro)
  const idsJaLancados = new Set(
    (snapshot.financas.transacoes ?? [])
      .filter((t: any) => t.recorrencia_id && String(t.data).slice(0, 7) === dataISO.slice(0, 7))
      .map((t: any) => t.recorrencia_id)
  );
  const dia = Number(dataISO.slice(8, 10));
  const previstas =
    dataISO > hojeISO
      ? ((snapshot.financas.recorrencias ?? []) as any[]).filter(
          (r) =>
            r.ativo &&
            r.dia_mes === dia &&
            !idsJaLancados.has(r.id) &&
            (!r.data_inicio || r.data_inicio <= dataISO) &&
            (!r.data_fim || r.data_fim >= dataISO)
        )
      : [];

  if (lancamentos.length === 0 && previstas.length === 0) return null;

  const moeda = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-ink-400">💰 Dinheiro {dataISO === hojeISO ? "de hoje" : "nesse dia"}</p>
        <Link href={`/financas/extrato?dia=${dataISO}`} className="text-xs text-ink-400 hover:text-ink-100 transition">
          Ver no extrato →
        </Link>
      </div>
      <ul className="space-y-2">
        {lancamentos.map((t) => (
          <li key={t.id} className="bg-base-800 border border-base-600 rounded-xl2 px-3 py-2.5">
            <div className="flex items-center gap-3">
              <p className="text-sm flex-1 min-w-0 truncate">{t.descricao || contas.get(t.conta_id) || "Lançamento"}</p>
              <span className={`font-mono text-sm shrink-0 ${t.tipo === "receita" ? "text-habito" : "text-red-400"}`}>
                {t.tipo === "receita" ? "+" : "−"}
                {moeda(t.valor)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className="text-xs text-ink-400 truncate">{contas.get(t.conta_id)}</p>
              <BotaoPaguei transacao={t} compacto />
            </div>
          </li>
        ))}
        {previstas.map((r) => (
          <li key={r.id} className="bg-base-800 border border-dashed border-base-600 rounded-xl2 px-3 py-2.5 flex items-center gap-3">
            <p className="text-sm flex-1 min-w-0 truncate">
              {r.descricao || "Recorrente"} <span className="text-xs text-financa">↻ previsto</span>
            </p>
            <span className={`font-mono text-sm shrink-0 ${r.tipo === "receita" ? "text-habito" : "text-red-400"}`}>
              {r.tipo === "receita" ? "+" : "−"}
              {moeda(r.valor)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
