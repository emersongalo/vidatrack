"use client";

// Etapa 226 — a lista de lançamentos do Extrato virou componente, pra
// ficar igual em todo lugar (Extrato, Início de Finanças, fatura):
// agrupada por dia, faixa verde/vermelha, seta no ícone e valor com +/−.
import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, ArrowLeftRight, Pencil, Trash2 } from "lucide-react";
import { IconeCategoria } from "@/components/IconeCategoria";
import { BotaoPaguei } from "@/components/BotaoPaguei";
import { receitaAguardando } from "@/lib/financas/confirmacao";
import { classeFundoSuave } from "@/lib/agenda/estilo";
import { MenuAcoes, ItemMenuAcoes } from "@/components/MenuAcoes";
import { LinhaComDeslizar } from "@/components/LinhaComDeslizar";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { ValorMonetario } from "@/components/ValorMonetario";
import { removerTransacao } from "@/app/financas/actions";
import { agruparPorDia } from "@/lib/financas/agruparPorDia";

export function ListaLancamentosPorDia({
  lista,
  mapaCategorias,
  mapaContas,
  recarregar,
  aoEscolherEtiqueta,
  mostrarSaldoDoDia = true,
}: {
  lista: any[];
  mapaCategorias: Map<string, any>;
  mapaContas: Map<string, any>;
  recarregar?: () => void;
  aoEscolherEtiqueta?: (etiqueta: string) => void;
  mostrarSaldoDoDia?: boolean;
}) {
  const hojeParaPendencia = new Date().toLocaleDateString("sv-SE");
  const setEtiquetaFiltro = (e: string) => aoEscolherEtiqueta?.(e);
  return (
        <div className="space-y-5">
          {agruparPorDia(lista, hojeParaPendencia).map((g) => (
            <section key={g.dia}>
              <div className="flex items-baseline justify-between px-1 mb-2">
                <h3 className="text-base font-semibold">{g.rotulo}</h3>
                {mostrarSaldoDoDia && <span className={`text-sm font-mono ${g.saldoDia > 0 ? "text-habito" : g.saldoDia < 0 ? "text-ink-400" : "text-ink-400"}`}>
                  {g.saldoDia > 0 ? "+" : g.saldoDia < 0 ? "−" : ""}
                  <ValorMonetario valor={Math.abs(g.saldoDia)} />
                </span>}
              </div>
              <ul className="bg-base-800 border border-base-600 rounded-2xl overflow-hidden divide-y divide-base-600">
                {g.itens.map((t: any) => {
                  const catInfo = mapaCategorias.get(t.categoria_id) as any;
                  const ehTransf = !!t.transferencia_grupo;
                  const ehReceita = t.tipo === "receita";
                  const corValor = ehTransf ? "text-ink-400" : ehReceita ? "text-habito" : "text-red-400";
                  const agendado = t.data > hojeParaPendencia && !t.pago_em;
                  return (
                    <li key={t.id}>
                      <LinhaComDeslizar
                        acao={removerTransacao.bind(null, t.id)}
                        textoConfirmacao={
                          t.recorrencia_id
                            ? "Excluir o lançamento deste mês? A conta fixa continua nos próximos meses — pra parar de vez, use Recorrentes."
                            : "Excluir esse lançamento? Não tem volta."
                        }
                        aoConcluir={() => recarregar?.()}
                      >
                        <div className="relative flex items-center gap-3 bg-base-800 pl-4 pr-1 py-3.5">
                          {/* faixa lateral: verde = entrou, vermelho = saiu */}
                          <span
                            className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
                              ehTransf ? "bg-base-600" : ehReceita ? "bg-habito" : "bg-red-400"
                            }`}
                            aria-hidden
                          />
                          <Link href={`/financas/${t.id}/editar`} className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="relative shrink-0">
                              <span
                                className={`w-11 h-11 rounded-full flex items-center justify-center text-base ${classeFundoSuave(
                                  catInfo?.cor ?? "financa"
                                )}`}
                              >
                                {catInfo?.icone ? (
                                  <IconeCategoria icone={catInfo.icone} />
                                ) : ehReceita ? (
                                  <TrendingUp size={18} strokeWidth={2} />
                                ) : (
                                  <TrendingDown size={18} strokeWidth={2} />
                                )}
                              </span>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-base-800 flex items-center justify-center text-white ${
                                  ehTransf ? "bg-ink-400" : ehReceita ? "bg-habito" : "bg-red-400"
                                }`}
                                aria-label={ehTransf ? "Transferência" : ehReceita ? "Receita" : "Despesa"}
                              >
                                {ehTransf ? <ArrowLeftRight size={10} strokeWidth={3} /> : ehReceita ? <ArrowUp size={11} strokeWidth={3} /> : <ArrowDown size={11} strokeWidth={3} />}
                              </span>
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-base font-medium truncate">{t.descricao || mapaContas.get(t.conta_id)}</span>
                              <span className="block text-sm text-ink-400 truncate">
                                {ehTransf ? "Transferência" : catInfo?.nome ?? "Sem categoria"} · {mapaContas.get(t.conta_id)}
                                {t.recorrencia_id && <span className="text-financa"> · ↻</span>}
                                {agendado && <span className="text-financa"> · agendado</span>}
                              </span>
                            </span>
                            <span className={`font-mono text-base font-semibold shrink-0 ${corValor}`}>
                              {ehTransf ? "" : ehReceita ? "+" : "−"}
                              <ValorMonetario valor={t.valor} />
                            </span>
                          </Link>
                          <MenuAcoes>
                            {(fecharMenu) => (
                              <>
                                <ItemMenuAcoes href={`/financas/${t.id}/editar`}>
                                  <Pencil size={15} strokeWidth={2} /> Editar
                                </ItemMenuAcoes>
                                <BotaoComConfirmacao
                                  acao={removerTransacao.bind(null, t.id)}
                                  textoBotao={
                                    <span className="flex items-center gap-2.5">
                                      <Trash2 size={15} strokeWidth={2} /> Excluir
                                    </span>
                                  }
                                  textoConfirmacao={
                          t.recorrencia_id
                            ? "Excluir o lançamento deste mês? A conta fixa continua nos próximos meses — pra parar de vez, use Recorrentes."
                            : "Excluir esse lançamento? Não tem volta."
                        }
                                  classeBotao="flex items-center w-full px-3.5 py-2 text-sm text-left text-red-400 hover:bg-base-700 transition"
                                  aoConcluir={() => {
                                    recarregar?.();
                                    fecharMenu();
                                  }}
                                />
                              </>
                            )}
                          </MenuAcoes>
                        </div>
                        {/* Etapa 238 — "relative" pra ficar POR CIMA da linha de cima (antes a
                           linha de cima cobria a parte de cima do "A pagar / Paguei") */}
                        {((t.etiquetas ?? []).length > 0 || t.data > hojeParaPendencia || t.pago_em || receitaAguardando(t, hojeParaPendencia)) && (
                          <div className="relative flex flex-wrap items-center gap-2 bg-base-800 pl-[4.5rem] pr-4 pt-0.5 pb-3.5 -mt-2 text-sm">
                            {(t.etiquetas ?? []).map((e: string) => (
                              <button key={e} type="button" onClick={() => setEtiquetaFiltro(e)} className="text-nota">
                                #{e}
                              </button>
                            ))}
                            <span className="empty:hidden">
                              <BotaoPaguei transacao={t} />
                            </span>
                          </div>
                        )}
                      </LinhaComDeslizar>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
  );
}
