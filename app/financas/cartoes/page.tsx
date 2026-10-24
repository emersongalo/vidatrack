"use client";

// Etapa 330 — aba só dos cartões de crédito: cada cartão com a cara de um
// cartão de verdade (cor do banco, fatura, vencimento e limite), ações
// rápidas (ver fatura, lançar compra, pagar) e, no cartão escolhido, as
// compras da fatura e os parcelamentos que ainda estão rolando.
import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Receipt, CalendarClock, ChevronRight } from "lucide-react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { bancoPorId, siglaDoSelo } from "@/lib/financas/bancos";
import { usoDoLimite } from "@/lib/financas/limite";
import { resumoCartao, textoVencimento } from "@/lib/financas/cartaoResumo";
import { calcularPeriodoFatura } from "@/lib/financas/fatura";
import { PrevisaoFatura } from "@/components/PrevisaoFatura";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { parcelamentosAtivos } from "@/lib/financas/cartoesAba";
import { ValorMonetario } from "@/components/ValorMonetario";
import { PagarFatura } from "@/components/PagarFatura";
import { EstadoVazio } from "@/components/EstadoVazio";
import { CarregandoTela } from "@/components/Esqueleto";

function mesAno(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

export default function CartoesPage() {
  const { snapshot } = useSnapshotOffline();
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const hoje = new Date().toLocaleDateString("sv-SE");

  const contas = (snapshot?.financas.contas ?? []) as any[];
  const transacoes = (snapshot?.financas.transacoes ?? []) as any[];
  const cartoes = useMemo(() => contas.filter((c) => c.tipo === "cartao"), [contas]);

  if (snapshot === undefined) return <CarregandoTela cartoes={2} linhas={3} />;

  if (!cartoes.length)
    return (
      <main className="min-h-screen p-6 md:p-12 pagina">
        <h1 className="text-3xl font-display font-bold mt-2 mb-6">Cartões</h1>
        <EstadoVazio
          emoji="💳"
          tom="financa"
          titulo="Nenhum cartão cadastrado"
          texto="Cadastre seu cartão de crédito pra acompanhar a fatura, o limite e os parcelamentos aqui."
          acao={{ rotulo: "+ Adicionar cartão", href: "/financas/contas" }}
        />
      </main>
    );

  const resumos = cartoes.map((c) => ({ c, r: resumoCartao(c, transacoes, hoje) }));
  const totalFaturas = resumos.reduce((s, { r, c }) => s + (r.proxima?.valor ?? Math.max(0, -Number(c.saldo))), 0);
  const livre = resumos.reduce((s, { c, r }) => s + (usoDoLimite(r.devendo, Number(c.limite) || null)?.disponivel ?? 0), 0);
  const temLimite = resumos.some(({ c }) => Number(c.limite) > 0);
  const atual = cartoes.find((c) => c.id === escolhido) ?? cartoes[0];

  // compras da fatura aberta do cartão escolhido
  const periodo = atual.dia_fechamento ? calcularPeriodoFatura(atual.dia_fechamento, hoje) : null;
  const compras = transacoes
    .filter((t) => t.conta_id === atual.id && t.tipo === "despesa" && !t.transferencia_grupo && (!periodo || (t.data >= periodo.inicio && t.data <= periodo.fim)))
    .sort((a, b) => (a.data < b.data ? 1 : -1))
    .slice(0, 8);
  const parcelas = parcelamentosAtivos(transacoes.filter((t) => t.conta_id === atual.id), hoje);
  const resumoAtual = resumos.find(({ c }) => c.id === atual.id)!.r;

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <div className="flex items-center justify-between mt-2 mb-4">
        <h1 className="text-3xl font-display font-bold">Cartões</h1>
        <Link href="/financas/contas" className="text-sm font-semibold rounded-full bg-ink-100 text-base-900 px-4 py-2 active:scale-95 transition">
          + Adicionar
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="rounded-2xl bg-base-800 border border-base-600 px-4 py-3">
          <p className="text-xs text-ink-400">Faturas a pagar</p>
          <p className="font-mono text-lg font-semibold text-red-400">
            <ValorMonetario valor={totalFaturas} />
          </p>
        </div>
        <div className="rounded-2xl bg-base-800 border border-base-600 px-4 py-3">
          <p className="text-xs text-ink-400">Limite livre</p>
          <p className="font-mono text-lg font-semibold text-habito">{temLimite ? <ValorMonetario valor={livre} /> : "—"}</p>
        </div>
      </div>

      {/* os cartões */}
      <ul className="space-y-3">
        {resumos.map(({ c, r }) => {
          const banco = bancoPorId(c.banco);
          const limite = usoDoLimite(r.devendo, Number(c.limite) || null);
          const valor = r.proxima?.valor ?? r.devendo;
          const ativo = c.id === atual.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setEscolhido(c.id)}
                className={`relative block w-full text-left rounded-3xl p-5 overflow-hidden transition active:scale-[0.99] ${ativo ? "ring-2 ring-white/70 shadow-2xl shadow-black/50" : "opacity-90 shadow-lg shadow-black/30"}`}
                style={{ background: `linear-gradient(140deg, ${banco.cor} 0%, ${banco.cor}D9 45%, #111218 135%)`, color: banco.texto }}
                aria-pressed={ativo}
              >
                {/* brilho/curvas de cartão */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 180" preserveAspectRatio="none" aria-hidden>
                  <path d="M180 0 C230 60 250 120 320 150 L320 0 Z" fill="#fff" opacity="0.08" />
                  <path d="M120 180 C170 120 240 100 320 110 L320 180 Z" fill="#000" opacity="0.14" />
                  <path d="M0 40 C80 20 140 70 200 40" stroke="#fff" strokeOpacity="0.12" strokeWidth="1.5" fill="none" />
                </svg>
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold truncate">{c.nome}</p>
                      <p className="text-xs opacity-80">
                        {r.proxima?.vencimento ? textoVencimento(r.proxima.vencimento, hoje).replace(/^./, (x) => x.toUpperCase()) : c.dia_vencimento ? `Vence dia ${c.dia_vencimento}` : "Cartão de crédito"}
                      </p>
                    </div>
                    <span className="font-mono text-sm tracking-widest opacity-90">•••• {siglaDoSelo(c.banco, c.nome, c.tipo) || "💳"}</span>
                  </div>
                  {/* chip */}
                  <div className="mt-4 w-9 h-7 rounded-md bg-gradient-to-br from-yellow-200/90 to-yellow-500/80 border border-black/10" />
                  <p className="text-xs opacity-80 mt-3">{r.proxima?.fechada ? "Fatura fechada" : "Fatura atual"}</p>
                  <p className="font-mono text-3xl font-bold leading-tight">
                    <ValorMonetario valor={valor} />
                  </p>
                  {limite ? (
                    <div className="mt-3">
                      <div className="h-1.5 rounded-full bg-black/25 overflow-hidden">
                        <div className="h-full rounded-full bg-white/90" style={{ width: `${limite.pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[11px] mt-1 opacity-90">
                        <span>{limite.pct}% do limite</span>
                        <span>
                          Livre <ValorMonetario valor={limite.disponivel} />
                        </span>
                      </div>
                    </div>
                  ) : (
                    !c.dia_fechamento && <p className="text-[11px] opacity-80 mt-2">Configure o dia de fechamento em Contas pra ver a fatura certinha</p>
                  )}
                </div>
              </button>

              {/* ações do cartão escolhido */}
              {ativo && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Link href={c.dia_fechamento ? `/financas/contas/${c.id}/fatura` : "/financas/contas"} className="flex flex-col items-center gap-1 rounded-2xl bg-base-800 border border-base-600 py-2.5 text-xs active:scale-95 transition">
                    <Receipt size={18} /> Fatura
                  </Link>
                  <Link href={`/financas/nova?conta=${c.id}`} className="flex flex-col items-center gap-1 rounded-2xl bg-base-800 border border-base-600 py-2.5 text-xs active:scale-95 transition">
                    <Plus size={18} /> Lançar compra
                  </Link>
                  <a href="#pagar" className="flex flex-col items-center gap-1 rounded-2xl bg-base-800 border border-base-600 py-2.5 text-xs active:scale-95 transition">
                    <CalendarClock size={18} /> Pagar
                  </a>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* detalhes do cartão escolhido */}
      <section className="mt-6" id="pagar">
        <PagarFatura cartao={{ id: atual.id, nome: atual.nome }} contas={contas} aPagar={resumoAtual.proxima?.valor ?? resumoAtual.devendo} vencimento={resumoAtual.proxima?.vencimento ?? null} />
      </section>

      {/* Etapa 362 — previsão das próximas faturas do cartão escolhido */}
      {atual.dia_fechamento && (
        <div className="mt-6">
          <PrevisaoFatura conta={atual} transacoes={transacoes} recorrencias={(snapshot?.financas.recorrencias ?? []) as any[]} hoje={hoje} quantas={4} />
        </div>
      )}

      {parcelas.length > 0 && (
        <section className="mt-6 bg-base-800 border border-base-600 rounded-3xl p-5">
          <h2 className="text-lg font-semibold mb-3">Parcelamentos · {atual.nome}</h2>
          <ul className="space-y-3">
            {parcelas.map((p) => (
              <li key={p.grupo}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.descricao}</p>
                    <p className="text-[11px] text-ink-400">
                      {p.pagas} de {p.total} · termina em {mesAno(p.ultima)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-semibold">{formatarMoeda(p.valorParcela)}/mês</p>
                    <p className="text-[11px] text-ink-400">falta {formatarMoeda(p.falta)}</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-base-700 overflow-hidden mt-1.5">
                  <div className="h-full rounded-full bg-financa" style={{ width: `${Math.round((p.pagas / p.total) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 bg-base-800 border border-base-600 rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{periodo ? "Compras desta fatura" : "Últimas compras"}</h2>
          {atual.dia_fechamento && (
            <Link href={`/financas/contas/${atual.id}/fatura`} className="text-sm text-ink-400 flex items-center">
              Ver tudo <ChevronRight size={15} />
            </Link>
          )}
        </div>
        {compras.length === 0 ? (
          <p className="text-sm text-ink-400">Nenhuma compra nesta fatura ainda.</p>
        ) : (
          <ul className="divide-y divide-base-600">
            {compras.map((t) => (
              <li key={t.id}>
                <Link href={`/financas/${t.id}/editar`} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm truncate">
                      {(t.descricao || "Compra").replace(/\s*\(\d+\/\d+\)\s*$/, "")}
                      {t.parcela_total ? <span className="text-ink-400"> · {t.parcela_numero}/{t.parcela_total}</span> : null}
                    </p>
                    <p className="text-[11px] text-ink-400">{new Date(t.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
                  </div>
                  <span className="font-mono text-sm text-red-400 shrink-0">-{formatarMoeda(Number(t.valor))}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
