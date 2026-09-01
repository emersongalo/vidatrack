import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { criarRecorrencia, alternarAtivaRecorrencia, removerRecorrencia } from "./actions";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";

export default async function RecorrentesPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const [{ data: recorrencias }, { data: contas }, { data: categorias }] = await Promise.all([
    supabase
      .from("financa_recorrencias")
      .select("id, tipo, valor, descricao, dia_mes, ativo, financa_contas(nome)")
      .order("dia_mes"),
    supabase.from("financa_contas").select("id, nome").eq("arquivado", false),
    supabase.from("financa_categorias").select("id, nome, tipo"),
  ]);

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-1">Recorrentes</h1>
      <p className="text-ink-400 text-sm mb-6">
        Lançamentos que se repetem todo mês, como aluguel ou salário.
      </p>

      {searchParams.erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(searchParams.erro)}
        </p>
      )}

      {recorrencias && recorrencias.length > 0 && (
        <ul className="space-y-2 mb-8">
          {recorrencias.map((r: any) => (
            <li
              key={r.id}
              className={`flex items-center justify-between bg-base-800 border border-base-600 rounded-lg p-3 ${
                !r.ativo ? "opacity-50" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {r.descricao || r.financa_contas?.nome}
                </p>
                <p className="text-xs text-ink-400">
                  Todo dia {r.dia_mes} · {r.financa_contas?.nome}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`font-mono text-sm ${r.tipo === "receita" ? "text-habito" : "text-red-400"}`}
                >
                  {r.tipo === "receita" ? "+" : "-"}
                  {formatarMoeda(r.valor)}
                </span>
                <form action={alternarAtivaRecorrencia.bind(null, r.id)}>
                  <button type="submit" className="text-ink-400 hover:text-ink-100 transition text-xs">
                    {r.ativo ? "Pausar" : "Ativar"}
                  </button>
                </form>
                <BotaoComConfirmacao acao={removerRecorrencia.bind(null, r.id)} textoBotao="Remover" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {!contas || contas.length === 0 ? (
        <p className="text-ink-400 text-sm">Crie uma conta primeiro para adicionar recorrências.</p>
      ) : (
        <>
          <p className="text-sm text-ink-400 mb-3">Nova recorrência</p>
          <form action={criarRecorrencia} className="space-y-3">
            <select
              name="tipo"
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
            <input
              name="valor"
              type="text"
              inputMode="decimal"
              required
              placeholder="Valor (ex: 1500,00)"
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
            />
            <select
              name="contaId"
              required
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            >
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <select
              name="categoriaId"
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            >
              <option value="">Sem categoria</option>
              {(categorias ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <div>
              <label htmlFor="diaMes" className="block text-sm text-ink-400 mb-1">
                Todo dia (1 a 28)
              </label>
              <input
                id="diaMes"
                name="diaMes"
                type="number"
                min={1}
                max={28}
                defaultValue={5}
                className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
              />
            </div>
            <input
              name="descricao"
              type="text"
              placeholder="Descrição (ex: Aluguel, Salário)"
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            />
            <button
              type="submit"
              className="w-full bg-ink-100 text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition"
            >
              Criar recorrência
            </button>
          </form>
          <p className="text-xs text-ink-400 mt-3">
            O lançamento do mês é criado automaticamente na primeira vez
            que você abrir o app naquele mês, a partir do dia escolhido —
            não é um agendador rodando sozinho no fundo.
          </p>
        </>
      )}
    </main>
  );
}
