import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { removerCategoria } from "../actions";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { classeFundoSuave } from "@/lib/agenda/estilo";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const { data: categorias } = await supabase
    .from("financa_categorias")
    .select("id, nome, tipo, meta_mensal, icone, cor")
    .order("tipo", { ascending: true })
    .order("nome", { ascending: true });

  const receitas = (categorias ?? []).filter((c) => c.tipo === "receita");
  const despesas = (categorias ?? []).filter((c) => c.tipo === "despesa");

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
            ← Finanças
          </Link>
          <h1 className="text-2xl font-display font-semibold mt-2">Categorias</h1>
        </div>
        <Link
          href="/financas/categorias/nova"
          className="bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition"
        >
          + Nova
        </Link>
      </div>

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
                className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg px-3 py-2.5"
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${classeFundoSuave(cat.cor)}`}>
                  {cat.icone}
                </span>
                <span className="flex-1 text-sm truncate">{cat.nome}</span>
                {cat.meta_mensal && (
                  <span className="text-ink-400 font-mono text-xs shrink-0">
                    até {formatarMoeda(Number(cat.meta_mensal))}
                  </span>
                )}
                <Link
                  href={`/financas/categorias/${cat.id}/editar`}
                  className="text-ink-400 hover:text-ink-100 transition text-xs shrink-0"
                >
                  Editar
                </Link>
                <BotaoComConfirmacao acao={removerCategoria.bind(null, cat.id)} textoBotao="Remover" />
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
                className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg px-3 py-2.5"
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${classeFundoSuave(cat.cor)}`}>
                  {cat.icone}
                </span>
                <span className="flex-1 text-sm truncate">{cat.nome}</span>
                <Link
                  href={`/financas/categorias/${cat.id}/editar`}
                  className="text-ink-400 hover:text-ink-100 transition text-xs shrink-0"
                >
                  Editar
                </Link>
                <BotaoComConfirmacao acao={removerCategoria.bind(null, cat.id)} textoBotao="Remover" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {(!categorias || categorias.length === 0) && (
        <p className="text-ink-400 text-sm">Nenhuma categoria ainda.</p>
      )}
    </main>
  );
}
