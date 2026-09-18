"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PieChart, TrendingUp, TrendingDown } from "lucide-react";
import { IconeCategoria } from "@/components/IconeCategoria";
import { primeiroDiaDoMes, ultimoDiaDoMes } from "@/lib/financas/formatacao";
import { calcularSaldoPrevisto } from "@/lib/financas/consulta";
import { garantirLancamentosRecorrentes } from "./recorrentes/actions";
import { BarraOrcamento } from "@/components/BarraOrcamento";
import { BotaoRemoverTransacao } from "@/components/BotaoRemoverTransacao";
import { GraficoDespesasCategoriaLazy as GraficoDespesasCategoria } from "@/components/GraficoDespesasCategoriaLazy";
import { LinkVoltar } from "@/components/LinkVoltar";
import { HeroFinancas } from "@/components/HeroFinancas";
import { ListaContasComSaldo } from "@/components/ListaContasComSaldo";
import { ValorMonetario } from "@/components/ValorMonetario";
import { classeFundoSuave } from "@/lib/agenda/estilo";
<<<<<<< HEAD
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
=======
import { garantirLancamentosRecorrentes } from "./recorrentes/actions";
import { buscarCalendarioGastos, calcularSaldoPorConta, calcularSaldoPrevisto } from "@/lib/financas/consulta";
import { CalendarioGastos } from "@/components/CalendarioGastos";
import { normalizarOrdemBlocos } from "@/lib/financas/blocos";
import { getUsuarioAtual } from "@/lib/supabase/auth";

export default async function FinancasPage({
  searchParams,
}: {
  searchParams: { mes?: string; offline?: string; investido?: string };
}) {
  const supabase = createClient();
  const user = await getUsuarioAtual();

  // Dispara a geração de lançamentos recorrentes em segundo plano, sem
  // esperar o resultado — a tela não depende dele pra renderizar (se
  // criar algo novo hoje, pode não aparecer nesta visita específica,
  // mas aparece na próxima). Antes isso entrava no Promise.all de
  // baixo e travava a tela inteira esperando 2 consultas extras +
  // uma verificação de auth que não tinham nada a ver com o que é
  // mostrado aqui.
  garantirLancamentosRecorrentes().catch((erro) =>
    console.error("Falha ao gerar lançamentos recorrentes:", erro)
  );
>>>>>>> 663b0203d7e9f7910d0b3535498533049780d40e

// Etapa 127: versão local-first da tela de Início. Escopo reduzido de
// propósito em relação à versão anterior — o calendário de gastos, a
// ordem personalizável dos blocos, e os avatares de quem compartilha
// uma conta (isso precisa de foto vinda do servidor) ficam de fora
// por enquanto. O que continua: saldo, previsão, contas, orçamento,
// gráfico de despesas e lançamentos do mês — o essencial da tela.
export default function FinancasPage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = new Date();
  const mesAtualISO = hoje.toLocaleDateString("sv-SE").slice(0, 7);
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualISO);
  const ehMesAtual = mesSelecionado === mesAtualISO;

  useEffect(() => {
    garantirLancamentosRecorrentes().catch(() => {
      // Sem internet, sem problema — tenta de novo na próxima visita.
    });
  }, []);

  if (snapshot === undefined) {
    return (
      <main className="min-h-screen p-6 md:p-12 max-w-2xl lg:max-w-5xl mx-auto animate-pulse">
        <div className="h-64 bg-base-800 border border-base-600 rounded-xl2" />
      </main>
    );
  }

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

<<<<<<< HEAD
  const saldoTotal = contas
    .filter((c: any) => c.tipo !== "investimento")
    .reduce((total: number, c: any) => total + Number(c.saldo), 0);
=======
  // Grupo 1: nada aqui depende do resultado de outra consulta, então
  // tudo roda ao mesmo tempo em vez de uma coisa esperando a outra.
  const [
    { data: perfilOrdem },
    { data: contas },
    { data: todasCategoriasDespesa },
    { data: recorrenciasAtivas },
  ] = await Promise.all([
    supabase.from("perfis").select("ordem_blocos_financas").eq("id", user?.id ?? "").maybeSingle(),
    supabase.from("financa_contas").select("id, nome, banco, tipo, saldo_inicial").eq("arquivado", false),
    supabase.from("financa_categorias").select("id, nome, tipo, meta_mensal").eq("tipo", "despesa"),
    ehMesAtual
      ? supabase.from("financa_recorrencias").select("tipo, valor, dia_mes, data_fim").eq("ativo", true)
      : Promise.resolve({ data: [] as any[] }),
  ]);
>>>>>>> 663b0203d7e9f7910d0b3535498533049780d40e

  const saldoPrevisto = ehMesAtual
    ? calcularSaldoPrevisto(
        saldoTotal,
        recorrencias
          .filter((r) => r.ativo && (!r.data_fim || r.data_fim >= mesAtualISO + "-31"))
          .map((r) => ({ tipo: r.tipo, valor: Number(r.valor), diaMes: r.dia_mes })),
        hoje.getDate()
      )
    : null;

  const inicioMesSelecionado = primeiroDiaDoMes(mesSelecionado + "-01");
  const fimMesSelecionado = ultimoDiaDoMes(mesSelecionado + "-01");
  const transacoesDoMes = transacoes.filter((t: any) => t.data >= inicioMesSelecionado && t.data <= fimMesSelecionado);
  const receitasDoMes = transacoesDoMes.filter((t: any) => t.tipo === "receita").reduce((a: number, t: any) => a + Number(t.valor), 0);
  const despesasDoMes = transacoesDoMes.filter((t: any) => t.tipo === "despesa").reduce((a: number, t: any) => a + Number(t.valor), 0);

  const gastoPorCategoria = new Map<string, number>();
  for (const t of transacoesDoMes) {
    if (t.tipo !== "despesa" || !t.categoria_id) continue;
    gastoPorCategoria.set(t.categoria_id, (gastoPorCategoria.get(t.categoria_id) ?? 0) + Number(t.valor));
  }

  const mapaCategoriaInfo = new Map(categoriasFinancas.map((c: any) => [c.id, c]));
  const dadosGrafico = Array.from(gastoPorCategoria.entries())
    .map(([id, valor]) => ({ nome: (mapaCategoriaInfo.get(id) as any)?.nome ?? "Sem categoria", valor }))
    .sort((a, b) => b.valor - a.valor);

  const mapaContas = new Map(contas.map((c: any) => [c.id, c.nome]));
  const ultimasTransacoes = transacoesDoMes.slice(0, 10);

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl lg:max-w-5xl mx-auto">
      <LinkVoltar href="/dashboard" texto="Painel" />
      <h1 className="text-2xl font-display font-semibold mt-2 mb-6">Finanças</h1>

      {!contas.length ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
          <p className="font-display font-semibold mb-1">Nenhuma conta ainda</p>
          <p className="text-ink-400 text-sm mb-4">Crie sua primeira conta (carteira, banco ou cartão) para começar.</p>
          <Link
            href="/financas/contas"
            className="inline-block bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition"
          >
            Criar conta
          </Link>
        </div>
      ) : (
        <>
          <HeroFinancas
            saldo={saldoTotal}
            saldoPrevisto={saldoPrevisto}
            receitas={receitasDoMes}
            despesas={despesasDoMes}
            nomeMes={nomeDoMesSelecionado}
            hrefMesAnterior={`/financas?mes=${mesAnteriorISO}`}
            hrefMesProximo={`/financas?mes=${mesProximoISO}`}
            hrefHoje="/financas"
            ehMesAtual={ehMesAtual}
            aoMesAnterior={() => setMesSelecionado(mesAnteriorISO)}
            aoMesProximo={() => setMesSelecionado(mesProximoISO)}
            aoHoje={() => setMesSelecionado(mesAtualISO)}
          />

          <div className="lg:columns-2 lg:gap-6">
            <div className="lg:break-inside-avoid">
              <ListaContasComSaldo contas={contas as any} />
            </div>

            {categoriasComMeta.length > 0 && (
              <div className="mb-6 lg:break-inside-avoid">
                <p className="text-sm text-ink-400 mb-3">Orçamento do mês</p>
                <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 space-y-4">
                  {categoriasComMeta.map((cat: any) => (
                    <BarraOrcamento
                      key={cat.id}
                      nome={cat.nome}
                      gasto={gastoPorCategoria.get(cat.id) ?? 0}
                      meta={Number(cat.meta_mensal)}
                    />
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/financas/analise"
              className="flex items-center gap-3 bg-base-800 border border-base-600 border-l-4 border-l-financa rounded-xl2 p-4 mb-6 hover:border-financa transition lg:break-inside-avoid"
            >
              <span className="w-9 h-9 rounded-lg bg-financa/15 flex items-center justify-center text-financa shrink-0">
                <PieChart size={18} strokeWidth={2} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">Para onde vai seu dinheiro</p>
                <p className="text-xs text-ink-400 mt-0.5">Mapa de gastos, comparação com o mês passado e dicas automáticas</p>
              </div>
              <span className="text-ink-400 text-sm shrink-0">Ver →</span>
            </Link>

            {dadosGrafico.length > 0 && (
              <div className="mb-6 lg:break-inside-avoid">
                <p className="text-sm text-ink-400 mb-3 capitalize">Despesas por categoria · {nomeDoMesSelecionado}</p>
                <GraficoDespesasCategoria dados={dadosGrafico} />
              </div>
            )}

            <div className="mb-6 lg:break-inside-avoid">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-ink-400">Lançamentos do mês</p>
                <Link href="/financas/extrato" className="text-xs text-ink-400 hover:text-ink-100 transition">
                  Ver extrato completo →
                </Link>
              </div>
              {ultimasTransacoes.length === 0 ? (
                <p className="text-ink-400 text-sm">Nenhum lançamento nesse mês.</p>
              ) : (
                <ul className="space-y-2">
                  {ultimasTransacoes.map((t: any) => {
                    const catInfo = mapaCategoriaInfo.get(t.categoria_id) as any;
                    return (
                      <li key={t.id} className="bg-base-800 border border-base-600 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0 ${classeFundoSuave(
                              catInfo?.cor ?? "financa"
                            )}`}
                          >
                            {catInfo?.icone ? (
                              <IconeCategoria icone={catInfo.icone} />
                            ) : t.tipo === "receita" ? (
                              <TrendingUp size={16} strokeWidth={2} />
                            ) : (
                              <TrendingDown size={16} strokeWidth={2} />
                            )}
                          </span>
                          <p className="text-sm truncate flex-1 min-w-0">{t.descricao || mapaContas.get(t.conta_id)}</p>
                          <span className={`font-mono text-sm shrink-0 ${t.tipo === "receita" ? "text-habito" : "text-red-400"}`}>
                            {t.tipo === "receita" ? "+" : "-"}
                            <ValorMonetario valor={t.valor} />
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1.5 pl-12">
                          <p className="text-xs text-ink-400 truncate min-w-0">
                            {new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")} · {mapaContas.get(t.conta_id)}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <Link href={`/financas/${t.id}/editar`} className="text-ink-400 hover:text-ink-100 transition text-xs shrink-0">
                              Editar
                            </Link>
                            <BotaoRemoverTransacao transacaoId={t.id} />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
