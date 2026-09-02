import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { criarNota, alternarFixarNota } from "./actions";
import { LinkVoltar } from "@/components/LinkVoltar";

export default async function NotasPage({
  searchParams,
}: {
  searchParams: { erro?: string; q?: string };
}) {
  const supabase = createClient();
  const busca = searchParams.q?.trim() ?? "";

  let consulta = supabase
    .from("notas")
    .select("id, titulo, conteudo, atualizado_em, fixada")
    .eq("arquivado", false);

  if (busca) {
    consulta = consulta.or(`titulo.ilike.%${busca}%,conteudo.ilike.%${busca}%`);
  }

  const { data: notas } = await consulta
    .order("fixada", { ascending: false })
    .order("atualizado_em", { ascending: false });

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <LinkVoltar href="/dashboard" texto="Painel" />
          <h1 className="text-2xl font-display font-semibold mt-2">Notas</h1>
          <Link href="/notas/lixeira" className="text-ink-400 text-xs hover:text-ink-100 transition">
            Lixeira
          </Link>
        </div>
        <form action={criarNota}>
          <input type="hidden" name="titulo" value="Sem título" />
          <button
            type="submit"
            className="bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition"
          >
            + Nova nota
          </button>
        </form>
      </div>

      <form method="get" className="mb-5">
        <input
          name="q"
          type="search"
          defaultValue={busca}
          placeholder="Buscar por título ou conteúdo..."
          className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-sm text-ink-100 focus:border-ink-100 outline-none transition"
        />
      </form>

      {searchParams.erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(searchParams.erro)}
        </p>
      )}

      {!notas || notas.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
          <p className="font-display font-semibold mb-1">
            {busca ? "Nada encontrado" : "Nenhuma nota ainda"}
          </p>
          <p className="text-ink-400 text-sm">
            {busca
              ? "Tenta buscar por outra palavra."
              : "Crie a primeira para começar a organizar suas ideias."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {notas.map((nota) => (
            <div key={nota.id} className="relative group">
              <Link
                href={`/notas/${nota.id}`}
                className="block bg-base-800 border border-base-600 border-l-4 border-l-nota rounded-xl2 p-4 hover:border-nota transition"
              >
                <p className="font-medium truncate mb-1 pr-6">{nota.titulo}</p>
                <p className="text-ink-400 text-sm line-clamp-3 whitespace-pre-wrap">
                  {nota.conteudo || "Sem conteúdo ainda"}
                </p>
                <p className="text-ink-400 text-xs mt-3">
                  {new Date(nota.atualizado_em).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
              </Link>
              <form action={alternarFixarNota.bind(null, nota.id)} className="absolute top-3 right-3">
                <button
                  type="submit"
                  aria-label={nota.fixada ? "Desafixar nota" : "Fixar nota"}
                  className={`text-sm transition ${
                    nota.fixada ? "text-nota" : "text-ink-400 opacity-0 group-hover:opacity-100"
                  }`}
                >
                  📌
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
