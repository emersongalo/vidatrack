"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { PieChart, TrendingUp, TrendingDown, Bot, Settings2, Check, Pin, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import { IconeCategoria } from "@/components/IconeCategoria";
import { BotaoPaguei } from "@/components/BotaoPaguei";
import { primeiroDiaDoMes, ultimoDiaDoMes, formatarMoeda } from "@/lib/financas/formatacao";
import { calcularSaldoPrevisto } from "@/lib/financas/consulta";
import { garantirLancamentosRecorrentes } from "./recorrentes/actions";
import { BarraOrcamento } from "@/components/BarraOrcamento";
import { BotaoRemoverTransacao } from "@/components/BotaoRemoverTransacao";
import { CarrosselCategorias } from "@/components/CarrosselCategorias";
import { MapaCalorGastos } from "@/components/MapaCalorGastos";
import { LinkVoltar } from "@/components/LinkVoltar";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Esqueleto, CarregandoTela } from "@/components/Esqueleto";
import { HeroFinancas } from "@/components/HeroFinancas";
import { ListaContasComSaldo } from "@/components/ListaContasComSaldo";
import { ValorMonetario } from "@/components/ValorMonetario";
import { classeFundoSuave } from "@/lib/agenda/estilo";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { preverFimDoMes } from "@/lib/financas/previsao";
import { PrevisaoMes } from "@/components/PrevisaoMes";
import { AlertasFinancas } from "@/components/AlertasFinancas";
import { MetasResumo } from "@/components/MetasResumo";
import { TetoMensal } from "@/components/TetoMensal";
import { PodeGastarHoje } from "@/components/PodeGastarHoje";
import { GastosRapidos } from "@/components/GastosRapidos";
import { ConfirmarReceitas } from "@/components/ConfirmarReceitas";
import { ListaLancamentosPorDia } from "@/components/ListaLancamentosPorDia";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { salvarOrdemBlocosFinancas } from "./actions";
import {
  NOMES_BLOCOS_FINANCAS,
  alternarBloco,
  fixarNoTopo,
  lerLayoutBlocos,
  moverBloco,
  salvarLayoutBlocos,
  type BlocoFinancas,
} from "@/lib/financas/blocos";

// Etapa 127: versão local-first da tela de Início. Escopo reduzido de
// propósito em relação à versão anterior — o calendário de gastos, a
// ordem personalizável dos blocos, e os avatares de quem compartilha
// uma conta (isso precisa de foto vinda do servidor) ficam de fora
// por enquanto. O que continua: saldo, previsão, contas, orçamento,
// gráfico de despesas e lançamentos do mês — o essencial da tela.
export default function FinancasPage() {
  const { snapshot, recarregar } = useSnapshotOffline();
  const hoje = new Date();
  const mesAtualISO = hoje.toLocaleDateString("sv-SE").slice(0, 7);
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualISO);
  const [mostrarTodosLancamentos, setMostrarTodosLancamentos] = useState(false);
  const ehMesAtual = mesSelecionado === mesAtualISO;
  const [pessoas, setPessoas] = useState<{ nome: string; urlFoto: string | null }[]>([]);
  // Etapa 222 — "Personalizar início": ordem e blocos escondidos, salvos por login
  const [editandoLayout, setEditandoLayout] = useState(false);
  const [layoutEditado, setLayoutEditado] = useState<BlocoFinancas[] | null>(null);
  const [salvandoLayout, setSalvandoLayout] = useState(false);
  const [erroLayout, setErroLayout] = useState<string | null>(null);

  useEffect(() => {
    garantirLancamentosRecorrentes().catch(() => {
      // Sem internet, sem problema — tenta de novo na próxima visita.
    });
  }, []);

  useEffect(() => {
    if (!navigator.onLine) return;
    fetch("/api/financas/participantes")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.pessoas && setPessoas(d.pessoas))
      .catch(() => {});
  }, []);

  // Etapa 154/156 — alimenta os widgets de tela inicial "Saldo" e
  // "Contas a pagar". Precisa vir ANTES do "if (snapshot ===
  // undefined) return" abaixo — todo hook (use Effect, useState...)
  // tem que rodar em toda renderização, sempre na mesma ordem; um
  // hook só depois de um return condicional é chamado às vezes sim,
  // às vezes não, e foi exatamente isso que quebrou a aba Finanças
  // (erro #310 do React: "mais hooks numa renderização que na
  // outra"). Por isso calcula tudo de novo aqui, direto do
  // snapshot, em vez de reaproveitar saldoTotal/recorrências
  // (que só existem depois do return).
  // Etapa 195 — Saldo e Contas a pagar dos widgets agora vêm do
  // SincronizadorWidgets (layout), junto com todos os outros widgets.

  if (snapshot === undefined) return <CarregandoTela cartoes={4} linhas={3} />;

  const contas = snapshot?.financas.contas ?? [];
  const transacoes = snapshot?.financas.transacoes ?? [];
  const categoriasFinancas = snapshot?.financas.categorias ?? [];
  const recorrencias = snapshot?.financas.recorrencias ?? [];
  const categoriasComMeta = categoriasFinancas.filter((c) => c.tipo === "despesa" && c.meta_mensal !== null);

  const [anoSel, mesSelNum] = mesSelecionado.split("-").map(Number);
  const dataMesAnterior = new Date(anoSel, mesSelNum - 2, 1);
  const dataMesProximo = new Date(anoSel, mesSelNum, 1);
  const mesAnteriorISO = `${dataMesAnterior.getFullYear()}-${String(dataMesAnterior.getMonth() + 1).padStart(2, "0")}`;
  const mesProximoISO = `${dataMesProximo.getFullYear()}-${String(dataMesProximo.getMonth() + 1).padStart(2, "0")}`;
  const nomeDoMesSelecionado = new Date(anoSel, mesSelNum - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  // Etapa 211 — cartão de crédito não entra no "saldo em contas": o que
  // se gasta nele vira fatura, e só sai do saldo quando a fatura é paga.
  const saldoTotal = contas
    .filter((c: any) => c.tipo !== "investimento" && c.tipo !== "cartao")
    .reduce((total: number, c: any) => total + Number(c.saldo), 0);

  const totalInvestido = contas
    .filter((c: any) => c.tipo === "investimento")
    .reduce((total: number, c: any) => total + Number(c.saldo), 0);

  // Etapa 203 — lançamentos com data futura (ex: conta agendada pro
  // dia 5 do mês que vem) não saem do saldo de hoje, mas entram no
  // "previsto" do mês em que vencem.
  const hojeISOBr = hoje.toLocaleDateString("sv-SE");
  const idsContasComuns = new Set(contas.filter((c: any) => c.tipo !== "investimento" && c.tipo !== "cartao").map((c: any) => c.id));
  const futurosAte = (limiteISO: string) =>
    transacoes
      .filter((t: any) => idsContasComuns.has(t.conta_id) && t.data > hojeISOBr && t.data <= limiteISO && !t.pago_em)
      .reduce((s: number, t: any) => s + (t.tipo === "receita" ? Number(t.valor) : -Number(t.valor)), 0);
  const ehMesFuturo = mesSelecionado > mesAtualISO;

  const saldoPrevistoBase = ehMesAtual
    ? calcularSaldoPrevisto(
        saldoTotal,
        recorrencias
          .filter(
            (r: any) =>
              r.ativo &&
              (!r.data_fim || r.data_fim >= mesAtualISO + "-31") &&
              // Etapa 205 — recorrência que só começa num mês futuro não entra no previsto deste
              (!r.data_inicio || r.data_inicio <= ultimoDiaDoMes(mesAtualISO + "-01"))
          )
          .map((r) => ({ tipo: r.tipo, valor: Number(r.valor), diaMes: r.dia_mes })),
        hoje.getDate()
      )
    : null;
  // Etapa 215 — previsão completa do mês atual (agendados + recorrentes
  // ainda não lançadas + faturas do cartão), sem contar nada duas vezes.
  const previsao = ehMesAtual
    ? preverFimDoMes({ contas: contas as any, transacoes: transacoes as any, recorrencias: recorrencias as any, hojeISO: hojeISOBr, saldoHoje: saldoTotal })
    : null;
  const saldoPrevisto = previsao
    ? previsao.sobra
    : saldoPrevistoBase !== null
      ? saldoPrevistoBase + futurosAte(ultimoDiaDoMes(mesAtualISO + "-01"))
      : ehMesFuturo
        ? saldoTotal + futurosAte(ultimoDiaDoMes(mesSelecionado + "-01"))
        : null;

  const inicioMesSelecionado = primeiroDiaDoMes(mesSelecionado + "-01");
  const fimMesSelecionado = ultimoDiaDoMes(mesSelecionado + "-01");
  const transacoesDoMes = transacoes.filter((t: any) => t.data >= inicioMesSelecionado && t.data <= fimMesSelecionado);
  // Etapa 211 — transferência entre contas não é receita nem gasto de verdade
  const movimentosDoMes = transacoesDoMes.filter((t: any) => !t.transferencia_grupo);
  const receitasDoMes = movimentosDoMes.filter((t: any) => t.tipo === "receita").reduce((a: number, t: any) => a + Number(t.valor), 0);
  const despesasDoMes = movimentosDoMes.filter((t: any) => t.tipo === "despesa").reduce((a: number, t: any) => a + Number(t.valor), 0);

  const gastoPorCategoria = new Map<string, number>();
  for (const t of movimentosDoMes) {
    if (t.tipo !== "despesa" || !t.categoria_id) continue;
    gastoPorCategoria.set(t.categoria_id, (gastoPorCategoria.get(t.categoria_id) ?? 0) + Number(t.valor));
  }

  const mapaCategoriaInfo = new Map(categoriasFinancas.map((c: any) => [c.id, c]));
  const dadosGrafico = Array.from(gastoPorCategoria.entries())
    .map(([id, valor]) => ({
      nome: (mapaCategoriaInfo.get(id) as any)?.nome ?? "Sem categoria",
      valor,
      // Etapa 197 — tocar na categoria abre o Extrato só dela, no mês visto
      href: `/financas/extrato?categoria=${id}&tipo=despesa&mes=${mesSelecionado}`,
    }))
    .sort((a, b) => b.valor - a.valor);

  // Etapa 237 — o que entrou, por categoria (pra deslizar ao lado das despesas)
  const receitaPorCategoria = new Map<string, number>();
  for (const t of movimentosDoMes) {
    if (t.tipo !== "receita") continue;
    const k = t.categoria_id ?? "sem";
    receitaPorCategoria.set(k, (receitaPorCategoria.get(k) ?? 0) + Number(t.valor));
  }
  const dadosReceitas = Array.from(receitaPorCategoria.entries())
    .map(([id, valor]) => ({
      nome: id === "sem" ? "Sem categoria" : (mapaCategoriaInfo.get(id) as any)?.nome ?? "Sem categoria",
      valor,
      href: `/financas/extrato?categoria=${id}&tipo=receita&mes=${mesSelecionado}`,
    }))
    .sort((a, b) => b.valor - a.valor);

  const mapaContas = new Map(contas.map((c: any) => [c.id, c.nome]));
  // Etapa 207 — antes cortava em 10 sem avisar; agora mostra 10 e um
  // botão "Ver todos" (o mês inteiro, inclusive os agendados).
  const ultimasTransacoes = mostrarTodosLancamentos ? transacoesDoMes : transacoesDoMes.slice(0, 10);
  const lancamentosEscondidos = transacoesDoMes.length - ultimasTransacoes.length;

  const gastoPorDiaMapaInicio = new Map<number, number>();
  for (const t of movimentosDoMes) {
    if (t.tipo !== "despesa") continue;
    const dia = Number(t.data.slice(8, 10));
    gastoPorDiaMapaInicio.set(dia, (gastoPorDiaMapaInicio.get(dia) ?? 0) + Number(t.valor));
  }

  const layoutSalvo = lerLayoutBlocos(snapshot?.financas.ordemBlocosFinancas);
  const layout = editandoLayout && layoutEditado ? layoutEditado : layoutSalvo;

  async function salvarLayout() {
    if (!layoutEditado) return setEditandoLayout(false);
    setSalvandoLayout(true);
    setErroLayout(null);
    try {
      await salvarOrdemBlocosFinancas(salvarLayoutBlocos(layoutEditado));
      await atualizarSnapshotEmTodasAsTelas();
      setEditandoLayout(false);
    } catch {
      setErroLayout("Não consegui salvar. Verifique a internet.");
    }
    setSalvandoLayout(false);
  }

  const blocoGrafico =
    dadosGrafico.length > 0 || dadosReceitas.length > 0 ? (
      <div key="grafico" className="mb-6 lg:break-inside-avoid">
        {/* Etapa 237 — despesas e receitas: arraste pro lado pra ver o que entrou */}
        <h2 className="text-xl font-semibold mb-3">Por categoria</h2>
        <CarrosselCategorias despesas={dadosGrafico} receitas={dadosReceitas} mapaCategoriaInfo={mapaCategoriaInfo} />

        {/* Etapa 176 — mapa de calor logo abaixo do gráfico de
           categorias, a pedido: mesma ideia da Análise, só que aqui
           na Início pra não precisar navegar pra ver. */}
        <h2 className="text-xl font-semibold mb-3 mt-6">Gasto por dia</h2>
        <div className="bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 p-4">
          <MapaCalorGastos
            anoMesISO={mesSelecionado}
            gastoPorDia={gastoPorDiaMapaInicio}
            hrefDoDia={(dia) => `/financas/extrato?tipo=despesa&dia=${dia}`}
          />
        </div>
      </div>
    ) : null;

  const blocoLancamentos = (
    <div key="lancamentos" className="mb-6 lg:break-inside-avoid">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Lançamentos do mês</h2>
        <Link href={`/financas/extrato?mes=${mesSelecionado}`} className="text-base text-ink-400 hover:text-ink-100 transition">
          Ver tudo ›
        </Link>
      </div>
      {ultimasTransacoes.length === 0 ? (
        <EstadoVazio compacto emoji="🧾" tom="financa" titulo="Nada lançado nesse mês" texto="Use o + ou o Lançar rápido pra registrar o primeiro gasto." />
      ) : (
        // Etapa 226 — mesma lista do Extrato (por dia, verde/vermelho)
        <ListaLancamentosPorDia
          lista={ultimasTransacoes as any[]}
          mapaCategorias={mapaCategoriaInfo as Map<string, any>}
          mapaContas={mapaContas as Map<string, any>}
          recarregar={recarregar}
        />
      )}
      {lancamentosEscondidos > 0 && (
        <button
          type="button"
          onClick={() => setMostrarTodosLancamentos(true)}
          className="w-full mt-2 text-sm text-financa border border-financa/30 rounded-2xl py-3.5 hover:bg-financa/10 transition"
        >
          Ver todos os {transacoesDoMes.length} lançamentos do mês
        </button>
      )}
    </div>
  );

  const blocosPorId: Record<string, ReactNode> = {
    // Etapa 247
    hoje: snapshot && ehMesAtual ? <PodeGastarHoje snapshot={snapshot} hojeISO={hojeISOBr} /> : null,
    rapidos: snapshot && ehMesAtual ? <GastosRapidos snapshot={snapshot} hojeISO={hojeISOBr} /> : null,
    previsao: previsao ? <PrevisaoMes previsao={previsao} /> : null,
    teto: snapshot && ehMesAtual ? <TetoMensal snapshot={snapshot} hojeISO={hojeISOBr} /> : null,
    contas: <ListaContasComSaldo contas={contas as any} transacoes={transacoes as any} />,
    orcamento: (
      categoriasComMeta.length > 0 ? (
              <div className="mb-6 lg:break-inside-avoid">
                <h2 className="text-xl font-semibold mb-3">Orçamento do mês</h2>
                <div className="bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 p-4 space-y-4">
                  {categoriasComMeta.map((cat: any) => (
                    <BarraOrcamento
                      key={cat.id}
                      nome={cat.nome}
                      gasto={gastoPorCategoria.get(cat.id) ?? 0}
                      meta={Number(cat.meta_mensal)}
                      href={`/financas/extrato?categoria=${cat.id}&tipo=despesa&mes=${mesSelecionado}`}
                    />
                  ))}
                </div>
              </div>
      ) : null
    ),
    metas: <MetasResumo metas={snapshot?.financas.metas ?? []} hojeISO={hojeISOBr} />,
    atalhos: (
      <>
            <Link
              href="/financas/assistente"
              className="flex items-center gap-3 bg-base-800 border border-base-600 border-l-4 border-l-habito rounded-xl2 p-4 mb-4 hover:border-habito transition lg:break-inside-avoid"
            >
              <span className="w-9 h-9 rounded-lg bg-habito/15 flex items-center justify-center text-habito shrink-0">
                <Bot size={18} strokeWidth={2} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-medium">Assistente</p>
                <p className="text-xs text-ink-400 mt-0.5">Pergunte sobre seus gastos ou peça pra lançar algo</p>
              </div>
              <span className="text-ink-400 text-sm shrink-0">Abrir →</span>
            </Link>
            <Link
              href="/financas/analise"
              className="flex items-center gap-3 bg-base-800 border border-base-600 border-l-4 border-l-financa rounded-xl2 p-4 mb-6 hover:border-financa transition lg:break-inside-avoid"
            >
              <span className="w-9 h-9 rounded-lg bg-financa/15 flex items-center justify-center text-financa shrink-0">
                <PieChart size={18} strokeWidth={2} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-medium">Para onde vai seu dinheiro</p>
                <p className="text-xs text-ink-400 mt-0.5">Mapa de gastos, comparação com o mês passado e dicas automáticas</p>
              </div>
              <span className="text-ink-400 text-sm shrink-0">Ver →</span>
            </Link>
      </>
    ),
    grafico: blocoGrafico,
    lancamentos: blocoLancamentos,
  };

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      {/* Etapa 230 — no celular o voltar e as abas ficam no topo (AbasArea) */}
      <div className="hidden lg:block">
        <LinkVoltar href="/dashboard" texto="Painel" />
      </div>
      <h1 className="text-3xl font-display font-bold mt-2 mb-6">Finanças</h1>

      {snapshot === undefined ? (
        <Esqueleto linhas={3} />
      ) : !contas.length ? (
        <EstadoVazio
          emoji="🏦"
          tom="financa"
          titulo="Nenhuma conta ainda"
          texto="Adicione sua carteira, banco ou cartão pra começar."
          acao={{ rotulo: "+ Adicionar conta", href: "/financas/contas" }}
        />
      ) : (
        <>
          <HeroFinancas
            saldo={saldoTotal}
            saldoPrevisto={saldoPrevisto}
            receitas={receitasDoMes}
            despesas={despesasDoMes}
            totalInvestido={totalInvestido}
            nomeMes={anoSel === hoje.getFullYear() ? new Date(anoSel, mesSelNum - 1, 1).toLocaleDateString("pt-BR", { month: "long" }) : nomeDoMesSelecionado}
            nomeMesAnterior={dataMesAnterior.toLocaleDateString("pt-BR", { month: "long" })}
            nomeMesProximo={dataMesProximo.toLocaleDateString("pt-BR", { month: "long" })}
            pessoas={pessoas}
            hrefMesAnterior={`/financas?mes=${mesAnteriorISO}`}
            hrefMesProximo={`/financas?mes=${mesProximoISO}`}
            hrefHoje="/financas"
            ehMesAtual={ehMesAtual}
            aoMesAnterior={() => { setMesSelecionado(mesAnteriorISO); setMostrarTodosLancamentos(false); }}
            aoMesProximo={() => { setMesSelecionado(mesProximoISO); setMostrarTodosLancamentos(false); }}
            aoHoje={() => { setMesSelecionado(mesAtualISO); setMostrarTodosLancamentos(false); }}
          />

          {/* Etapa 268 — "essa receita caiu?" */}
          {snapshot && <ConfirmarReceitas snapshot={snapshot} />}
          {snapshot && ehMesAtual && <AlertasFinancas snapshot={snapshot} hojeISO={hojeISOBr} />}

          {/* Etapa 222 — personalizar a ordem e esconder blocos (vale só pro seu login) */}
          <div className="flex items-center justify-end gap-2 -mt-2 mb-4">
            {editandoLayout ? (
              <>
                <button onClick={() => setEditandoLayout(false)} className="text-sm text-ink-400 px-3 py-1.5">
                  Cancelar
                </button>
                <button
                  onClick={salvarLayout}
                  disabled={salvandoLayout}
                  className="flex items-center gap-1.5 bg-financa text-base-900 text-sm font-semibold rounded-full px-4 py-1.5 disabled:opacity-50"
                >
                  <Check size={15} /> {salvandoLayout ? "Salvando..." : "Salvar ordem"}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setLayoutEditado(layoutSalvo);
                  setErroLayout(null);
                  setEditandoLayout(true);
                }}
                className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100 transition"
              >
                <Settings2 size={15} /> Personalizar início
              </button>
            )}
          </div>
          {erroLayout && <p className="text-sm text-red-400 mb-3">{erroLayout}</p>}

          <div className="lg:columns-2 lg:gap-6">
            {layout.map((b, i) => {
              const conteudo = blocosPorId[b.id];
              if (!editandoLayout) return b.visivel && conteudo ? <div key={b.id} className="lg:break-inside-avoid">{conteudo}</div> : null;
              const mexer = (novo: BlocoFinancas[]) => setLayoutEditado(novo);
              return (
                <div key={b.id} className={`mb-4 rounded-xl2 border border-financa/40 p-2 lg:break-inside-avoid ${b.visivel ? "" : "opacity-40"}`}>
                  <div className="flex items-center gap-1 mb-2">
                    <p className="text-sm font-medium flex-1 min-w-0 truncate px-1">{NOMES_BLOCOS_FINANCAS[b.id]}</p>
                    <BotaoLayout rotulo="Fixar no topo" desativado={i === 0} aoClicar={() => mexer(fixarNoTopo(layout, i))}>
                      <Pin size={15} />
                    </BotaoLayout>
                    <BotaoLayout rotulo="Subir" desativado={i === 0} aoClicar={() => mexer(moverBloco(layout, i, -1))}>
                      <ChevronUp size={15} />
                    </BotaoLayout>
                    <BotaoLayout rotulo="Descer" desativado={i === layout.length - 1} aoClicar={() => mexer(moverBloco(layout, i, 1))}>
                      <ChevronDown size={15} />
                    </BotaoLayout>
                    <BotaoLayout rotulo={b.visivel ? "Esconder" : "Mostrar"} aoClicar={() => mexer(alternarBloco(layout, i))}>
                      {b.visivel ? <Eye size={15} /> : <EyeOff size={15} />}
                    </BotaoLayout>
                  </div>
                  {conteudo && b.visivel ? (
                    <div className="pointer-events-none max-h-48 overflow-hidden">{conteudo}</div>
                  ) : (
                    <p className="text-xs text-ink-400 px-1 pb-1">{b.visivel ? "Nada pra mostrar agora" : "Escondido"}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

function BotaoLayout({ children, aoClicar, rotulo, desativado }: { children: ReactNode; aoClicar: () => void; rotulo: string; desativado?: boolean }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={desativado}
      aria-label={rotulo}
      title={rotulo}
      className="w-8 h-8 rounded-lg flex items-center justify-center bg-base-700 text-ink-100 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
