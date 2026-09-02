import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PainelCompartilhamento } from "@/components/PainelCompartilhamento";

export default async function CompartilharContaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const { data: conta } = await supabase
    .from("financa_contas")
    .select("id, nome")
    .eq("id", params.id)
    .single();

  if (!conta) notFound();

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href="/financas/contas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Contas
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-1">Compartilhar</h1>
      <p className="text-ink-400 text-sm mb-6">{conta.nome}</p>
      <p className="text-xs text-ink-400 mb-6 bg-base-800 border border-base-600 rounded-lg px-3 py-2">
        Quem tiver acesso a essa conta vê e lança transações nela — as
        categorias continuam pessoais de cada um.
      </p>

      <PainelCompartilhamento
        tipoItem="financa"
        itemId={conta.id}
        caminhoRetorno={`/financas/contas/${conta.id}/compartilhar`}
        erro={searchParams.erro}
      />
    </main>
  );
}
