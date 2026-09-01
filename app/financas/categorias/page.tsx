import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { criarCategoria } from "../actions";
import { formatarMoeda } from "@/lib/financas/formatacao";

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const { data: categorias } = await supabase
    .from("financa_categorias")
    .select("id, nome, tipo, meta_mensal")
    .order("tipo", { ascending: true })
    .order("nome", { ascending: true });

  const receitas = (categorias ?? []).filter((c) => c.tipo === "receita");
  const despesas = (categorias ?? []).filter((c) => c.tipo === "despesa");

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Categorias</h1>

      {searchParams.erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(searchParams.erro)}
        </p>
      )}

      {despesas.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-ink-400 mb-2 uppercase tracking-wide">Despesas</p>
          <ul className="space-y-1.5">
            {despesas.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center justify-between bg-base-800 border border-base-600 rounded-lg px-3 py-2 text-sm"
              >
                <span>{cat.nome}</span>
                {cat.meta_mensal && (
                  <span className="text-ink-400 font-mono text-xs">
                    até {formatarMoeda(Number(cat.meta_mensal))}/mês
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {receitas.length > 0 && (
        <div className="mb-8">
          <p className="text-xs text-ink-400 mb-2 uppercase tracking-wide">Receitas</p>
          <ul className="space-y-1.5">
            {receitas.map((cat) => (
              <li
                key={cat.id}
                className="bg-base-800 border border-base-600 rounded-lg px-3 py-2 text-sm"
              >
                {cat.nome}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-ink-400 mb-3">Nova categoria</p>
      <form action={criarCategoria} className="space-y-3">
        <input
          name="nome"
          type="text"
          required
          placeholder="Ex: Assinaturas, Educação"
          className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
        />
        <select
          name="tipo"
          className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
        >
          <option value="despesa">Despesa</option>
          <option value="receita">Receita</option>
        </select>
        <input
          name="metaMensal"
          type="text"
          inputMode="decimal"
          placeholder="Meta mensal (opcional, ex: 400,00)"
          className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
        />
        <button
          type="submit"
          className="w-full bg-ink-100 text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition"
        >
          Criar categoria
        </button>
      </form>
    </main>
  );
}
