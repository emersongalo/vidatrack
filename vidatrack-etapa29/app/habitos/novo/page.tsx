import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { criarHabito } from "../actions";
import { FormularioHabito } from "@/components/FormularioHabito";

export default async function NovoHabitoPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const supabase = createClient();
  const { data: categorias } = await supabase
    .from("categorias_produtividade")
    .select("id, nome")
    .order("nome");

  return (
    <main className="max-w-md mx-auto px-6 md:px-12 pt-2">
      <Link href="/habitos" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Hoje
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Novo hábito</h1>

      {searchParams.erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(searchParams.erro)}
        </p>
      )}

      <FormularioHabito action={criarHabito} categorias={categorias ?? []} textoBotao="Criar hábito" />
    </main>
  );
}
