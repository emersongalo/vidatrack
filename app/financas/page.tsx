import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { primeiroDiaDoMes, ultimoDiaDoMes } from "@/lib/financas/formatacao";
import { BarraOrcamento } from "@/components/BarraOrcamento";
import { BotaoRemoverTransacao } from "@/components/BotaoRemoverTransacao";
import { GraficoDespesasCategoria } from "@/components/GraficoDespesasCategoria";
import { LinkVoltar } from "@/components/LinkVoltar";
import { HeroFinancas } from "@/components/HeroFinancas";
import { ListaContasComSaldo } from "@/components/ListaContasComSaldo";
import { resolverUrlFoto } from "@/lib/perfil/foto";
import { ValorMonetario } from "@/components/ValorMonetario";
import { classeFundoSuave } from "@/lib/agenda/estilo";
import { garantirLancamentosRecorrentes } from "./recorrentes/actions";
import { buscarCalendarioGastos, buscarSaldoPorConta, calcularSaldoPrevisto } from "@/lib/financas/consulta";
import { CalendarioGastos } from "@/components/CalendarioGastos";
import { normalizarOrdemBlocos } from "@/lib/financas/blocos";

export default async function FinancasPage({
  searchParams,
}: {
  searchParams: { mes?: string; offline?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hoje = new Date();
  const mesAtualISO = hoje.toLocaleDateString("sv-SE").slice(0, 7);
  const mesSelecionado = searchParams.mes ?? mesAtualISO;
  const ehMesAtual = mesSelecionado === mesAtualISO;

  const [anoSel, mesSelNum] = mesSelecionado.split("-").map(Number);
  const dataMesAnterior = new Date(anoSel, mesSelNum - 2, 1);
  const dataMesProximo = new Date(anoSel, mesSelNum, 1);
  const mesAnteriorISO = `${dataMesAnterior.getFullYear()}-${String(dataMesAnterior.getMonth() + 1).padStart(2, "0")}`;
  const mesProximoISO = `${dataMesProximo.getFullYear()}-${String(dataMesProximo.getMonth() + 1).padStart(2, "0")}`;
  const nomeDoMesSelecionado = new Date(anoSel, mesSelNum - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  // Grupo 1: nada aqui depende do resultado de outra consulta, então
  // tudo roda ao mesmo tempo em vez de uma coisa esperando a outra.
  // O gerador de recorrências roda em paralelo também — não bloqueia
  // mais o resto da tela (se criar algo novo hoje, pode não aparecer
  // nesta visita específica, mas aparece na próxima).
  const [
    { data: perfilOrdem },
    { data: contas },
    { data: todasCategoriasDespesa },
    contasComSaldo,
    { data: recorrenciasAtivas },
  ] = await Promise.all([
    supabase.from("perfis").select("ordem_blocos_financas").eq("id", user?.id ?? "").maybeSingle(),
    supabase.from("financa_contas").select("id, nome, saldo_inicial").eq("arquivado", false),
    supabase.from("financa_categorias").select("id, nome, tipo, meta_mensal").eq("tipo", "despesa"),
    buscarSaldoPorConta(supabase),
    ehMesAtual
      ? supabase.from("financa_recorrencias").select("tipo, valor, dia_mes, data_fim").eq("ativo", true)
      : Promise.resolve({ data: [] as any[] }),
    garantirLancamentosRecorrentes(),
  ]);

  const ordemBlocos = normalizarOrdemBlocos(perfilOrdem?.ordem_blocos_financas ?? null);
  const categorias = (todasCategoriasDespesa ?? []).filter((c) => c.meta_mensal !== null);
  const idsContas = (contas ?? []).map((c) => c.id);

  // Grupo 2: tudo que só precisa saber quais são as contas (já temos
  // a resposta do grupo 1), roda em paralelo de novo.
  const [
    { data: todasTransacoes },
    { data: compartilhamentosContas },
    { gastosPorDia, diasComContaAPagar },
  ] = await Promise.all([
    idsContas.length
      ? supabase
          .from("financa_transacoes")
          .select("id, conta_id, categoria_id, tipo, valor, descricao, data, dono_id, financa_categorias(icone, cor)")
          .in("conta_id", idsContas)
          .order("data", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    idsContas.length
      ? supabase
          .from("compartilhamentos")
          .select("usuario_convidado_id")
          .eq("tipo_item", "financa")
          .in("item_id", idsContas)
          .not("usuario_convidado_id", "is", null)
      : Promise.resolve({ data: [] as any[] }),
    buscarCalendarioGastos(supabase, mesSelecionado, idsContas),
  ]);

  const transacoes = todasTransacoes ?? [];

  // Grupo 3: junta todo mundo cuja foto/nome precisamos exibir (quem
  // compartilha uma conta + quem lançou cada transação) numa única
  // consulta de perfis, em vez de uma pra cada finalidade.
  const idsConvidados = Array.from(
    new Set((compartilhamentosContas ?? []).map((c) => c.usuario_convidado_id as string))
  );
  const idsDonosUnicos = Array.from(new Set(transacoes.map((t: any) => t.dono_id)));
  const precisaNomesDeLancamento = idsDonosUnicos.length > 1;

  const idsPerfisNecessarios = Array.from(
    new Set([
      ...(idsConvidados.length > 0 && user?.id ? [user.id] : []),
      ...idsConvidados,
      ...(precisaNomesDeLancamento ? idsDonosUnicos : []),
    ])
  );

  const { data: perfisNecessarios } = idsPerfisNecessarios.length
    ? await supabase.from("perfis").select("id, nome, foto_url").in("id", idsPerfisNecessarios)
    : { data: [] as any[] };

  const mapaPerfis = new Map((perfisNecessarios ?? []).map((p) => [p.id, p]));

  // As URLs de foto (algumas exigem gerar um link assinado no R2) são
  // resolvidas todas ao mesmo tempo, não uma de cada vez.
  const idsParaResolverFoto = (perfisNecessarios ?? []).map((p) => p.id);
  const urlsResolvidas = await Promise.all(
    idsParaResolverFoto.map((id) => resolverUrlFoto(mapaPerfis.get(id)?.foto_url ?? null))
  );
  const mapaUrlFoto = new Map(idsParaResolverFoto.map((id, i) => [id, urlsResolvidas[i]]));

  let pessoasCompartilhadas: { nome: string; urlFoto: string | null }[] = [];
  if (idsConvidados.length > 0) {
    pessoasCompartilhadas = [
      { nome: "Você", urlFoto: user?.id ? mapaUrlFoto.get(user.id) ?? null : null },
      ...idsConvidados.map((id) => ({
        nome: mapaPerfis.get(id)?.nome ?? "Alguém",
        urlFoto: mapaUrlFoto.get(id) ?? null,
      })),
    ];
  }

  let mapaNomes = new Map<string, string>();
  if (precisaNomesDeLancamento) {
    mapaNomes = new Map(idsDonosUnicos.map((id) => [id, mapaPerfis.get(id)?.nome ?? "Alguém"]));
  }

  // Saldo atual: saldo inicial de cada conta + receitas - despesas dela,
  // sempre "agora" — não muda navegando entre meses (seu saldo de hoje
  // é o mesmo, esteja você olhando o extrato de março ou de setembro).
  const saldoTotal = (contas ?? []).reduce((total, conta) => {
    const doTransacoes = transacoes
      .filter((t) => t.conta_id === conta.id)
      .reduce((acc, t) => acc + (t.tipo === "receita" ? t.valor : -t.valor), 0);
    return total + Number(conta.saldo_inicial) + doTransacoes;
  }, 0);

  // Previsto pro fim do mês: só faz sentido "prever o futuro" pro mês
  // atual — pra um mês passado, já sabemos exatamente como terminou
  // (é só olhar o extrato), não tem nada a prever.
  const saldoPrevisto = ehMesAtual
    ? calcularSaldoPrevisto(
        saldoTotal,
        (recorrenciasAtivas ?? [])
          .filter((r) => !r.data_fim || r.data_fim >= mesAtualISO + "-31")
          .map((r) => ({ tipo: r.tipo, valor: r.valor, diaMes: r.dia_mes })),
        hoje.getDate()
      )
    : null;

  const inicioMesSelecionado = primeiroDiaDoMes(mesSelecionado + "-01");
  const fimMesSelecionado = ultimoDiaDoMes(mesSelecionado + "-01");
  const transacoesDoMes = transacoes.filter(
    (t) => t.data >= inicioMesSelecionado && t.data <= fimMesSelecionado
  );
  const receitasDoMes = transacoesDoMes
    .filter((t) => t.tipo === "receita")
    .reduce((acc, t) => acc + t.valor, 0);
  const despesasDoMes = transacoesDoMes
    .filter((t) => t.tipo === "despesa")
    .reduce((acc, t) => acc + t.valor, 0);

  // Orçamento por categoria (só categorias de despesa com meta definida)
  // e o gráfico de pizza usam a mesma consulta já feita lá em cima
  // (`todasCategoriasDespesa` / `categorias`) — nada novo aqui.

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
  const ultimasTransacoes = transacoesDoMes.slice(0, 10);

  const blocosFinancas: Record<string, ReactNode> = {
    calendario: (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-ink-400">Calendário de gastos</p>
          <Link
            href="/financas/personalizar"
            className="text-xs text-ink-400 hover:text-ink-100 transition"
          >
            ↕ Personalizar ordem
          </Link>
        </div>
        <CalendarioGastos
          anoMesISO={mesSelecionado}
          gastosPorDia={gastosPorDia}
          diasComContaAPagar={diasComContaAPagar}
        />
      </div>
    ),
    grafico:
      dadosGrafico.length > 0 ? (
        <div className="mb-6">
          <p className="text-sm text-ink-400 mb-3 capitalize">Despesas por categoria · {nomeDoMesSelecionado}</p>
          <GraficoDespesasCategoria dados={dadosGrafico} />
        </div>
      ) : null,
    lancamentos: (
      <>
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
            {ultimasTransacoes.map((t: any) => (
              <li key={t.id} className="bg-base-800 border border-base-600 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="relative shrink-0">
                    <span
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${classeFundoSuave(
                        t.financa_categorias?.cor ?? "financa"
                      )}`}
                    >
                      {t.financa_categorias?.icone ?? (t.tipo === "receita" ? "💰" : "💸")}
                    </span>
                    {mapaNomes.has(t.dono_id) && (
                      <span
                        title={t.dono_id === user?.id ? "Você" : mapaNomes.get(t.dono_id) ?? "Alguém"}
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-semibold border-2 border-base-800 ${
                          t.dono_id === user?.id ? "bg-base-600 text-ink-400" : "bg-nota-soft text-nota"
                        }`}
                      >
                        {(t.dono_id === user?.id ? "V" : (mapaNomes.get(t.dono_id) ?? "?")).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <p className="text-sm truncate flex-1 min-w-0">
                    {t.descricao || mapaContas.get(t.conta_id)}
                  </p>
                  <span
                    className={`font-mono text-sm shrink-0 ${
                      t.tipo === "receita" ? "text-habito" : "text-red-400"
                    }`}
                  >
                    {t.tipo === "receita" ? "+" : "-"}
                    <ValorMonetario valor={t.valor} />
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1.5 pl-12">
                  <p className="text-xs text-ink-400 truncate min-w-0">
                    {new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")} ·{" "}
                    {mapaContas.get(t.conta_id)}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/financas/${t.id}/editar`}
                      className="text-ink-400 hover:text-ink-100 transition text-xs shrink-0"
                    >
                      Editar
                    </Link>
                    <BotaoRemoverTransacao transacaoId={t.id} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </>
    ),
  };

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto">
      <LinkVoltar href="/dashboard" texto="Painel" />
      <h1 className="text-2xl font-display font-semibold mt-2 mb-6">Finanças</h1>

      {searchParams.offline && (
        <p className="mb-4 text-sm text-financa bg-financa-soft border border-financa/30 rounded-lg px-3 py-2">
          📦 Lançamento guardado — vai ser criado automaticamente assim que a internet voltar.
        </p>
      )}

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
          {/* Saldo atual + previsto, navegação por mês, receitas/despesas */}
          <HeroFinancas
            saldo={saldoTotal}
            saldoPrevisto={saldoPrevisto}
            receitas={receitasDoMes}
            despesas={despesasDoMes}
            nomeMes={nomeDoMesSelecionado}
            pessoas={pessoasCompartilhadas}
            hrefMesAnterior={`/financas?mes=${mesAnteriorISO}`}
            hrefMesProximo={`/financas?mes=${mesProximoISO}`}
            hrefHoje="/financas"
            ehMesAtual={ehMesAtual}
          />

          {/* Lista de contas com o saldo de cada uma */}
          <ListaContasComSaldo contas={contasComSaldo} />

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

          {ordemBlocos.map((blocoId) => (
            <div key={blocoId}>{blocosFinancas[blocoId]}</div>
          ))}
        </>
      )}
    </main>
  );
}
