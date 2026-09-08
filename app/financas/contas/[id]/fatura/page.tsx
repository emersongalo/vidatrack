import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcularPeriodoFatura, calcularVencimentoFatura, periodoFaturaAdjacente } from "@/lib/financas/fatura";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { IconeCategoria } from "@/components/IconeCategoria";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FaturaCartaoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { fim?: string };
}) {
  const supabase = createClient();

  const { data: conta } = await supabase
    .from("financa_contas")
    .select("id, nome, banco, dia_fechamento, dia_vencimento")
    .eq("id", params.id)
    .single();

  if (!conta || !conta.dia_fechamento || !conta.dia_vencimento) notFound();

  const hoje = new Date().toLocaleDateString("sv-SE");

  // Sem período pedido na URL: mostra a fatura FECHADA (a que está
  // vencendo), não a que ainda está acumulando — é a pergunta mais
  // comum de quem abre essa tela ("quanto eu tenho que pagar").
  const periodoAtualAberto = calcularPeriodoFatura(conta.dia_fechamento, hoje);
  const periodo = searchParams.fim
    ? calcularPeriodoFatura(conta.dia_fechamento, searchParams.fim)
    : periodoFaturaAdjacente(conta.dia_fechamento, periodoAtualAberto.fim, -1);

  const vencimento = calcularVencimentoFatura(conta.dia_vencimento, periodo.fim);
  const ehFaturaAberta = periodo.fim === periodoAtualAberto.fim;

  const { data: transacoes } = await supabase
    .from("financa_transacoes")
    .select("id, valor, descricao, data, tipo, financa_categorias(nome, icone)")
    .eq("conta_id", conta.id)
    .gte("data", periodo.inicio)
    .lte("data", periodo.fim)
    .order("data", { ascending: false });

  const total = (transacoes ?? []).reduce(
    (soma, t) => soma + (t.tipo === "despesa" ? Number(t.valor) : -Number(t.valor)),
    0
  );

  const anterior = periodoFaturaAdjacente(conta.dia_fechamento, periodo.fim, -1);
  const proximo = periodoFaturaAdjacente(conta.dia_fechamento, periodo.fim, 1);

  function formatarPeriodo(iso: string) {
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

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
          <Link
            href={`/financas/contas/${conta.id}/fatura?fim=${anterior.fim}`}
            className="text-ink-400 hover:text-ink-100 transition text-sm"
          >
            ← Anterior
          </Link>
          {!ehFaturaAberta ? (
            <span className="text-xs bg-financa/15 text-financa rounded-full px-2.5 py-1">Fechada</span>
          ) : (
            <span className="text-xs bg-base-700 text-ink-400 rounded-full px-2.5 py-1">Em aberto</span>
          )}
          <Link
            href={`/financas/contas/${conta.id}/fatura?fim=${proximo.fim}`}
            className="text-ink-400 hover:text-ink-100 transition text-sm"
          >
            Próxima →
          </Link>
        </div>

        <p className="text-xs text-ink-400 mb-1">
          {ehFaturaAberta ? "Total até agora" : "Total da fatura"}
        </p>
        <p className="text-3xl font-mono font-bold mb-3">{formatarMoeda(total)}</p>
        <p className="text-sm text-ink-400">
          Vencimento: <span className="text-ink-100">{new Date(vencimento + "T00:00:00").toLocaleDateString("pt-BR")}</span>
        </p>
      </div>

      <p className="text-sm text-ink-400 mb-3">Lançamentos dessa fatura</p>
      <ul className="space-y-2">
        {(transacoes ?? []).map((t) => (
          <li key={t.id} className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg p-3">
            <span className="w-8 h-8 rounded-lg bg-base-700 flex items-center justify-center shrink-0">
              <IconeCategoria icone={(t as any).financa_categorias?.icone} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{t.descricao || (t as any).financa_categorias?.nome || "Sem descrição"}</p>
              <p className="text-xs text-ink-400">{new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")}</p>
            </div>
            <span className={`font-mono text-sm shrink-0 ${t.tipo === "receita" ? "text-habito" : "text-ink-100"}`}>
              {t.tipo === "receita" ? "-" : ""}
              {formatarMoeda(t.valor)}
            </span>
          </li>
        ))}
        {(!transacoes || transacoes.length === 0) && (
          <p className="text-sm text-ink-400">Nenhum lançamento nessa fatura.</p>
        )}
      </ul>
    </main>
  );
}
