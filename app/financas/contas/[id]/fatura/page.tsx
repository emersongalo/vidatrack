"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { calcularPeriodoFatura, calcularVencimentoFatura, periodoFaturaAdjacente } from "@/lib/financas/fatura";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { IconeCategoria } from "@/components/IconeCategoria";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { ListaLancamentosPorDia } from "@/components/ListaLancamentosPorDia";
import { PagarFatura } from "@/components/PagarFatura";
import { resumoFatura } from "@/lib/financas/previsao";
import { CarregandoTela } from "@/components/Esqueleto";
import { EstadoVazio } from "@/components/EstadoVazio";

function formatarPeriodo(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// Etapa 132 — tudo aqui já era cálculo puro de datas (lib/financas/fatura.ts);
// só precisava vir alimentado pelo retrato local em vez de uma consulta nova.
export default function FaturaCartaoPage() {
  const params = useParams<{ id: string }>();
  const { snapshot } = useSnapshotOffline();
  const [fimSelecionado, setFimSelecionado] = useState<string | null>(null);

  if (snapshot === undefined) return <CarregandoTela linhas={4} />;

  const conta = (snapshot?.financas.contas ?? []).find((c: any) => c.id === params.id);

  if (!conta || !conta.dia_fechamento || !conta.dia_vencimento) {
    return (
      <main className="min-h-screen p-6 md:p-12 pagina-form">
        <Link href="/financas/contas" className="text-ink-400 text-base hover:text-ink-100 transition">
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
  // Etapa 242 — abre na fatura que importa: a fechada se ainda falta pagar, senão a aberta
  const fechadaAnterior = periodoFaturaAdjacente(conta.dia_fechamento, periodoAtualAberto.fim, -1);
  const faltaNaFechada = resumoFatura(conta as any, (snapshot?.financas.transacoes ?? []) as any, fechadaAnterior).aPagar > 0;
  const periodo = fimSelecionado
    ? calcularPeriodoFatura(conta.dia_fechamento, fimSelecionado)
    : faltaNaFechada
      ? fechadaAnterior
      : periodoAtualAberto;

  const vencimento = calcularVencimentoFatura(conta.dia_vencimento, periodo.fim);
  const ehFaturaAberta = periodo.fim === periodoAtualAberto.fim;

  const mapaCategorias = new Map((snapshot?.financas.categorias ?? []).map((c: any) => [c.id, c]));
  const transacoes = (snapshot?.financas.transacoes ?? [])
    .filter((t: any) => t.conta_id === conta.id && t.data >= periodo.inicio && t.data <= periodo.fim)
    .sort((a: any, b: any) => (a.data < b.data ? 1 : -1));

  // Etapa 242 — total, quanto já foi pago (inclusive adiantado) e quanto falta
  const resumo = resumoFatura(conta as any, (snapshot?.financas.transacoes ?? []) as any, periodo);
  const total = resumo.total;

  const anterior = periodoFaturaAdjacente(conta.dia_fechamento, periodo.fim, -1);
  const proximo = periodoFaturaAdjacente(conta.dia_fechamento, periodo.fim, 1);

  return (
    <main className="min-h-screen p-6 md:p-12 pagina-form">
      <Link href="/financas/contas" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Contas
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-1">Fatura · {conta.nome}</h1>
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
        <p className="text-3xl font-mono font-bold mb-1">{formatarMoeda(total)}</p>
        {resumo.pago > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-base mb-3">
            <span className="text-habito">✓ Pago {formatarMoeda(resumo.pago)}</span>
            <span className={resumo.aPagar > 0 ? "text-red-400 font-semibold" : "text-habito font-semibold"}>
              {resumo.aPagar > 0 ? `Falta ${formatarMoeda(resumo.aPagar)}` : "Fatura quitada 🎉"}
            </span>
          </div>
        )}
        {resumo.pago === 0 && <div className="mb-2" />}
        <p className="text-sm text-ink-400">
          Vencimento: <span className="text-ink-100">{new Date(vencimento + "T00:00:00").toLocaleDateString("pt-BR")}</span>
        </p>
        {/* Etapa 242 — pagar escolhendo só de qual conta sai (sem De/Para) */}
        <PagarFatura
          cartao={{ id: conta.id, nome: conta.nome }}
          contas={(snapshot?.financas.contas ?? []) as any[]}
          aPagar={resumo.aPagar}
          vencimento={vencimento}
        />
        {/* Etapa 215 */}
        <p className="text-xs text-ink-400 mt-3">
          🛒 Melhor dia pra comprar: <span className="text-ink-100">dia {conta.dia_fechamento >= 31 ? 1 : conta.dia_fechamento + 1}</span> — o que você compra
          depois do fechamento só é cobrado na fatura seguinte.
        </p>
        <p className="text-xs text-ink-400 mt-1">🔔 Você recebe um aviso 3 dias antes, na véspera e no dia do vencimento.</p>
        <p className="text-xs text-ink-400 mt-3">
          Gastos no cartão não saem do seu saldo na hora — só quando você paga a fatura (sai da conta do banco).
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-3">Lançamentos dessa fatura</h2>
      {transacoes.length === 0 ? (
        <EstadoVazio compacto tom="financa" emoji="💳" titulo="Fatura limpinha" texto="Nenhuma compra nesse período do cartão." />
      ) : (
        // Etapa 226 — mesma lista do Extrato
        <ListaLancamentosPorDia
          lista={transacoes as any[]}
          mapaCategorias={mapaCategorias as Map<string, any>}
          mapaContas={new Map([[conta.id, conta.nome]])}
          mostrarSaldoDoDia={false}
        />
      )}
    </main>
  );
}
