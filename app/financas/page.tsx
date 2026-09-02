import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda, primeiroDiaDoMes, nomeDoMesAtual } from "@/lib/financas/formatacao";
import { BarraOrcamento } from "@/components/BarraOrcamento";
import { BotaoRemoverTransacao } from "@/components/BotaoRemoverTransacao";
import { GraficoDespesasCategoria } from "@/components/GraficoDespesasCategoria";
import { IndicadorSaldo } from "@/components/IndicadorSaldo";
import { classeFundoSuave } from "@/lib/agenda/estilo";
import { garantirLancamentosRecorrentes } from "./recorrentes/actions";

export default async function FinancasPage() {
  const supabase = createClient();
  await garantirLancamentosRecorrentes();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: contas } = await supabase
    .from("financa_contas")
    .select("id, nome, saldo_inicial")
    .eq("arquivado", false);

  const idsContas = (contas ?? []).map((c) => c.id);

  const { data: todasTransacoes } = idsContas.length
    ? await supabase
        .from("financa_transacoes")
        .select("id, conta_id, categoria_id, tipo, valor, descricao, data, dono_id, financa_categorias(icone, cor)")
        .in("conta_id", idsContas)
        .order("data", { ascending: false })
    : { data: [] as any[] };

  const transacoes = todasTransacoes ?? [];

  // Saldo total: saldo inicial de cada conta + receitas - despesas dela
  const saldoTotal = (contas ?? []).reduce((total, conta) => {
    const doTransacoes = transacoes
      .filter((t) => t.conta_id === conta.id)
      .reduce((acc, t) => acc + (t.tipo === "receita" ? t.valor : -t.valor), 0);
    return total + Number(conta.saldo_inicial) + doTransacoes;
  }, 0);

  const inicioMes = primeiroDiaDoMes();
  const transacoesDoMes = transacoes.filter((t) => t.data >= inicioMes);
  const receitasDoMes = transacoesDoMes
    .filter((t) => t.tipo === "receita")
    .reduce((acc, t) => acc + t.valor, 0);
  const despesasDoMes = transacoesDoMes
    .filter((t) => t.tipo === "despesa")
    .reduce((acc, t) => acc + t.valor, 0);

  // Orçamento por categoria (só categorias de despesa com meta definida)
  const { data: categorias } = await supabase
    .from("financa_categorias")
    .select("id, nome, tipo, meta_mensal")
    .eq("tipo", "despesa")
    .not("meta_mensal", "is", null);

  // Todas as categorias de despesa (com ou sem meta), pro gráfico de pizza
  const { data: todasCategoriasDespesa } = await supabase
    .from("financa_categorias")
    .select("id, nome")
    .eq("tipo", "despesa");

  const gastoPorCategoria = new Map<string, number>();
  for (const t of transacoesDoMes) {
    if (t.tipo !== "despesa" || !t.categoria_id) continue;
    gastoPorCategoria.set(t.categoria_id, (gastoPorCategoria.get(t.categoria_id) ?? 0) + t.valor);
  }

  const nomeCategoria = new Map((todasCategoriasDespesa ?? []).map((c) => [c.id, c.nome]));
  const dadosGrafico = Array.from(gastoPorCategoria.entries())
    .map(([id, valor]) => ({ nome: nomeCategoria.get(id) ?? "Sem categoria", valor }))
    .sort((a, b) => b.valor - a.valor);

  const mapaContas = new Map((contas ?? []).map((c) => [c.id, c.nome]));
  const ultimasTransacoes = transacoes.slice(0, 10);

  // Nomes de quem lançou — só busca se houver mais de uma pessoa
  // diferente lançando (ou seja, conta compartilhada de verdade).
  // Pra hábitos particulares/contas sem compartilhamento, isso não
  // aparece na tela (evita poluir visual à toa).
  const idsDonosUnicos = Array.from(new Set(transacoes.map((t: any) => t.dono_id)));
  let mapaNomes = new Map<string, string>();
  if (idsDonosUnicos.length > 1) {
    const { data: perfis } = await supabase.from("perfis").select("id, nome").in("id", idsDonosUnicos);
    mapaNomes = new Map((perfis ?? []).map((p) => [p.id, p.nome ?? "Alguém"]));
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard" className="text-ink-400 text-sm hover:text-ink-100 transition">
            ← Painel
          </Link>
          <h1 className="text-2xl font-display font-semibold mt-2">Finanças</h1>
        </div>
        <Link
          href="/financas/nova"
          className="flex items-center gap-1.5 bg-financa text-base-900 text-sm font-semibold rounded-lg px-5 py-2.5 shadow-lg shadow-financa/25 hover:opacity-90 hover:scale-105 transition"
        >
          <span className="text-base leading-none">+</span> Lançamento
        </Link>
      </div>

      {!contas || contas.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
          <p className="font-display font-semibold mb-1">Nenhuma conta ainda</p>
          <p className="text-ink-400 text-sm mb-4">
            Crie sua primeira conta (carteira, banco ou cartão) para começar.
          </p>
          <Link
            href="/financas/contas"
            className="inline-block bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition"
          >
            Criar conta
          </Link>
        </div>
      ) : (
        <>
          {/* Saldo total, com indicador animado positivo/negativo */}
          <div className="mb-4">
            <IndicadorSaldo saldo={saldoTotal} />
          </div>

          {/* Resumo do mês */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
              <p className="text-ink-400 text-xs mb-1 capitalize">Receitas · {nomeDoMesAtual()}</p>
              <p className="font-mono font-medium text-habito">{formatarMoeda(receitasDoMes)}</p>
            </div>
            <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
              <p className="text-ink-400 text-xs mb-1 capitalize">Despesas · {nomeDoMesAtual()}</p>
              <p className="font-mono font-medium text-red-400">{formatarMoeda(despesasDoMes)}</p>
            </div>
          </div>

          {/* Orçamento por categoria */}
          {categorias && categorias.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-ink-400 mb-3">Orçamento do mês</p>
              <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 space-y-4">
                {categorias.map((cat) => (
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

          {/* Link de destaque pra análise avançada */}
          <Link
            href="/financas/analise"
            className="flex items-center justify-between bg-base-800 border border-base-600 border-l-4 border-l-financa rounded-xl2 p-4 mb-6 hover:border-financa transition"
          >
            <div>
              <p className="font-medium">📊 Para onde vai seu dinheiro</p>
              <p className="text-xs text-ink-400 mt-0.5">Mapa de gastos, comparação com o mês passado e dicas automáticas</p>
            </div>
            <span className="text-ink-400 text-sm shrink-0">Ver →</span>
          </Link>

          {/* Link do assistente de IA */}
          <Link
            href="/financas/assistente"
            className="flex items-center justify-between bg-base-800 border border-base-600 border-l-4 border-l-nota rounded-xl2 p-4 mb-6 hover:border-nota transition"
          >
            <div>
              <p className="font-medium">🤖 Pergunte ao assistente</p>
              <p className="text-xs text-ink-400 mt-0.5">Tire dúvidas sobre gastos, orçamento e pendências, na conversa</p>
            </div>
            <span className="text-ink-400 text-sm shrink-0">Abrir →</span>
          </Link>

          {/* Gráfico de despesas do mês por categoria */}
          {dadosGrafico.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-ink-400 mb-3">Despesas por categoria · {nomeDoMesAtual()}</p>
              <GraficoDespesasCategoria dados={dadosGrafico} />
            </div>
          )}

          {/* Links rápidos */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-6 text-sm">
            <Link href="/financas/contas" className="text-ink-400 hover:text-ink-100 transition underline">
              Contas
            </Link>
            <Link href="/financas/categorias" className="text-ink-400 hover:text-ink-100 transition underline">
              Categorias
            </Link>
            <Link href="/financas/recorrentes" className="text-ink-400 hover:text-ink-100 transition underline">
              Recorrentes
            </Link>
            <Link href="/financas/exportar" className="text-ink-400 hover:text-ink-100 transition underline">
              Exportar CSV
            </Link>
          </div>

          {/* Últimos lançamentos */}
          <p className="text-sm text-ink-400 mb-3">Últimos lançamentos</p>
          {ultimasTransacoes.length === 0 ? (
            <p className="text-ink-400 text-sm">Nenhum lançamento ainda.</p>
          ) : (
            <ul className="space-y-2">
              {ultimasTransacoes.map((t: any) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg p-3"
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${classeFundoSuave(
                      t.financa_categorias?.cor ?? "financa"
                    )}`}
                  >
                    {t.financa_categorias?.icone ?? (t.tipo === "receita" ? "💰" : "💸")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{t.descricao || mapaContas.get(t.conta_id)}</p>
                    <p className="text-xs text-ink-400 flex items-center gap-1.5 flex-wrap">
                      <span>
                        {new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")} ·{" "}
                        {mapaContas.get(t.conta_id)}
                      </span>
                      {mapaNomes.has(t.dono_id) && (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                            t.dono_id === user?.id ? "bg-base-600 text-ink-400" : "bg-nota-soft text-nota"
                          }`}
                        >
                          👤 {t.dono_id === user?.id ? "Você" : mapaNomes.get(t.dono_id) ?? "Alguém"}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-sm shrink-0 ${
                      t.tipo === "receita" ? "text-habito" : "text-red-400"
                    }`}
                  >
                    {t.tipo === "receita" ? "+" : "-"}
                    {formatarMoeda(t.valor)}
                  </span>
                  <Link
                    href={`/financas/${t.id}/editar`}
                    className="text-ink-400 hover:text-ink-100 transition text-xs shrink-0"
                  >
                    Editar
                  </Link>
                  <BotaoRemoverTransacao transacaoId={t.id} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
