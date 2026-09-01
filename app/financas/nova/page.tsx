import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FormularioTransacao } from "@/components/FormularioTransacao";

export default async function NovaTransacaoPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const { data: contas } = await supabase
    .from("financa_contas")
    .select("id, nome")
    .eq("arquivado", false)
    .order("criado_em", { ascending: true });

  const { data: categorias } = await supabase
    .from("financa_categorias")
    .select("id, nome, tipo")
    .order("nome", { ascending: true });

  if (!contas || contas.length === 0) {
    return (
      <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
        <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
          ← Finanças
        </Link>
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center mt-6">
          <p className="font-display font-semibold mb-1">Crie uma conta primeiro</p>
          <p className="text-ink-400 text-sm mb-4">
            Todo lançamento precisa estar ligado a uma conta (carteira, banco ou cartão).
          </p>
          <Link
            href="/financas/contas"
            className="inline-block bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition"
          >
            Criar conta
          </Link>
        </div>
      </main>
    );
  }

  return (
    <FormularioTransacao
      contas={contas}
      categorias={categorias ?? []}
      erro={searchParams.erro}
    />
  );
}
