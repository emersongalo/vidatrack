"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { calcularPeriodoFatura, calcularVencimentoFatura, periodoFaturaAdjacente } from "@/lib/financas/fatura";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { IconeCategoria } from "@/components/IconeCategoria";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

function formatarPeriodo(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// Etapa 132 — tudo aqui já era cálculo puro de datas (lib/financas/fatura.ts);
// só precisava vir alimentado pelo retrato local em vez de uma consulta nova.
export default function FaturaCartaoPage() {
  const params = useParams<{ id: string }>();
  const { snapshot } = useSnapshotOffline();
  const [fimSelecionado, setFimSelecionado] = useState<string | null>(null);

  if (snapshot === undefined) return null;

  const conta = (snapshot?.financas.contas ?? []).find((c: any) => c.id === params.id);

  if (!conta || !conta.dia_fechamento || !conta.dia_vencimento) {
    return (
      <main className="min-h-screen p-6 md:p-12 max-w-md lg:max-w-2xl mx-auto">
        <Link href="/financas/contas" className="text-ink-400 text-sm hover:text-ink-100 transition">
          ← Contas
        </Link>
        <p className="text-ink-400 text-sm mt-6">
          Não encontrei essa conta (ou ela não tem dia de fechamento configurado) no que está salvo no aparelho.
        </p>
      </main>
    );
  }

  const hoje = new Date().toLocaleDateString("sv-SE");
  const periodoAtualAberto = calcularPeriodoFatura(conta.dia_fechamento, hoje);
  const periodo = fimSelecionado
    ? calcularPeriodoFatura(conta.dia_fechamento, fimSelecionado)
    : periodoFaturaAdjacente(conta.dia_fechamento, periodoAtualAberto.fim, -1);

  const vencimento = calcularVencimentoFatura(conta.dia_vencimento, periodo.fim);
  const ehFaturaAberta = periodo.fim === periodoAtualAberto.fim;

  const mapaCategorias = new Map((snapshot?.financas.categorias ?? []).map((c: any) => [c.id, c]));
  const transacoes = (snapshot?.financas.transacoes ?? [])
    .filter((t: any) => t.conta_id === conta.id && t.data >= periodo.inicio && t.data <= periodo.fim)
    .sort((a: any, b: any) => (a.data < b.data ? 1 : -1));

  const total = transacoes.reduce((soma: number, t: any) => soma + (t.tipo === "despesa" ? Number(t.valor) : -Number(t.valor)), 0);

  const anterior = periodoFaturaAdjacente(conta.dia_fechamento, periodo.fim, -1);
  const proximo = periodoFaturaAdjacente(conta.dia_fechamento, periodo.fim, 1);

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md lg:max-w-2xl mx-auto">
      <Link href="/financas/contas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Contas
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-1">Fatura · {conta.nome}</h1>
      <p className="text-ink-400 text-sm mb-6">
        {formatarPeriodo(periodo.inicio)} a {formatarPeriodo(periodo.fim)}
      </p>

      <div className="bg-base-800 border border-base-600 rounded-xl2 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setFimSelecionado(anterior.fim)} className="text-ink-400 hover:text-ink-100 transition text-sm">
            ← Anterior
          </button>
          {!ehFaturaAberta ? (
            <span className="text-xs bg-financa/15 text-financa rounded-full px-2.5 py-1">Fechada</span>
          ) : (
            <span className="text-xs bg-base-700 text-ink-400 rounded-full px-2.5 py-1">Em aberto</span>
          )}
          <button onClick={() => setFimSelecionado(proximo.fim)} className="text-ink-400 hover:text-ink-100 transition text-sm">
            Próxima →
          </button>
        </div>

        <p className="text-xs text-ink-400 mb-1">{ehFaturaAberta ? "Total até agora" : "Total da fatura"}</p>
        <p className="text-3xl font-mono font-bold mb-3">{formatarMoeda(total)}</p>
        <p className="text-sm text-ink-400">
          Vencimento: <span className="text-ink-100">{new Date(vencimento + "T00:00:00").toLocaleDateString("pt-BR")}</span>
        </p>
      </div>

      <p className="text-sm text-ink-400 mb-3">Lançamentos dessa fatura</p>
      <ul className="space-y-2">
        {transacoes.map((t: any) => {
          const cat = mapaCategorias.get(t.categoria_id);
          return (
            <li key={t.id} className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg p-3">
              <span className="w-8 h-8 rounded-lg bg-base-700 flex items-center justify-center shrink-0">
                <IconeCategoria icone={cat?.icone} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{t.descricao || cat?.nome || "Sem descrição"}</p>
                <p className="text-xs text-ink-400">{new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")}</p>
              </div>
              <span className={`font-mono text-sm shrink-0 ${t.tipo === "receita" ? "text-habito" : "text-ink-100"}`}>
                {t.tipo === "receita" ? "-" : ""}
                {formatarMoeda(t.valor)}
              </span>
            </li>
          );
        })}
        {transacoes.length === 0 && <p className="text-sm text-ink-400">Nenhum lançamento nessa fatura.</p>}
      </ul>
    </main>
  );
}
